

import Joi from 'joi';

// REGISTER 
export const registerSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      'any.required': 'Name is required',
      'string.empty': 'Name cannot be empty',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min':   'Password must be at least 8 characters',
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
    }),

  phone: Joi.string()
    .optional(),
    //.messages({
      //'string.empty': 'Phone number cannot be empty',
    //}),

  address: Joi.object({
    street:  Joi.string()
    .optional(),

    city: Joi.string()
    .optional(),

    state: Joi.string()
    .optional(),

    country: Joi.string()
    .optional(),

  }).optional(),
});

// LOGIN 
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
    }),
});

//UPDATE PROFILE
// Address is optional but if provided all fields must be filled
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .optional()
    .messages({
      'string.empty': 'Name cannot be empty',
    }),

  phone: Joi.string()
    .optional()
    .messages({
      'string.empty': 'Phone number cannot be empty',
    }),

  
  address: Joi.object({
    street: Joi.string()
      .required()
      .messages({
        'any.required': 'Street is required',
        'string.empty': 'Street cannot be empty',
      }),
    city: Joi.string()
      .required()
      .messages({
        'any.required': 'City is required',
        'string.empty': 'City cannot be empty',
      }),
    state: Joi.string()
      .required()
      .messages({
        'any.required': 'State is required',
        'string.empty': 'State cannot be empty',
      }),
    country: Joi.string()
      .required()
      .messages({
        'any.required': 'Country is required',
        'string.empty': 'Country cannot be empty',
      }),
  }).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Please provide at least one field to update',
  });

//CHANGE PASSWORD 
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Old password is required',
      'string.empty': 'Old password cannot be empty',
    }),

  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min':   'New password must be at least 8 characters',
      'any.required': 'New password is required',
      'string.empty': 'New password cannot be empty',
    }),
});

// DELETE ACCOUNT (Step 1 — confirm password)
export const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required to delete your account',
      'string.empty': 'Password cannot be empty',
    }),
});

// CONFIRM DELETE (Step 2 — verify OTP) 
export const confirmDeleteSchema = Joi.object({
  otp: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'any.required':  'OTP is required',
      'string.empty':  'OTP cannot be empty',
    }),
});

//APPLY FOR SELLER 
export const applyForSellerSchema = Joi.object({
  storeName: Joi.string()
    .required()
    .messages({
      'any.required': 'Store name is required',
      'string.empty': 'Store name cannot be empty',
    }),

  storeDescription: Joi.string()
    .required()
    .messages({
      'any.required': 'Store description is required',
      'string.empty': 'Store description cannot be empty',
    }),

  bankName: Joi.string()
    .required()
    .messages({
      'any.required': 'Bank name is required',
      'string.empty': 'Bank name cannot be empty',
    }),

  accountNumber: Joi.string()
    .required()
    .messages({
      'any.required': 'Account number is required',
      'string.empty': 'Account number cannot be empty',
    }),

  accountName: Joi.string()
    .required()
    .messages({
      'any.required': 'Account name is required',
      'string.empty': 'Account name cannot be empty',
    }),
});

// FORGOT PASSWORD 
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),
});

//  RESET PASSWORD
export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),

  otp: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'any.required':  'OTP is required',
      'string.empty':  'OTP cannot be empty',
    }),

  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min':   'New password must be at least 8 characters',
      'any.required': 'New password is required',
      'string.empty': 'New password cannot be empty',
    }),
});

//  SEND OTP 
export const sendOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),

  purpose: Joi.string()
    .valid('email-verification', 'password-reset', 'account-deletion')
    .required()
    .messages({
      'any.only':     "Purpose must be 'email-verification', 'password-reset' or 'account-deletion'",
      'any.required': 'Purpose is required',
      'string.empty': 'Purpose cannot be empty',
    }),
});

//  VERIFY OTP 
export const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),

  otp: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'any.required':  'OTP is required',
      'string.empty':  'OTP cannot be empty',
    }),

  purpose: Joi.string()
    .valid('email-verification', 'password-reset', 'account-deletion')
    .required()
    .messages({
      'any.only':     "Purpose must be 'email-verification', 'password-reset' or 'account-deletion'",
      'any.required': 'Purpose is required',
      'string.empty': 'Purpose cannot be empty',
    }),
});