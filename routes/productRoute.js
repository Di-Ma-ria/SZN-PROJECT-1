import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../validation/validate.js';
import { isAdmin, isSeller, isSuperAdmin } from '../middlewares/adminMiddleware.js';
import { createProductSchema, updateProductSchema, updateStatusSchema, updateStockSchema } from '../validation/productValidation.js';
import { uploadToCloudinary } from '../middlewares/cloudinaryMiddleware.js';
import { uploadProductImages } from '../middlewares/multerMiddleware.js';
import {addProductImages,adminGetAllProducts,adminProductStats,
    compareProducts,
    createProduct,deleteProduct,getAllProducts,getDeals,
    getFeaturedProducts,getLowStockProducts,getMyProducts,getMyProductStats,
    getNewArrivals,getPendingProducts,getProductAnalytics,getProductsByBrand,
    getProductsByCategory,getProductsByCategorySlug,getRelatedProducts,getSearchSuggestions,getSingleProduct,
    removeProductImage,searchProducts,toggleFeaturedProduct,
    updateProduct,updateProductStatus, updateStock, updateVariantStock,} from '../controllers/productController.js';

const ProductRoutes = express.Router();

// PUBLIC
ProductRoutes.get(`/search`, searchProducts)
ProductRoutes.get(`/`, getSearchSuggestions )
ProductRoutes.get(`/featured`, getFeaturedProducts)
ProductRoutes.get(`/new-arrivals`, getNewArrivals)
ProductRoutes.get(`/category/:categoryId`, getProductsByCategory)
ProductRoutes.get(`/category/slug/:slug`, getProductsByCategorySlug)
ProductRoutes.get(`/brand/:brand`, getProductsByBrand)
ProductRoutes.get(`/deals`, getDeals)
ProductRoutes.get('/low-stock', authMiddleware, isSeller, getLowStockProducts)
ProductRoutes.get('/', getAllProducts);
ProductRoutes.get('/:id', getSingleProduct);
ProductRoutes.get(`/:id/related`, getRelatedProducts)
ProductRoutes.post(`/`, compareProducts)

// AUTHENTICATED
//Seller
ProductRoutes.get('/seller/my-products', authMiddleware, getMyProducts);
ProductRoutes.get(`/seller/my-productstats`, authMiddleware, isSeller,isAdmin, getMyProductStats)
ProductRoutes.get(`/:id`, authMiddleware, isSeller, getProductAnalytics)
ProductRoutes.post('/',authMiddleware,isSeller, uploadProductImages,uploadToCloudinary,validate(createProductSchema),createProduct);
ProductRoutes.post(`/:id/images`,authMiddleware,isSeller, uploadProductImages, uploadToCloudinary, addProductImages)

ProductRoutes.patch('/:id',authMiddleware,isSeller,uploadProductImages,uploadToCloudinary,validate(updateProductSchema),updateProduct);
ProductRoutes.patch(`/:id/stock`, authMiddleware,isSeller,validate(updateStockSchema), updateStock)
ProductRoutes.patch(`/:id/variants/:variantId/stock`, authMiddleware,isSeller,validate(updateStockSchema), updateVariantStock)

ProductRoutes.delete(`/:id/image`,authMiddleware ,isSeller, removeProductImage)
ProductRoutes.delete(`/:id`,authMiddleware,isSeller, deleteProduct)

// ADMIN ONLY
ProductRoutes.get('/admin/all', authMiddleware, isAdmin, adminGetAllProducts);
ProductRoutes.get(`/admin/pending`,authMiddleware,isAdmin, getPendingProducts )
ProductRoutes.get(`/admin/stats`,authMiddleware,isAdmin,adminProductStats)

ProductRoutes.patch('/:id/status',authMiddleware,isAdmin,validate(updateStatusSchema),updateProductStatus);
ProductRoutes.patch(`/admin/:id/feature`, authMiddleware,isAdmin, toggleFeaturedProduct)

export default ProductRoutes;