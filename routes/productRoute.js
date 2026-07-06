import express from 'express';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import validate from '../validation/validate.js';
import { isAdmin, isSeller, isSuperAdmin } from '../middlewares/adminMiddleware.js';
import { createProductSchema, updateProductSchema, updateStatusSchema,} from '../validation/productValidation.js';
import { uploadToCloudinary } from '../middlewares/cloudinaryMiddleware.js';
import { uploadProductImages } from '../middlewares/multerMiddleware.js';
import {addProductImages,adminGetAllProducts,adminProductStats,
    compareProducts,
    createProduct,deleteProduct,getAllProducts,getDeals,
    getFeaturedProducts,getMyProducts,getMyProductStats,
    getNewArrivals,getPendingProducts,getProductAnalytics,getProductsByBrand,
    getProductsByCategory,getProductsByCategorySlug,getRelatedProducts,getSearchSuggestions,getSingleProduct,
    removeProductImage,searchProducts,toggleFeaturedProduct,
    updateProduct,updateProductStatus,} from '../controllers/productController.js';

const ProductRoutes = express.Router();


ProductRoutes.get(`/search`, searchProducts);

ProductRoutes.get(`/suggestions`, getSearchSuggestions);
ProductRoutes.get(`/featured`, getFeaturedProducts)
ProductRoutes.get(`/new-arrivals`, getNewArrivals)
ProductRoutes.get(`/deals`, getDeals)
ProductRoutes.get(`/category/:categoryId`, getProductsByCategory)
ProductRoutes.get(`/category/slug/:slug`, getProductsByCategorySlug)
ProductRoutes.get(`/brand/:brand`, getProductsByBrand)


ProductRoutes.get('/seller/my-products', authMiddleware, getMyProducts);
ProductRoutes.get(`/seller/my-productstats`, authMiddleware, isSeller,isAdmin, getMyProductStats)
ProductRoutes.get('/admin/all', authMiddleware, isAdmin, adminGetAllProducts);
ProductRoutes.get(`/admin/pending`,authMiddleware,isAdmin, getPendingProducts )
ProductRoutes.get(`/admin/stats`,authMiddleware,isAdmin,adminProductStats)

ProductRoutes.patch(`/admin/:id/feature`, authMiddleware,isAdmin, toggleFeaturedProduct)
ProductRoutes.get(`/seller/:id/analytics`, authMiddleware, isSeller, getProductAnalytics)

ProductRoutes.get('/', getAllProducts);

ProductRoutes.post('/compare', compareProducts);

ProductRoutes.post('/', authMiddleware, isSeller, uploadProductImages, uploadToCloudinary, validate(createProductSchema), createProduct);

ProductRoutes.get(`/:id/related`, getRelatedProducts)
ProductRoutes.get('/:id', getSingleProduct);
ProductRoutes.patch('/:id',authMiddleware,isSeller,uploadProductImages,uploadToCloudinary,validate(updateProductSchema),updateProduct);
ProductRoutes.delete(`/:id`,authMiddleware,isSeller, deleteProduct)
ProductRoutes.post(`/:id/images`,authMiddleware,isSeller, uploadProductImages, uploadToCloudinary, addProductImages)
ProductRoutes.delete(`/:id/image`,authMiddleware ,isSeller, removeProductImage)
ProductRoutes.patch('/admin/:id/status',authMiddleware,isAdmin,validate(updateStatusSchema),updateProductStatus);

export default ProductRoutes;