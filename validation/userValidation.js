import Joi from 'joi';

//THIS HANDLES SELLER APPLICATION

export const handleSellerApplicationSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': "Action must be either 'approve' or 'reject'",
      'any.required': 'Action is required',
      'string.empty': 'Action cannot be empty',
    }),

    reason: Joi.string()
    .when('action', {
      is: 'reject',
      then: Joi.required().messages({
        'any.required': 'Please provide a reason for rejection', 
        'string.empty': 'Rejection reason cannot be empty',
      }),
      otherwise: Joi.optional(),
    }),
});


//HANDLE ADMIN APPLICATION

export const handleAdminApplicationSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject')
      .required()
      .messages({
        'any.only': "action must be either 'approve' or 'reject' ",
        'any.required': 'Action is required',
        'string.empty': 'Action cannot be empty',
      }),

      reason: Joi.string()
      .when('action', {
        is: 'reject',
        then: Joi.required().messages({
          'any.required': 'Please provide a reason for rejection',
          'string.empty': 'Rejection reason cannot be empty',
        }),
        otherwise: Joi.optional(),
      }),
});

//SUSPEND USER

export const  suspendUserSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'Suspension reason must be at least 10 characters',
      'any.required': 'Suspension reason is required',
      'string.empty': 'Suspension reason cannot be empty',
    }),
});