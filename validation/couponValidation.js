import Joi from 'joi';

export const createCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).required().messages({
    'string.min':   'Coupon code must be at least 3 characters',
    'string.max':   'Coupon code cannot exceed 20 characters',
    'any.required': 'Coupon code is required',
    'string.empty': 'Coupon code cannot be empty',
  }),
  discountType: Joi.string().valid('percentage', 'fixed').required().messages({
    'any.only':     "Discount type must be 'percentage' or 'fixed'",
    'any.required': 'Discount type is required',
  }),
  discountValue: Joi.number().min(1).required().messages({
    'number.min':   'Discount value must be at least 1',
    'any.required': 'Discount value is required',
  }),
  minOrderAmount: Joi.number().min(0).optional(),
  maxUsage:       Joi.number().min(1).optional(),
  expiresAt:      Joi.date().greater('now').required().messages({
    'date.greater': 'Expiry date must be in the future',
    'any.required': 'Expiry date is required',
  }),
});

export const validateCouponSchema = Joi.object({
  code: Joi.string().required().messages({
    'any.required': 'Coupon code is required',
    'string.empty': 'Coupon code cannot be empty',
  }),
  orderAmount: Joi.number().min(1).required().messages({
    'number.min':   'Order amount must be at least 1',
    'any.required': 'Order amount is required',
  }),
});