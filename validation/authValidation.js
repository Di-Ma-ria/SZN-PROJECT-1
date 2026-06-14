import Joi from 'joi';

//register

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(30)
    .required()
    .message({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 30 characters',
      'any.required': 'Name is required',
      'string.empty': 'Name cannot be empty',
    }),

  email: Joi.string()
    .email()
    .required()
    .message({
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
    
    address: Joi.object({
      street: Joi.string()
        .required()
        .message({
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
        .message({
          'any.requested' : 'State is required',
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
  .message({
    'any.required' : 'Address is required,'
  }),
      
});




// LOGIN

export const loginSchema = Joi.object({
  email: Joi.string ()
    .email()
    .required()
    .message({
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
    .message({
      'string.min': 'Name must be least 3 characters',
      'string.max': 'Name cannot exceed 30 character',
      'string.empty': 'Name cannot be empty',
    }),

    address: Joi.object({
      street: Joi.string()
          .required()
          .message({
            'any.required': 'Street is required',
            'string.empty': 'Street cannot be empty',
          }),
      city: Joi.string()
          .required()
          .message({
            'any.required': 'City is required',
            'string.empty': 'City cannot be empty',
          }),

      state: Joi.string()
      .required()
      .message({
        'any.required': 'State is required',
        'string.empty': 'State cannot be empty',
      }),

      country: Joi.string()
      .required()
      .message({
        'any.required': 'Country is required',
        'string.empty': 'Country cannot be empty',
       }),

    }),
})
// ONE FEILD MUST BE PROVIDED
  .min(1)
  .message({
    'object.min': 'Please provide at least name or address to update',
  });




  //change password

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .message({
      'any.required': 'Old password is required',
      'string.empty': 'Old password cannot be empty',
    }),
    newPassword: Joi.string()
      .min(8)
      .required()
      .message({
        'string.min': 'New password must be at least 8 characters',
        'any.required': 'New password is required',
        'string.empty': 'New password cannot be empty',
    }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .message({
        'any.only': 'Password do not match',
        'any.required': 'Please confirm your new password',
        'string.empty': 'Confirm password cannot be empty',
      }),
});



// delete own account 

export const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .required()
    .message({
      'any.required': 'Please enter your password to confirm deletion',
      'string.empty': 'password cannot be empty',
    }),
});