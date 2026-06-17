import express from 'express';
import { register, logIn, getProfile, updateProfile, changePassword, deleteMyAccount, applyForSeller, applyForAdmin } from '../controllers/authController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../validation/validate.js';
import {registerSchema,loginSchema,updateProfileSchema,changePasswordSchema,deleteAccountSchema,applyForSellerSchema} from '../validation/authValidation.js';

const authRoutes = express.Router();

// PUBLIC 

authRoutes.post('/register', validate(registerSchema), register);
authRoutes.post('/login',    validate(loginSchema),    logIn);

// PROTECTED 

authRoutes.get('/me',         authMiddleware, getProfile);

authRoutes.patch('/update',   authMiddleware, validate(updateProfileSchema),  updateProfile);
authRoutes.patch('/password', authMiddleware, validate(changePasswordSchema), changePassword);

authRoutes.delete('/delete-my-account', authMiddleware, validate(deleteAccountSchema), deleteMyAccount);

authRoutes.post('/apply-seller', authMiddleware, validate(applyForSellerSchema), applyForSeller);
authRoutes.post('/apply-admin',  authMiddleware, applyForAdmin);

export default authRoutes;