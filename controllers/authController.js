import {User} from "../models/userModel.js";

import {OTP} from '../models/otpModel.js';


import{sendTemplateEmail} from '../utils/sendEmail.js';

import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";

// to generate 6 digit otp

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();


// REGISTER

export const register = async (req, res, next) => {
  
  try {

  const { name, email, password, phone,address } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      address,
      phone: phone || null,
      role: "customer",
    });


    // send a welcome email

    await sendTemplateEmail(user.email, 'welcome', {name: user.name});

// send otp for email verification automatically

    const otp = generateOtp();
    await OTP.deleteMany({email, purpose: 'email-verification'});
    await OTP.create({
      email,
      otp,
      purpose: 'email-verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendTemplateEmail(email, 'otp', {
      name: user.name,
      otp,
      purpose: 'email-verification',
    });

    const token = await generateAccessToken({
      id: user._id,
      role: user.role
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully, please check your email to verify your account.",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN

export const logIn = async (req, res, next) => {

  try{
    const { email, password } = req.body;

    const user = await User.findOne({ email}).select('+password');
    if(!user) {
      return res.status(401).json({
        success: false,
        message: 'invalid email or password',
      });
    }

    if(user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'This account no longer exists'
      });
    }

    if (user.isSuspended) {
  return res.status(403).json({
    success: false,
    message: `Your account has been suspended. Reason: ${
      user.suspensionReason || 'Contact support for details'
    }`,
  });
}

    if(user.isLocked()) {
      return res.status (423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts.Try again in 2 hours',
      });
    }
    const isMatch = await user.comparePassword(password);
    if(!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    await user.resetLoginAttempts();
//Generate both tokens
    const accessToken = await generateAccessToken({ 
      id: user._id,
      role: user.role
    });
    
    const refreshToken = await generateRefreshToken({ 
      id: user._id 
    });

// Save refresh token to DB for revocation
    user.refreshToken = refreshToken;
    await user.save();
//Send refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true on HTTPS
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.status(200).json({
      success:true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        sellerStatus: user.sellerStatus,
      },
    });

  } catch (error) {
    next(error);
  }
};


//GET MY PROFILE

export const getProfile = async (req, res, next) => {
  try{
    const user = await User.findById(req.user.id).select(
      '-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil'
    );

    if(!user || user.isDeleted) {
      return res.status(404).json({
        success: false, message: 'User not found'
      });
    }

    return res.json({success: true, user});
  } catch(error) {
    next(error);
  }
};

// UPDATE PROFILE 

export const updateProfile = async (req, res, next ) => {
  try{
    const { name, phone, address} = req.body;

    const user = await User.findById(req.user.id);
    if(!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if(name) user.name =name;
    if(phone) user.phone = phone;
    if(address) user.address = address;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error){
    next (error);
  }
};


// CHANGE PASSWORD 

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

//DELETE MY ACCOUNT 

export const deleteMyAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // soft delete — blocks login but preserves data
    user.isDeleted = true;
    user.deletedAt = Date.now();
    await user.save();

    return res.json({ success: true, message: 'Your account has been deleted successfully' });
  } catch (error) {
    next(error);
  }
};


//Send Otp..... used for email-verification and password-reset

export const sendOtp = async (req, res, next) => {
  try{
    const { email, purpose } = req.body;

    const user = await User.findOne({ email, isDeleted: false });
    if(!user) {
      return res.status(404).json({
        success: false, 
        message: 'No account found with this email'
      });
    }

    //delete any existing otp for this email + purpose

    await OTP.deleteMany({ email, purpose});

    const otp = generateOtp();
    await OTP.create({
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });


    await sendTemplateEmail(email, 'otp', {name: user.name, otp, purpose });

    return res.json({
      success: true,
      message: `OTP sent to ${email}.it expires in 10 minutes.`,
    });
  } catch (error) {
    next(error);
  }
};

//verify otp
export const verifyOtp = async (req, res, next) => {
  try{
    const { email, otp, purpose } = req.body;

    const record = await OTP.findOne({email, purpose, verified: false });

    if(!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or already used'
      });
    }

    if(new Date() > record.expiresAt) {
      await record.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired, request a new one.'
      });
    }

    const isMatch = await record.compareOtp(otp);
    if(!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    //mark as verified
    record.verified = true;
    await record.save();

    //if verifying email- mark user as verified

    if(purpose === 'email-verification') {
      await User.findOneAndUpdate({ email}, {isVerified: true });
    }


    return res.json({success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

//resend otp

export const resendOtp = async (req, res, next) => {
  return sendOtp(req, res, next);
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try{
    const { email } = req.body;

    const user = await User.findOne({email, isDeleted: false });
    if(!user) {
      return res.json({
        success: true,
        message: 'If an account with email exists, an OTP has been sent.',
      });
    }

    await OTP.deleteMany({email, purpose: 'password-reset'});

    const otp = generateOtp();
    await OTP.create({
      email,
      otp,
      purpose: 'password-reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendTemplateEmail(email, 'otp', {name: user.name, otp, purpose: 'password-reset'});

    return res.json({
      success: true,
      message: 'If an account with this email exists, an OTP has been sent.',
    });
  } catch (error) {
    next(error);
  }
};


//reset password, user enters OTP + new password
export const resetPassword = async (req, res, next) => {
  try{
    const { email, otp, newPassword } = req.body;

    // check OTP was verified
    const record = await OTP.findOne({
      email, 
      purpose: 'password-reset',
      verified: true,
    });

    if(!record) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your OTP first before resetting your password',
      });
    }

    const user = await User.findOne({ email, isDeleted: false}).select('+password');
    if(!user){
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    //Delete used OTP record
    await record.deleteOne();

    return res.json({
      success: true,
      message: 'Password reset successfully. Please log in.'
    });
  } catch (error) {
    next(error);
  }
};


//APPLY FOR SELLER 

export const applyForSeller = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'seller' || user.sellerStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'You are already an approved seller' });
    }

    if (user.sellerStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Your seller application is already pending review' });
    }

    const { storeName, storeDescription, storeAddress, bankDetails } = req.body;

    user.sellerStatus                   = 'pending';
    user.sellerProfile.storeName        = storeName;
    user.sellerProfile.storeDescription = storeDescription;
    user.sellerProfile.storeAddress     = storeAddress;
    user.sellerProfile.bankDetails      = bankDetails;

    await user.save();

    return res.json({
      success: true,
      message: 'Seller application submitted successfully. Pending admin review',
    });
  } catch (error) {
    next(error);
  }
};

// APPLY FOR ADMIN 

export const applyForAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (['admin', 'superadmin'].includes(user.role)) {
      return res.status(400).json({ success: false, message: 'You are already an admin' });
    }

    if (user.adminStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Your admin application is already pending review' });
    }

    user.adminStatus = 'pending';
    await user.save();

    return res.json({
      success: true,
      message: 'Admin application submitted successfully. Pending superadmin review',
    });
  } catch (error) {
    next(error);
  }
};
//LOGOUT -invalidates all tokens issued before this moment
// export const logOut = async(req, res, next)=>{
//   try{
//     await User.findByIdAndUpdate(req.user.id, {$inc:{tokenVersion:1} });
//     return res.json({success:true, message:"Logged out successfully"})
//   }catch(error){
//       next(error);
//   }
// } 
export const logOut = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};