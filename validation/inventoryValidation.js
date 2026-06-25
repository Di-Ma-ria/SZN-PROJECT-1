import Joi from 'joi';

export const updateStockSchema = Joi.object({
    stock:Joi.number().min(0).required()
});

export const restockSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min':   'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
});

export const deductStockSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min':   'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});
