import Joi from 'joi';

export const addToCartSchema = Joi.object({
  productId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Product ID is invalid',
      'string.length': 'Product ID is invalid',
      'any.required': 'Product ID is required',
      'string.empty': 'Product ID cannot be empty',
    }),


    quantity: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(1)
      .messages({
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity cannot exceed 100',
        'number.integer': 'Quantity must be a whole number',
      }),
});

//update cart item

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.min': 'Quantity must be a least 1',
      'number.max': 'Quantity cannot exceed 100',
      'number.integer': "Quantity must be a whole number",
      'any.required': 'Quantity is required',
    }),
});