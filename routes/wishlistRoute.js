import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController.js';

const WishlistRoutes = express.Router();

WishlistRoutes.get('/', authMiddleware, getWishlist);
WishlistRoutes.post('/:productId', authMiddleware, toggleWishlist);

export default WishlistRoutes;
