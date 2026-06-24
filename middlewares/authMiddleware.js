import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

export const authMiddleware = async (req, res, next) => {
  try {

    // Pull token from Authorization header 
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
     
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Session expired. Please log in again'
          : 'Invalid token. Please log in again';

      return res.status(401).json({ success: false, message });
    }

    // Check user still exists

    const user = await User.findById(decoded.id).select(
      '-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil'
    );

    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    // Check account is not suspended 

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Your account has been suspended. Reason: ${
          user.suspensionReason || 'Contact support for details'
        }`,
      });
    }

    //Check password hasn't changed after token was issued 

    if (user.passwordChangedAt) {
      const passwordChangedTime = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );
      if (decoded.iat < passwordChangedTime) {
        return res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again',
        });
      }
    }

    // ── 6. Attach user to request 
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};