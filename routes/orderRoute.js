import express from 'express';
import {
  placeOrder, getMyOrders, getSingleOrder,
  getAllOrders, updateOrderStatus, cancelOrder,
  getSaleAnalytics,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { isAdmin }        from '../middlewares/adminMiddleware.js';
import validate from '../validation/validate.js';
import { placeOrderSchema, updateOrderStatusSchema,cancelOrderSchema } from '../validation/orderValidation.js';

const orderRoutes = express.Router();

// Customer routes
orderRoutes.post('/',authMiddleware,validate(placeOrderSchema) ,placeOrder);
orderRoutes.get('/my-orders',authMiddleware, getMyOrders);
orderRoutes.get('/analytics',authMiddleware, isAdmin, getSaleAnalytics);
orderRoutes.get('/',authMiddleware, isAdmin, getAllOrders);
orderRoutes.get('/:id',authMiddleware, getSingleOrder);
orderRoutes.patch('/:id/status',authMiddleware, isAdmin,validate(updateOrderStatusSchema) ,updateOrderStatus);
orderRoutes.patch('/:id/cancel',authMiddleware,validate(cancelOrderSchema) ,cancelOrder);

export default orderRoutes;