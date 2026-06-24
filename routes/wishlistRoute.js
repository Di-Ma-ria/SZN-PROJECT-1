import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController.js';

const wishlistRoutes = express.Router();

wishlistRoutes.get('/', authMiddleware, getWishlist);
wishlistRoutes.post('/:productId', authMiddleware, toggleWishlist);

export default wishlistRoutes;
