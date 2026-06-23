import {User} from "../models/userModel.js";
import crypto from 'crypto';
import generateToken from "../utlis/generateToken.js";

// REGISTER

export const register = async (req, res, next) => {
  
  try {

  const { name, email, password, phone, } = req.body;

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
      phone: phone || null,
      role: "customer",
    });

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN

export const logIn = async (req, res, next) => {
  try{
    const {email, password}=req.body

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
        message: `Your account has been suspended. Reason: ${
          user.suspensionReason || ' Contact support for details'
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
    const token = await generateToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion});

    return res.status(200).json({
      success:true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
        success: false,
        message: 'User not found'
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
export const logOUt = async(req, res, next)=>{
  try{
    await User.findByIdAndDelete(req.user.id, {$inc:{tokenVersion:1} });
    return res.json({success:true, message:"Logged out successfully"})
  }catch(error){
      next(error);
  }
}

//FORGOT PASSWORD -generates a reset token and (eventually) emails it
export const forgotPassword = async(req,res,next)=>{
  try{
    const {email}=req.body;

    const user = await User.findOne({email});
    //always return 200 - dont reveal whether the email exists 
    if(!user) {
      return res.status(200).json({
        success:true,
        message:"if an account with that email exists, a reset link has been sent",
      });
    }

  //Generate a raw token and a hashed version to store
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.passwordResetToken =hashedToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; //15 minutes
  await user.save({validateBeforeSave:false});

  //  TODO: replace this with nodemailer once email is set up
  //const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
  //await sendEmail({to: user.email, subject:'Password Reset', html:`...`});

  //TEMPORARY : return token directly so you can test via postman
  return res.status(200).json({
    success:true,
    message:'Password reset token generated',
    resetToken: rawToken, //remove this line once email is set up
  });
  }catch(error){
     next(error);
  }
};

//Reset password