import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import ConnectDb from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import ProductRoutes from './routes/productRoute.js';
import ReviewRoutes from './routes/reviewRoute.js';
import WishlistRoutes from './routes/wishlistRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

ConnectDb();

// MIDDLEWARES
app.use(express.json());
app.use(cors());

// ROUTES
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/products', ProductRoutes);
app.use('/reviews', ReviewRoutes);
app.use('/wishlist', WishlistRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Your API is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Wrong URL' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
