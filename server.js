import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import ConnectDb from './config/db.js';
import {errorHandler} from './middlewares/errorHandler.js';


import authRoutes from './routes/authRoute.js';

import userRoutes from './routes/userRoute.js';

import cartRoutes  from '../routes/cartRoute.js';

import categoryRoutes from './routes/categoryRoute.js';

import inventoryRoutes from '../routes/inventoryRoute.js';

import orderRoutes from '../routes/orderRoute.js';

import couponRoutes from '../routes/couponRoute.js';

import paymentRoutes from '../routes/paymentRoute.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT
ConnectDb();

// MIDDLEWARES

app.use('/api/payments/webhook', express.raw ({type: 'application/json'}));

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({origin: process.env.ClIENT_URL || '*', credentails: true}));


// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
});

app.use('/api', limiter);


//ROUTES
app.use('/auth', authRoutes);
app.use('/user', userRoutes)
app.use('/cart',      cartRoutes);
app.use('/categories',categoryRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/orders',    orderRoutes);
app.use('/coupons',   couponRoutes);
app.use('/payments',  paymentRoutes);

app.get('/',(req, res) => {
  res.json({message: "E-shop api is running"});
});

app.use('/', (req,res) => {
  res.json({message: "wrong url"});
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on the ${PORT}`);
});
