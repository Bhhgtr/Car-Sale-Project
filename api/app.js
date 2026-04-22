import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

dotenv.config();

const __dirname = path.resolve();

const app = express();

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,          
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per IP
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // stricter limit for auth routes
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);       

// DB Connection
export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO);
  console.log("Connected to MongoDB!");
};

// API Routes
app.use("/api/auth", authLimiter, authRouter);      // stricter limit on auth
app.use("/api/user", userRouter);
app.use("/api/listing", listingRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, '/client/dist')));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

export default app;