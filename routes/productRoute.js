import express from 'express';
import { authMiddleware }    from '../middlewares/authMiddleware.js';
import { isAdmin, isSeller } from '../middlewares/adminMiddleware.js';
import validate              from '../validation/validate.js';
import { uploadToCloudinary }  from '../middlewares/cloudinaryMiddleware.js';
import { uploadProductImages } from '../middlewares/multerMiddleware.js';
import {
  createProductSchema,
  updateProductSchema,
  updateStatusSchema,
  updateStockSchema,
  updateVariantStockSchema,
} from '../validation/productValidation.js';
import {
  // Public
  getAllProducts,
  getSingleProduct,
  searchProducts,
  getSearchSuggestions,
  getProductsByCategory,
  getProductsByCategorySlug,
  getProductsByBrand,
  getFeaturedProducts,
  getNewArrivals,
  getDeals,
  getRelatedProducts,
  compareProducts,
  // Seller
  createProduct,
  getMyProducts,
  getMyProductStats,
  getProductAnalytics,
  updateProduct,
  addProductImages,
  removeProductImage,
  deleteProduct,
  updateProductStock,
  updateVariantStock,
  // Admin
  adminGetAllProducts,
  getPendingProducts,
  adminProductStats,
  updateProductStatus,
  toggleFeaturedProduct,
} from '../controllers/productController.js';

const ProductRoutes = express.Router();

// ════════════════════════════════════════════════════════════
// PUBLIC ROUTES — No Auth Required
// Named routes MUST come before /:id
// ════════════════════════════════════════════════════════════

ProductRoutes.get('/search',               searchProducts);
ProductRoutes.get('/suggestions',          getSearchSuggestions);
ProductRoutes.get('/featured',             getFeaturedProducts);
ProductRoutes.get('/new-arrivals',         getNewArrivals);
ProductRoutes.get('/deals',                getDeals);
ProductRoutes.get('/category/:categoryId', getProductsByCategory);
ProductRoutes.get('/category/slug/:slug',  getProductsByCategorySlug);
ProductRoutes.get('/brand/:brand',         getProductsByBrand);
ProductRoutes.post('/compare',             compareProducts);

// ════════════════════════════════════════════════════════════
// SELLER NAMED ROUTES — must come before /:id
// ════════════════════════════════════════════════════════════

ProductRoutes.get(
  '/seller/my-products',
  authMiddleware, isSeller,
  getMyProducts
);

ProductRoutes.get(
  '/seller/my-stats',
  authMiddleware, isSeller,
  getMyProductStats
);

ProductRoutes.get(
  '/seller/:id/analytics',
  authMiddleware, isSeller,
  getProductAnalytics
);

// ════════════════════════════════════════════════════════════
// ADMIN NAMED ROUTES — must come before /:id
// ════════════════════════════════════════════════════════════

ProductRoutes.get(
  '/admin/all',
  authMiddleware, isAdmin,
  adminGetAllProducts
);

ProductRoutes.get(
  '/admin/pending',
  authMiddleware, isAdmin,
  getPendingProducts
);

ProductRoutes.get(
  '/admin/stats',
  authMiddleware, isAdmin,
  adminProductStats
);

ProductRoutes.patch(
  '/admin/:id/status',
  authMiddleware, isAdmin,
  validate(updateStatusSchema),
  updateProductStatus
);

ProductRoutes.patch(
  '/admin/:id/feature',
  authMiddleware, isAdmin,
  toggleFeaturedProduct
);

// ════════════════════════════════════════════════════════════
// GENERIC ROUTES — come AFTER all named routes
// ════════════════════════════════════════════════════════════

ProductRoutes.get('/',    getAllProducts);
ProductRoutes.get('/:id', getSingleProduct);
ProductRoutes.get('/:id/related', getRelatedProducts);

// ════════════════════════════════════════════════════════════
// SELLER CRUD ROUTES
// ════════════════════════════════════════════════════════════

ProductRoutes.post(
  '/',
  authMiddleware, isSeller,
  uploadProductImages,
  uploadToCloudinary,
  validate(createProductSchema),
  createProduct
);

ProductRoutes.patch(
  '/:id',
  authMiddleware, isSeller,
  uploadProductImages,
  uploadToCloudinary,
  validate(updateProductSchema),
  updateProduct
);

ProductRoutes.post(
  '/:id/images',
  authMiddleware, isSeller,
  uploadProductImages,
  uploadToCloudinary,
  addProductImages
);

ProductRoutes.delete(
  '/:id/image',
  authMiddleware, isSeller,
  removeProductImage
);

ProductRoutes.delete(
  '/:id',
  authMiddleware, isSeller,
  deleteProduct
);

// ─── Stock Update Routes ──────────────────────────────────

ProductRoutes.patch(
  '/:id/stock',
  authMiddleware, isSeller,
  validate(updateStockSchema),
  updateProductStock
);

ProductRoutes.patch(
  '/:id/variants/:variantId/stock',
  authMiddleware, isSeller,
  validate(updateVariantStockSchema),
  updateVariantStock
);

export default ProductRoutes;