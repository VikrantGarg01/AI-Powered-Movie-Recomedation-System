import mongoose from 'mongoose';
import { logger } from './logger.js';

// Setup connection lifecycle event listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected! Attempting automatic reconnection...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB successfully reconnected.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB runtime connection error: ${err.message}`);
});

/**
 * Connect to MongoDB with exponential backoff retry loop
 */
export const connectDB = async (retries = 3, delayMs = 1500) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinepulse_db';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      logger.error(`MongoDB Connection Attempt ${attempt}/${retries} Error: ${error.message}`);
      if (attempt < retries) {
        logger.info(`Retrying MongoDB connection in ${delayMs * attempt}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      } else {
        logger.warn('Running in decoupled/fallback mode. Ensure local mongod is active for database persistence.');
        return null;
      }
    }
  }
};
