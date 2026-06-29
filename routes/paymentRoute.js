import express from 'express';
import {
  initializePayment, verifyPayment,
  paystackWebhook, getPaymentHistory,
  refundPayment,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireVerified } from '../middlewares/authMiddleware.js';
import { isAdmin }        from '../middlewares/adminMiddleware.js';

const paymentRoutes = express.Router();

// Webhook: raw body — must be registered BEFORE express.json() in app.js
paymentRoutes.post('/webhook',paystackWebhook);

paymentRoutes.post('/initialize',authMiddleware,requireVerified ,initializePayment);
paymentRoutes.get('/verify/:reference',authMiddleware, verifyPayment);
paymentRoutes.get('/',authMiddleware, isAdmin, getPaymentHistory);
paymentRoutes.post(`/refund/:orderId`, authMiddleware, isAdmin, refundPayment)

export default paymentRoutes;