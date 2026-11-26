import './config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { globalKNNRecommender } from './utils/knnRecommender.js';
import { Movie } from './models/Movie.js';
import { verifySmtpConnection } from './utils/emailService.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. Security & Body Parsing Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Structured HTTP Request Logging (Morgan + Winston)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// 3. Rate Limiting for Global API Protection
app.use('/api', globalLimiter);

// 4. Static Media Directory for Avatar Uploads
app.use('/uploads', express.static(uploadsDir));

// 5. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Movie+ Recommendation API & Express REST Server',
    knnEngineTrained: globalKNNRecommender.isTrained,
    emailVerificationEnabled: true,
    timestamp: new Date().toISOString()
  });
});

// 6. Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/upload', uploadRoutes);

// 7. Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 8. Process Crash Protection & Resilience Listeners
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason?.stack || reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error?.stack || error?.message}`);
});

const PORT = process.env.PORT || 5001;

// Start Server and Initialize Database & ML Recommender
const startServer = async () => {
  // Connect to MongoDB
  const conn = await connectDB();

  // Verify SMTP Email Service
  await verifySmtpConnection();

  // Initialize and Train In-Memory KNN Recommender
  try {
    let movies = [];
    if (conn) {
      movies = await Movie.find({});
    }
    if (!movies || movies.length === 0) {
      const seedPath = path.resolve(__dirname, 'data/moviesSeed.json');
      if (fs.existsSync(seedPath)) {
        movies = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      }
    }

    if (movies.length > 0) {
      globalKNNRecommender.fit(movies);
      logger.info(`Trained High-Accuracy KNN Recommender on ${movies.length} movie feature vectors`);
    }
  } catch (err) {
    logger.warn(`Could not pre-train KNN Recommender during startup: ${err.message}`);
  }

  app.listen(PORT, () => {
    logger.info(`Movie+ Backend Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
};

// Only start HTTP listener if not running under automated tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
