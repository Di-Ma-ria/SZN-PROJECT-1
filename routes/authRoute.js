import express from 'express';
import { logIn, register } from '../controllers/authController.js';
import validate from '../validation/validate.js';
import { loginSchema, registerSchema } from '../validation/authValidation.js';

const authRoutes = express.Router()

authRoutes.post(`/register`,validate(registerSchema) ,register)
authRoutes.post(`/login`,validate(loginSchema),logIn)

export default authRoutes