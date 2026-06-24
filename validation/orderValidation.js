import Joi from 'joi';

export const placeOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product:  Joi.string().hex().length(24).required().messages({
          'any.required': 'Product ID is required',
          'string.hex':   'Product ID is invalid',
        }),
        name:     Joi.string().required().messages({ 'any.required': 'Product name is required' }),
        price:    Joi.number().min(0).required().messages({ 'any.required': 'Price is required' }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.min':   'Quantity must be at least 1',
          'any.required': 'Quantity is required',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min':    'Order must have at least one item',
      'any.required': 'Items are required',
    }),

  shippingAddress: Joi.object({
    street:  Joi.string().required().messages({ 'any.required': 'Street is required' }),
    city:    Joi.string().required().messages({ 'any.required': 'City is required' }),
    state:   Joi.string().required().messages({ 'any.required': 'State is required' }),
    country: Joi.string().required().messages({ 'any.required': 'Country is required' }),
  }).required().messages({ 'any.required': 'Shipping address is required' }),

  couponCode:    Joi.string().optional().allow('', null),
  paymentMethod: Joi.string().valid('paystack', 'cod').optional(),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.only':     'Invalid order status',
      'any.required': 'Status is required',
    }),
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().min(5).optional().messages({
    'string.min': 'Cancellation reason must be at least 5 characters',
  }),
});