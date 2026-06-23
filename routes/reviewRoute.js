import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';

const ReviewRoutes = express.Router();

ReviewRoutes.get('/product/:productId', getProductReviews);
ReviewRoutes.post('/product/:productId', authMiddleware, addReview);
ReviewRoutes.put('/:reviewId', authMiddleware, updateReview);
ReviewRoutes.delete('/:reviewId', authMiddleware, deleteReview);

export default ReviewRoutes;
