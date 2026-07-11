import express from 'express';

import { authMiddleware } from '../middlewares/authMiddleware.js';

import { addReview, getProductReviews, updateReview, deleteReview,} from '../controllers/reviewController.js';

const reviewRoutes = express.Router();

reviewRoutes.get('/product/:productId', getProductReviews);

reviewRoutes.post('/product/:productId', authMiddleware, addReview);

reviewRoutes.put('/:reviewId', authMiddleware, updateReview);

reviewRoutes.delete('/:reviewId', authMiddleware, deleteReview);

export default reviewRoutes;
