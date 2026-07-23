

import jwt from 'jsonwebtoken';

import { User } from '../models/userModel.js';

import { OTP }  from '../models/otpModel.js';

import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

//to generate 6 digit otp

import { sendTemplateEmail } from '../utils/sendEmail.js';

//Internal OTP generator 

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();


// REGISTER

export const register = async (req, res, next) => {
  try {
  
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    //  Create user without address or phone
    const user = await User.create({
      name,
      email,
      password,
      role:   'customer',
      profileComplete: false,
    });

    const otp = generateOtp();
    await OTP.deleteMany({ email, purpose: 'email-verification' });
    await OTP.create({
      email,
      otp,
      purpose:   'email-verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const accessToken = await generateAccessToken({
      id:   user._id,
      role: user.role,
    });

    // Respond immediately with profileComplete: false.  This tells the frontend to prompt user to complete profile
    res.status(201).json({
      success:   true,
      message:   'Account created successfully. Please check your email to verify your account.',
      accessToken,
      profileComplete: false,
      nextStep:  'Please complete your profile by adding your phone number and delivery address.',
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        profileComplete: false,
      },
    });

    // Send OTP email in background — no welcome email yet
    // Welcome email sent after verification in verifyOtp
    sendTemplateEmail(email, 'otp', {
      name:  user.name,
      otp,
      purpose: 'email-verification',
    }).catch(err => console.error('OTP email failed:', err.message));

  } catch (error) {
    next(error);
  }
};

// LOGIN

export const logIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isDeleted: false })
      .select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Your account has been suspended. Reason: ${
          user.suspensionReason || 'Contact support'
        }`,
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil    = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 15 minutes.',
        });
      }

      await user.save();
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${5 - user.loginAttempts} attempt(s) remaining.`,
      });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil     = null;

    const accessToken  = await generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = await generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success:         true,
      message:         'Login successful',
      accessToken,
      profileComplete: user.profileComplete,
      //  Remind user to complete profile if not done
      nextStep:        !user.profileComplete
        ? 'Please complete your profile by adding your phone and address.'
        : null,
      user: {
        id:        user._id,
        name:      user.name,
        email:     user.email,
        role:       user.role,
        isVerified:      user.isVerified,
        profileComplete: user.profileComplete,
      },
    });
  } catch (error) {
    next(error);
  }
};


// GET PROFILE

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // this tell frontend exactly what fields are missing
    const missingFields = [];
    if (!user.phone)             missingFields.push('phone');
    if (!user.address?.street)   missingFields.push('street');
    if (!user.address?.city)     missingFields.push('city');
    if (!user.address?.state)    missingFields.push('state');
    if (!user.address?.country)  missingFields.push('country');

    return res.status(200).json({
      success:         true,
      profileComplete: user.profileComplete,
      missingFields:   missingFields,
      // Remind user to complete profile if not done
      message:         !user.profileComplete
        ? `Please complete your profile. Missing: ${missingFields.join(', ')}`
        : null,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PROFILE

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    const updateData = {};
    if (name)    updateData.name  = name;
    if (phone)   updateData.phone = phone;
    if (address) updateData.address = address;

    //  Mark profile complete when full address is provided
    if (
      address        &&
      address.street &&
      address.city   &&
      address.state  &&
      address.country
    ) {
      updateData.profileComplete = true;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: false }
    ).select('-password');

    return res.status(200).json({
      success:         true,
      message:         updateData.profileComplete
        ? '🎉 Profile completed successfully!'
        : 'Profile updated successfully',
      profileComplete: user.profileComplete,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// CHANGE PASSWORD

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};


// REQUEST ACCOUNT DELETION (Step 1)

export const requestAccountDeletion = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    await OTP.deleteMany({ email: user.email, purpose: 'account-deletion' });

    const otp = generateOtp();
    await OTP.create({
      email:     user.email,
      otp,
      purpose:   'account-deletion',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({
      success: true,
      message: 'OTP sent to your email. Enter it to confirm account deletion.',
    });

    sendTemplateEmail(user.email, 'accountDeletion', {
      name: user.name,
      otp,
    }).catch(err => console.error('Deletion email failed:', err.message));

  } catch (error) {
    next(error);
  }
};


// DELETE MY ACCOUNT (Step 2)

export const deleteMyAccount = async (req, res, next) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const record = await OTP.findOne({
      email:    user.email,
      purpose:  'account-deletion',
      verified: false,
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request account deletion again.',
      });
    }

    if (new Date() > record.expiresAt) {
      await record.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request account deletion again.',
      });
    }

    const isOtpValid = await record.compareOtp(otp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    await record.deleteOne();

    user.isDeleted    = true;
    user.deletedAt    = Date.now();
    user.refreshToken = null;
    await user.save();

    res.clearCookie('refreshToken');

    return res.json({
      success: true,
      message: 'Your account has been deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// SEND OTP

export const sendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    await OTP.deleteMany({ email, purpose });

    const otp = generateOtp();
    await OTP.create({
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({
      success: true,
      message: `OTP sent to ${email}. It expires in 10 minutes.`,
    });

    sendTemplateEmail(email, 'otp', {
      name: user.name,
      otp,
      purpose,
    }).catch(err => console.error('OTP email failed:', err.message));

  } catch (error) {
    next(error);
  }
};

// VERIFY OTP

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    const record = await OTP.findOne({ email, purpose, verified: false });
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or already used',
      });
    }

    if (new Date() > record.expiresAt) {
      await record.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Request a new one.',
      });
    }

    const isMatch = await record.compareOtp(otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    record.verified = true;
    await record.save();

    if (purpose === 'email-verification') {
      const user = await User.findOneAndUpdate(
        { email },
        { isVerified: true },
        { new: true }
      );

      //  Respond immediately
      res.json({
        success:         true,
        message:         'Email verified successfully. Welcome to LODITOJO!',
        profileComplete: user?.profileComplete || false,
        //  Remind user to complete profile after verification
        nextStep:        !user?.profileComplete
          ? 'Please complete your profile by adding your phone and address.'
          : null,
      });

      //  Send welcome email after verification in background
      if (user) {
        sendTemplateEmail(email, 'welcome', { name: user.name })
          .catch(err => console.error('Welcome email failed:', err.message));
      }

      return;
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// RESEND OTP

export const resendOtp = async (req, res, next) => {
  return sendOtp(req, res, next);
};


// FORGOT PASSWORD

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    res.json({
      success: true,
      message: 'If an account exists with this email an OTP has been sent.',
    });

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) return;

    await OTP.deleteMany({ email, purpose: 'password-reset' });

    const otp = generateOtp();
    await OTP.create({
      email,
      otp,
      purpose:   'password-reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    sendTemplateEmail(email, 'otp', {
      name:    user.name,
      otp,
      purpose: 'password-reset',
    }).catch(err => console.error('Forgot password email failed:', err.message));

  } catch (error) {
    next(error);
  }
};

// RESET PASSWORD

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await OTP.findOne({
      email,
      purpose: 'password-reset',
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new one.',
      });
    }

    const isOtpValid = await record.compareOtp(otp);
    if (!isOtpValid || !record.verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unverified OTP',
      });
    }

    const user = await User.findOne({ email, isDeleted: false }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.password = newPassword;
    await user.save();

    await record.deleteOne();

    return res.json({
      success: true,
      message: 'Password reset successfully. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};


// APPLY FOR SELLER

export const applyForSeller = async (req, res, next) => {
  try {
    const {
      storeName,
      storeDescription,
      bankName,
      accountNumber,
      accountName,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (['seller', 'admin', 'superadmin'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a seller or admin',
      });
    }

    if (user.sellerStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending seller application',
      });
    }

    user.sellerStatus   = 'pending';
    user.sellerProfile  = {
      storeName,
      storeDescription,
      bankDetails: { bankName, accountNumber, accountName },
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Seller application submitted. You will be notified once reviewed.',
    });
  } catch (error) {
    next(error);
  }
};


// APPLY FOR ADMIN

export const applyForAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (['admin', 'superadmin'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'You are already an admin',
      });
    }

    if (user.adminStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending admin application',
      });
    }

    user.adminStatus = 'pending';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Admin application submitted. You will be notified once reviewed.',
    });
  } catch (error) {
    next(error);
  }
};

// REFRESH ACCESS TOKEN

export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token no longer valid' });
    }

    const newAccessToken = await generateAccessToken({ id: user._id, role: user.role });

    return res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// LOGOUT

export const logOut = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie('refreshToken');
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};