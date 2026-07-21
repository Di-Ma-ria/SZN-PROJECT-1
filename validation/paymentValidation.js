import Joi from 'joi';

//INITIALIZE PAYMENT
export const initializePaymentSchema = Joi.object({
  orderId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'any.required': 'Order ID is required',
      'string.empty': 'Order ID cannot be empty',
      'string.hex': 'Order ID is invalid',
      'string.length': 'Order ID must be 24 characters',
    }),

});


//REFUND PAYMENT 
export const refundPaymentSchema = Joi.object({
  reason: Joi.string()
    .optional()
});