import express from 'express';

import { getCart, addToCart, updateCartItem,removeFromCart, clearCart } from '../controller/cartController.js';

 import {authMiddleware} from '../middlewares/authMiddleware.js';
 
 import validate from '../validation/validate.js';

 import { addToCartSchema, updateCartItemSchema } from '../validation/cartValidation.js';


 const cartRoutes = express.Router();


 //  ALL CART ROUTES, LOGIN  IS REQUIRED

 cartRoutes.get('/', authMiddleware, getCart);

 cartRoutes.post('/add', authMiddleware, validate(addToCartSchema), addToCart);

 cartRoutes.patch('/update/:productId', authMiddleware, validate(updateCartItemSchema), updateCartItem);

 cartRoutes.delete('/remove/:productId', authMiddleware, removeFromCart);

 cartRoutes.delete('/clear', authMiddleware, clearCart);


 export default cartRoutes;

