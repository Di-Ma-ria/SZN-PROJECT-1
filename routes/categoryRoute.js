import express from 'express';

import { createCategory, getAllCategories, getSingleCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController.js';

import { authMiddleware} from '../middlewares/ authMiddleware.js';

import {isAdmin} from '../middlewares/adminMiddleware.js';

import validate from '../validation/validate.js';

import { createCategorySchema, updateCategorySchema } from "../validation/categoryValidation.js.js";

const categoryRoutes = express.Router();

// Public 

categoryRoutes.get('/', getAllCategories); // browse all categories

categoryRoutes.get('/:id', getSingleCategory); // view one category


// ADMIN ONLY 

categoryRoutes.post('/', authMiddleware, authMiddleware, isAdmin, validate(createCategorySchema), createCategory);

categoryRoutes.patch('/:id', authMiddleware, isAdmin,  validate(updateCategorySchema), updateCategory);

categoryRoutes.delete('/:id', authMiddleware, isAdmin,  deleteCategory);

export default categoryRoutes;