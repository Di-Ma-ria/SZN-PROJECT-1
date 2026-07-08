import Joi from 'joi';

// ─── Variant Schema ───────────────────────────────────────────
// Used inside createProductSchema and updateProductSchema
const variantSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      'any.required': 'Variant name is required',
      'string.empty': 'Variant name cannot be empty',
    }),

  sku: Joi.string()
    .required()
    .messages({
      'any.required': 'Variant SKU is required',
      'string.empty': 'Variant SKU cannot be empty',
    }),

  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min':   'Variant price cannot be negative',
      'any.required': 'Variant price is required',
    }),

  stock: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Variant stock cannot be negative',
    }),

  // — properly typed Map validation
  attributes: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .optional(),
});

// ─── CREATE PRODUCT ───────────────────────────────────────────
export const createProductSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      'any.required': 'Product name is required',
      'string.empty': 'Product name cannot be empty',
    }),

  description: Joi.string()
    .required()
    .messages({
      'any.required': 'Description is required',
      'string.empty': 'Description cannot be empty',
    }),

  category: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'any.required': 'Category is required',
      'string.hex':   'Category ID is invalid',
      'string.length':'Category ID must be 24 characters',
    }),

  brand: Joi.string()
    .required()
    .messages({
      'any.required': 'Brand is required',
      'string.empty': 'Brand cannot be empty',
    }),

  productType: Joi.string()
    .valid('own', 'marketplace')
    .required()
    .messages({
      'any.only':     "Product type must be 'own' or 'marketplace'",
      'any.required': 'Product type is required',
    }),

  variants: Joi.array()
    .items(variantSchema)
    .default([]),

  // basePrice is required only when no variants are provided
  basePrice: Joi.when('variants', {
    is:   Joi.array().min(1),
    then: Joi.number().min(0).optional(),
    otherwise: Joi.number()
      .min(0)
      .required()
      .messages({
        'any.required': 'Base price is required when no variants are provided',
        'number.min':   'Base price cannot be negative',
      }),
  }),

  stock: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Stock cannot be negative',
    }),

  discountPercentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Discount cannot be negative',
      'number.max': 'Discount cannot exceed 100%',
    }),

  specs: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .optional(),

  // — admin can pass status on create
  status: Joi.string()
    .valid('draft', 'pending', 'active', 'rejected', 'archived')
    .optional()
    .messages({
      'any.only': 'Invalid status value',
    }),
});

// ─── UPDATE PRODUCT ───────────────────────────────────────────
export const updateProductSchema = Joi.object({
  name:        Joi.string().optional(),
  description: Joi.string().optional(),

  category: Joi.string()
    .hex()
    .length(24)
    .optional()
    .messages({
      'string.hex':   'Category ID is invalid',
      'string.length':'Category ID must be 24 characters',
    }),

  brand:       Joi.string().optional(),

  productType: Joi.string()
    .valid('own', 'marketplace')
    .optional()
    .messages({
      'any.only': "Product type must be 'own' or 'marketplace'",
    }),

  variants: Joi.array()
    .items(variantSchema)
    .optional(),

  basePrice: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Base price cannot be negative',
    }),

  stock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Stock cannot be negative',
    }),

  discountPercentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Discount cannot be negative',
      'number.max': 'Discount cannot exceed 100%',
    }),

  specs: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .optional(),

  // — status can be updated
  status: Joi.string()
    .valid('draft', 'pending', 'active', 'rejected', 'archived')
    .optional()
    .messages({
      'any.only': 'Invalid status value',
    }),
})
  .min(1)
  .messages({
    'object.min': 'Provide at least one field to update',
  });

// ─── UPDATE PRODUCT STATUS (admin only) ──────────────────────
export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'rejected', 'archived', 'draft', 'pending')
    .required()
    .messages({
      'any.only':     'Invalid status value',
      'any.required': 'Status is required',
    }),

  // Reason is required when admin rejects a product
  reason: Joi.string().when('status', {
    is:   'rejected',
    then: Joi.required().messages({
      'any.required': 'Please provide a reason for rejection',
    }),
    otherwise: Joi.optional(),
  }),
});

// ─── UPDATE BASE PRODUCT STOCK ← NEW ─────────────────────────
export const updateStockSchema = Joi.object({
  stock: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min':   'Stock cannot be negative',
      'any.required': 'Stock value is required',
      'number.base':  'Stock must be a number',
    }),
});

// ─── UPDATE VARIANT STOCK ← NEW ──────────────────────────────
export const updateVariantStockSchema = Joi.object({
  stock: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min':   'Stock cannot be negative',
      'any.required': 'Stock value is required',
      'number.base':  'Stock must be a number',
    }),
});