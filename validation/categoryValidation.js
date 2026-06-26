import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string()
  .min(2)
  .max(50)
  .required()
  .messages({
    'string.min': 'Category name must be at least 2 characters',
    'string.max': 'Category name cannot exceed 50 characters',
    'any.required': 'Category name is required',
    'string.empty': 'Category name cannot be empty',
  }),

  description: Joi.string()
    .max(200)
    .optional()
    .allow('', null),

  image: Joi.string()
      .uri()
      .optional()
      .allow('', null)
      .messages({
        'string.uri': 'Image must be a valid URL',
      }),

  parent: Joi.string()
      .hex()
      .length(24)
      .optional()
      .allow(null)
      .messages({
        'string.hex': 'parent category ID is invalid',
        'string.lengt': 'Parent category ID is invalid',
      }),

  isActive: Joi.boolean()
      .optional(),
});


// update category

export const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50),

  description: Joi.string()
    .max(200)
    .optional()
    .allow('', null),

  image: Joi.string()
    .uri()
    .optional()
    .allow('', null),
  parent: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null),

  isActive: Joi.boolean()
    .optional(),
})

  .min(1)
  .messages({
    'object.min': 'Please provide at least one field to update',
  });