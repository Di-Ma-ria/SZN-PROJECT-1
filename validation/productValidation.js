import Joi from "joi";

const variantSchema =Joi.object({
    name: Joi.string().required(),
    sku:Joi.string().required(),
    price:Joi.number().min(0).required(),
    stock:Joi.number().min(0).default(0),
    attributes:Joi.object().pattern(Joi.string(), Joi.string()),
});

export const createProductSchema = Joi.object({
    name:Joi.string().required(),
    description:Joi.string().required(),
    category:Joi.string().hex().length(24).required(),
    brand:Joi.string().required(),
    productType:Joi.string().valid('own', 'marketplace').required(),

    variants: Joi.array().items(variantSchema).default([]),

    //basePrice required only if no variants provided
    basePrice:Joi.when('variants', {
        is:Joi.array().min(1),
        then:Joi.number().min(0).optional(),
        otherwise:Joi.number().min(0).required(),
    }),

    stock:Joi.number().min(0).default(0),
    specs:Joi.object().pattern(Joi.string(), Joi.string()),
});

export const updateProductSchema = Joi.object({
    name:Joi.string(),
    description:Joi.string(),
    category:Joi.string().hex().length(24),
    brand:Joi.string(),
    productType:Joi.string().valid('own', 'marketplace'),
    variants:Joi.array().items(variantSchema),
    basePrice:Joi.number().min(0),
    stock:Joi.number().min(0),
    specs:Joi.object().pattern(Joi.string(), Joi.string())
}).min(1);  //at least one field required for update

export const updateStatusSchema = Joi.object({
    status:Joi.string()
    .valid('active', 'rejected', 'archived', 'draft', 'pending')
    .required(),
    reason: Joi.string().when('status', {
        is: 'rejected',
        then: Joi.required(),  //admin must give a reason when rejecting
        otherwise: Joi.optional()
    }),
});

export const updateStockSchema = Joi.object({
    stock:Joi.number().min(0).required()
});