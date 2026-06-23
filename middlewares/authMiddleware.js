import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token not provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    //Token version check - rejects tokens issued before last logout
    if(decoded.tokenVersion !==user.tokenVersion) {
      return res.status(401).json({success:false, message:"session expired. Please login again"})
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deleted',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: user.suspensionReason
          ? `This account is suspended: ${user.suspensionReason}`
          : 'This account is suspended',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export default authMiddleware;