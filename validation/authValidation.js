import Joi from 'joi';

//Register

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 30 characters',
      'any.required': 'Name is required',
      'string.empty': 'Name cannot be empty',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'please provide a valid email adrress',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages ({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
      'string.empty': 'password cannot be empty',
    }),

  phone: Joi.string()
  .trim()
  .allow('', null)
  .optional(),
    
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
          'any.required' : 'State is required',
          'string.empty': 'State cannot be empty',
        }),

      country: Joi.string()
      .required()
      .messages({
        'any.required': 'Country is required',
        'string.empty': 'Country cannot be empty',
      }),
      
  })
  .required()
  .messages({
    'any.required' : 'Address is required,'
  }),
      
});



// LOGIN

export const loginSchema = Joi.object({
  email: Joi.string ()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address ',
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

// Update 
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(30)
    .messages({
      'string.min': 'Name must be least 3 characters',
      'string.max': 'Name cannot exceed 30 character',
      'string.empty': 'Name cannot be empty',
    }),

  phone: Joi.string()
    .trim()
    .allow('', null).optional(),


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

    }),
})
// ONE FEILD MUST BE PROVIDED
  .min(1)
  .messages({
    'object.min': 'Please provide at least name or address to update',
  });



  //change password

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
        'string.min': 'New password must be at least 8 characters',
        'any.required': 'New password is required',
        'string.empty': 'New password cannot be empty',
    }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Password do not match',
        'any.required': 'Please confirm your new password',
        'string.empty': 'Confirm password cannot be empty',
      }),
});




// Confirm delete — user enters OTP
export const confirmDeleteSchema = Joi.object({
  otp: Joi.string()
  .length(6)
  .required()
  .messages({
    'string.length': 'OTP must be 6 digits',
    'any.required':  'OTP is required',
    'string.empty':  'OTP cannot be empty',
  }),
});

// delete own account 

export const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Please enter your password to confirm deletion',
      'string.empty': 'password cannot be empty',
    }),
});

// APPLY FOR SELLER 

export const applyForSellerSchema = Joi.object({
  storeName: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min':   'Store name must be at least 3 characters',
      'string.max':   'Store name cannot exceed 50 characters',
      'any.required': 'Store name is required',
      'string.empty': 'Store name cannot be empty',
    }),

  storeDescription: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min':   'Store description must be at least 10 characters',
      'string.max':   'Store description cannot exceed 500 characters',
      'any.required': 'Store description is required',
      'string.empty': 'Store description cannot be empty',
    }),

  storeAddress: Joi.object({
    street:  Joi.string()
    .required()
    .messages({ 'any.required': 'Store street is required'}),

    city:    Joi.string()
    .required()
    .messages({ 'any.required': 'Store city is required' }),

    state:   Joi.string()
    .required()
    .messages({ 'any.required': 'Store state is required'}),

    country: Joi.string()
    .required()
    .messages({ 'any.required': 'Store country is required' }),

  })
  .required().messages({ 'any.required': 'Store address is required'}),

  bankDetails: Joi.object({
    bankName:      Joi.string()
    .required()
    .messages({ 'any.required': 'Bank name is required'}),


    accountNumber: Joi.string()
    .required()
    .messages({ 'any.required': 'Account number is required' }),

    accountName:   Joi.string()
    .required()
    .messages({ 'any.required': 'Account name is required' }),

  })
  .required().messages({ 'any.required': 'Bank details are required' }),
});


export const sendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  purpose: Joi.string()
    .valid('email-verification', 'password-reset', 'account-deletion')
    .required()
    .messages({
      'any.only': "Purpose must be 'email-verification', 'password-reset' or 'account-deletion'",
      'any.required': 'Purpose is required',
    }),
});


export const verifyOtpSchema = Joi.object({
  email: Joi.string()
  .email().required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  otp: Joi.string()
  .length(6)
  .required()
  .messages({
    'string.length': 'OTP must be 6 digits',
    'any.required':  'OTP is required',
    'string.empty':  'OTP cannot be empty',
  }),
  purpose: Joi.string()
    .valid('email-verification', 'password-reset', 'account-deletion')
    .required()
    .messages({
      'any.only': "Purpose must be 'email-verification', 'password-reset' or 'account-deletion'",
      'any.required': 'Purpose is required',
    }),
});


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

export const resetPasswordSchema = Joi.object({
  email: Joi.string()
  .email()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  otp: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be 6 digits',
    'any.required':  'OTP is required',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min':   'New password must be at least 8 characters',
    'any.required': 'New password is required',
    'string.empty': 'New password cannot be empty',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only':     'Passwords do not match',
    'any.required': 'Please confirm your new password',
  }),
});