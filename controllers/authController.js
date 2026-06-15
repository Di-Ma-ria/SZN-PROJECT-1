import {User} from "../models/userModel.js";
import generateToken from '../utlis/generateToken.js'
// REGISTER
export const register = async (req, res, next) => {
  try {
    // validate request body
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    const { name, email, password, phone } = value;

    // check if email is already taken
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
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN
export const logIn = async (req, res, next) => {
  try {
    // validate request body
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    const { email, password } = value;

    // fetch user and include password 
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // check if account is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Your account has been suspended. Reason: ${user.suspensionReason || "Contact support for details"}`,
      });
    }

    // check if account is  deleted
    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "This account no longer exists",
      });
    }

    // check if account is locked from too many failed attempts
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Your account is temporarily locked due to too many failed login attempts. Try again in 2 hours",
      });
    }

    // compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // increment failed attempts before responding
      await user.incrementLoginAttempts();

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // password correct 
    await user.resetLoginAttempts();

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: "Login successful",
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