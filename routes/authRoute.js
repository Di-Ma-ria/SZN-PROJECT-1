import express from 'express';

import { register, logIn, refreshAccessToken, getProfile, updateProfile, changePassword, requestAccountDeletion, deleteMyAccount, applyForSeller, applyForAdmin, resendOtp, verifyOtp, sendOtp, resetPassword, forgotPassword, logOut, getUserLocation,  } from '../controllers/authController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

import validate from '../validation/validate.js';

import {registerSchema,loginSchema,updateProfileSchema,changePasswordSchema,deleteAccountSchema, confirmDeleteSchema, applyForSellerSchema, forgotPasswordSchema, resetPasswordSchema, sendOtpSchema, verifyOtpSchema} from '../validation/authValidation.js';

const authRoutes = express.Router();

// PUBLIC 

authRoutes.get('/location', getUserLocation);

authRoutes.post('/register', validate(registerSchema), register);

authRoutes.post('/login',    validate(loginSchema),    logIn);

authRoutes.post('/refresh', refreshAccessToken);

authRoutes.post('/forgot-password',validate(forgotPasswordSchema),forgotPassword);

authRoutes.post('/reset-password',validate(resetPasswordSchema), resetPassword);

authRoutes.post('/otp/send',validate(sendOtpSchema),sendOtp);

authRoutes.post('/otp/verify',validate(verifyOtpSchema),verifyOtp);

authRoutes.post('/otp/resend',validate(sendOtpSchema),resendOtp);

// PROTECTED 

authRoutes.get('/me',         authMiddleware, getProfile);

authRoutes.patch('/update',   authMiddleware, validate(updateProfileSchema),  updateProfile);

authRoutes.patch('/password', authMiddleware, validate(changePasswordSchema), changePassword);


authRoutes.post('/request-delete', authMiddleware, validate(deleteAccountSchema), requestAccountDeletion);


authRoutes.delete('/delete-my-account',authMiddleware, validate(confirmDeleteSchema),deleteMyAccount);

authRoutes.post('/apply-seller', authMiddleware, validate(applyForSellerSchema), applyForSeller);

authRoutes.post('/apply-admin',  authMiddleware, applyForAdmin);

authRoutes.post(`/logout`,authMiddleware ,logOut)

export default authRoutes;