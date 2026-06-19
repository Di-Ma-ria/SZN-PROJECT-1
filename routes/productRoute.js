import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../validation/validate.js';
import { isAdmin, isSeller } from '../middlewares/adminMiddleware.js';
import { createProductSchema, updateProductSchema, updateStatusSchema } from '../validation/productValidation.js';
import { uploadToCloudinary } from '../middlewares/cloudinaryMiddleware.js';
import { uploadProductImages } from '../middlewares/multerMiddleware.js';
import {adminGetAllProducts,createProduct,getAllProducts,getMyProducts,getSingleProduct,updateProduct,updateProductStatus,} from '../controllers/productController.js';

const ProductRoutes = express.Router();

// PUBLIC
ProductRoutes.get('/', getAllProducts);
ProductRoutes.get('/:id', getSingleProduct);

// AUTHENTICATED
ProductRoutes.get('/seller/my-products', authMiddleware, getMyProducts);
ProductRoutes.post('/',authMiddleware,isSeller, uploadProductImages,uploadToCloudinary,validate(createProductSchema),createProduct);

ProductRoutes.patch('/:id',authMiddleware,isSeller,uploadProductImages,uploadToCloudinary,validate(updateProductSchema),updateProduct);

// ADMIN ONLY
ProductRoutes.get('/admin/all', authMiddleware, isAdmin, adminGetAllProducts);
ProductRoutes.patch('/:id/status',authMiddleware,isAdmin,validate(updateStatusSchema),updateProductStatus);

export default ProductRoutes;