import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import ConnectDb from './config/db.js';
import { initCloudinary } from './config/cloudinary.js';
import { errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import ProductRoutes from './routes/productRoute.js';
import reviewRoutes from './routes/reviewRoute.js';
import wishlistRoutes from './routes/wishlistRoute.js';
import categoryRoutes from './routes/categoryRoute.js';
import inventoryRoutes from './routes/inventoryRoute.js';
import orderRoutes from './routes/orderRoute.js';
import couponRoutes from './routes/couponRoute.js';
import paymentRoutes from './routes/paymentRoute.js';
import cartRoutes from './routes/cartRoute.js';
import locationRoutes from './routes/locationRoute.js';

// Initialize Cloudinary
initCloudinary();

const app = express();
const PORT = process.env.PORT || 5000;


// SECURITY

app.disable('x-powered-by');
app.set('trust proxy', 1);


// PAYSTACK WEBHOOK


app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' })
);


// MIDDLEWARES


app.use(helmet());

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

app.use(compression());

app.use(hpp());

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(cookieParser());

// CORS


const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:9090',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    credentials: true,
  })
);


// RATE LIMITERS


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many login attempts. Try again in 15 minutes.',
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many OTP requests. Try again in 15 minutes.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api/auth/otp', otpLimiter);
app.use('/api/auth', authLimiter);

// Skip limiter for Paystack webhook
app.use('/api', (req, res, next) =>
  req.path.startsWith('/payments/webhook')
    ? next()
    : apiLimiter(req, res, next)
);


// ROUTES


app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LODITOJO API is running',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/location', locationRoutes);


// 404


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});


// ERROR HANDLER

app.use(errorHandler);


// START SERVER

let server;

try {
  await ConnectDb();

  server = app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}


// GRACEFUL SHUTDOWN


// this is how long we'll wait for in-flight connections (
const SHUTDOWN_TIMEOUT_MS = 10_000;

// it wraps server.close() with a hard timeout fallback, so a connection

const closeServerOrForce = (exitCode) => {
  if (!server) {
    process.exit(exitCode);
    return;
  }

  const forceExitTimer = setTimeout(() => {
    console.error(`Forced shutdown after ${SHUTDOWN_TIMEOUT_MS}ms — some connections did not close in time.`);
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  server.close(() => {
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  });
};

const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  closeServerOrForce(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  closeServerOrForce(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  closeServerOrForce(1);
});