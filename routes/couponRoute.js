import express from 'express';
import {
  createCoupon, validateCoupon,
  toggleCouponStatus, deleteCoupon,
  getallCoupons,
} from '../controllers/couponController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { isAdmin }        from '../middlewares/adminMiddleware.js';
import validate from '../validation/validate.js';
import { createCouponSchema, validateCouponSchema } from '../validation/couponValidation.js';

const couponRoutes = express.Router();

couponRoutes.post('/validate',authMiddleware,validate(validateCouponSchema) ,validateCoupon); // customer validates at checkout
couponRoutes.post('/',authMiddleware, isAdmin,validate(createCouponSchema) ,createCoupon);
couponRoutes.get('/',authMiddleware, isAdmin, getallCoupons );
couponRoutes.patch('/:id/toggle',authMiddleware, isAdmin, toggleCouponStatus);
couponRoutes.delete('/:id',authMiddleware, isAdmin, deleteCoupon);

export default couponRoutes;