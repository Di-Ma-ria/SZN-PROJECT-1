import express from 'express';

import {placeOrder, getMyOrders, getSingleOrder, getAllOrders, updateOrderStatus, cancelOrder, getSalesAnalytics} from '../controllers/orderController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';

import { requireVerified } from '../middlewares/authMiddleware.js';

import { isAdmin }        from '../middlewares/adminMiddleware.js';

import validate from '../validation/validate.js';

import { placeOrderSchema, updateOrderStatusSchema,cancelOrderSchema } from '../validation/orderValidation.js';

import { requireProfileComplete } from '../middlewares/authMiddleware.js';

const orderRoutes = express.Router();

orderRoutes.get('/',authMiddleware, isAdmin, getAllOrders);

orderRoutes.get('/analytics',authMiddleware, isAdmin, getSalesAnalytics);

orderRoutes.get('/my-orders',authMiddleware, getMyOrders);

// Customer routes

orderRoutes.post('/',authMiddleware,requireVerified, requireProfileComplete, validate(placeOrderSchema), placeOrder);

orderRoutes.get('/:id',authMiddleware, getSingleOrder);

orderRoutes.patch('/:id/cancel',authMiddleware,validate(cancelOrderSchema) ,cancelOrder);

//Admin routes

orderRoutes.patch('/:id/status',authMiddleware, isAdmin,validate(updateOrderStatusSchema) ,updateOrderStatus);

export default orderRoutes;