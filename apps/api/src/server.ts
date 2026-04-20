import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import winston from 'winston';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

import authRoutes from './routes/auth';
import songsRoutes from './routes/songs';
import searchRoutes from './routes/search';
import streamRoutes from './routes/stream';
import playlistRoutes from './routes/playlists';
import historyRoutes from './routes/history';
import aiRoutes from './routes/ai';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/songs', songsRoutes);
app.use('/api/v1/songs', streamRoutes); // Mount streams under /songs for /songs/:id/stream
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/library/history', historyRoutes);
app.use('/api/v1/ai', aiRoutes);

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
});
app.use(generalLimiter);

// Health Endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong on the server.'
    }
  });
});

// MongoDB Connection with Retry Logic
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    logger.error('MONGODB_URI is not defined in env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

connectDB();

import { autoUpdateTrendingPlaylists } from './services/aiPlaylist';

// Schedule auto-updates for trending playlists
setInterval(() => {
  autoUpdateTrendingPlaylists().catch(err => logger.error('Auto-update failed', err));
}, 60 * 60 * 1000); // 1 hour

app.listen(PORT, () => {
  logger.info(`StreamX API running on port ${PORT}`);
});

export default app;
