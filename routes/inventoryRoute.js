import express from 'express';
import {
  getAllInventory, getProductInventory,
  restockProduct, deductStock, getLowStockAlerts,
  updateStock,
  updateVariantStock,
  getLowStockProducts,
} from '../controllers/inventoryController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { isAdmin, isSeller }        from '../middlewares/adminMiddleware.js';
import validate from '../validation/validate.js';
import { updateStockSchema } from '../validation/inventoryValidation.js';

const inventoryRoutes = express.Router();

// All inventory routes are admin only
inventoryRoutes.get('/',authMiddleware, isAdmin, getAllInventory);
inventoryRoutes.patch(`/:id/stock`, authMiddleware, isSeller, validate(updateStockSchema), updateStock)
inventoryRoutes.patch(`/:id/variants/:variantId/stock`, authMiddleware, isSeller, validate(updateStockSchema), updateVariantStock)
inventoryRoutes.get('/low-stock/alerts',authMiddleware, isAdmin, getLowStockAlerts);
inventoryRoutes.get(`/low-stock/products`, authMiddleware,isSeller, getLowStockProducts)
inventoryRoutes.get('/:productId',authMiddleware, isAdmin, getProductInventory);
inventoryRoutes.patch('/:productId/restock',authMiddleware, isAdmin, restockProduct);
inventoryRoutes.patch('/:productId/deduct',authMiddleware, isAdmin, deductStock);

export default inventoryRoutes;