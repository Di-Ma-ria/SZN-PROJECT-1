import express from 'express';

import { register, logIn, getProfile, updateProfile, changePassword, requestAccountDeletion, deleteMyAccount, applyForSeller, applyForAdmin, resendOtp, verifyOtp, sendOtp, resetPassword, forgotPassword, logOut, refreshAccessToken } from '../controllers/authController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

import { loginLimiter, otpLimiter,registerLimiter } from '../middlewares/rateLimiters.js';

import validate from '../validation/validate.js';

import {registerSchema,loginSchema,updateProfileSchema,changePasswordSchema,deleteAccountSchema, confirmDeleteSchema, applyForSellerSchema, forgotPasswordSchema, resetPasswordSchema, sendOtpSchema, verifyOtpSchema} from '../validation/authValidation.js';

const authRoutes = express.Router();

// PUBLIC 

authRoutes.post('/register',registerLimiter ,validate(registerSchema), register);

authRoutes.post('/login', loginLimiter,validate(loginSchema),    logIn);

authRoutes.post('/forgot-password',otpLimiter,validate(forgotPasswordSchema),forgotPassword);

authRoutes.post('/reset-password',validate(resetPasswordSchema), resetPassword);

authRoutes.post('/otp/send',otpLimiter,validate(sendOtpSchema),sendOtp);

authRoutes.post('/otp/verify',validate(verifyOtpSchema),verifyOtp);

authRoutes.post('/otp/resend',otpLimiter,validate(sendOtpSchema),resendOtp);

// PROTECTED 

authRoutes.get('/me',         authMiddleware, getProfile);

authRoutes.patch('/update',   authMiddleware, validate(updateProfileSchema),  updateProfile);

authRoutes.patch('/password', authMiddleware, validate(changePasswordSchema), changePassword);


authRoutes.post('/request-delete', authMiddleware, validate(deleteAccountSchema), requestAccountDeletion);


authRoutes.delete('/delete-my-account',authMiddleware, validate(confirmDeleteSchema),deleteMyAccount);

authRoutes.post('/apply-seller', authMiddleware, validate(applyForSellerSchema), applyForSeller);

authRoutes.post('/apply-admin',  authMiddleware, applyForAdmin);

authRoutes.post(`/refresh`, refreshAccessToken)

authRoutes.post(`/logout`,authMiddleware ,logOut)

export default authRoutes;