import express from 'express';
import { register, logIn, getProfile, updateProfile, changePassword, deleteMyAccount, applyForSeller, applyForAdmin, resendOtp, verifyOtp, sendOtp, resetPassword, forgotPassword, logOut } from '../controllers/authController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';
import validate from '../validation/validate.js';
import {registerSchema,loginSchema,updateProfileSchema,changePasswordSchema,deleteAccountSchema,applyForSellerSchema, forgotPasswordSchema, resetPasswordSchema, sendOtpSchema, verifyOtpSchema} from '../validation/authValidation.js';

const authRoutes = express.Router();

// PUBLIC 

authRoutes.post('/register', validate(registerSchema), register);
authRoutes.post('/login',    validate(loginSchema),    logIn);

authRoutes.post('/forgot-password',validate(forgotPasswordSchema),forgotPassword);
authRoutes.post('/reset-password',validate(resetPasswordSchema), resetPassword);
authRoutes.post('/otp/send',validate(sendOtpSchema),sendOtp);
authRoutes.post('/otp/verify',validate(verifyOtpSchema),verifyOtp);
authRoutes.post('/otp/resend',validate(sendOtpSchema),resendOtp);
// PROTECTED 

authRoutes.get('/me',         authMiddleware, getProfile);

authRoutes.patch('/update',   authMiddleware, validate(updateProfileSchema),  updateProfile);
authRoutes.patch('/password', authMiddleware, validate(changePasswordSchema), changePassword);

authRoutes.delete('/delete-my-account', authMiddleware, validate(deleteAccountSchema), deleteMyAccount);

authRoutes.post('/apply-seller', authMiddleware, validate(applyForSellerSchema), applyForSeller);

authRoutes.post('/apply-admin',  authMiddleware, applyForAdmin);
authRoutes.post(`/logout`,authMiddleware ,logOut)

export default authRoutes;