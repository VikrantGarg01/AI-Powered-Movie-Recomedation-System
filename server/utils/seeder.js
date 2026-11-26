import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Movie } from '../models/Movie.js';
import { User } from '../models/User.js';
import { Rating } from '../models/Rating.js';
import { Watchlist } from '../models/Watchlist.js';
import { logger } from '../config/logger.js';
import { globalKNNRecommender } from './knnRecommender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinepulse_db';
    await mongoose.connect(mongoUri);
    logger.info(`Connected to MongoDB for Seeding: ${mongoUri}`);

    // Read movies seed file
    const moviesPath = path.resolve(__dirname, '../data/moviesSeed.json');
    const moviesData = JSON.parse(fs.readFileSync(moviesPath, 'utf-8'));

    // Clear existing data and indexes
    try {
      await Movie.collection.dropIndexes();
    } catch {}
    await Movie.deleteMany({});
    await User.deleteMany({});
    await Rating.deleteMany({});
    await Watchlist.deleteMany({});
    logger.info('Cleared existing collections and indexes (Movies, Users, Ratings, Watchlists)');

    // Seed Movies
    const insertedMovies = await Movie.insertMany(moviesData);
    logger.info(`Successfully seeded ${insertedMovies.length} movies into MongoDB`);

    // Train the KNN Recommender
    globalKNNRecommender.fit(moviesData);
    logger.info('Trained High-Accuracy Content-Based KNN Engine with TF-IDF vectors');

    // Seed Initial Default User
    const demoUser = await User.create({
      name: 'Alex Vance',
      email: 'alex.vance@cinema.edu',
      password: 'demo1234',
      role: 'user',
      isVerified: true,
      favoriteGenres: ['Sci-Fi', 'Action', 'Thriller', 'Drama'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    logger.info(`Created default user: ${demoUser.email}`);

    // Create Admin User
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@cinepulse.ai',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true,
      favoriteGenres: ['Sci-Fi', 'Drama', 'Crime', 'Animation'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    });
    logger.info(`Created admin user: ${adminUser.email}`);

    // Seed Initial Ratings mapped to real TMDB movies
    const findMovieId = (titleSubstr, defaultIdx = 0) => {
      const match = insertedMovies.find(m => m.title.toLowerCase().includes(titleSubstr.toLowerCase()));
      return match ? match.id : insertedMovies[defaultIdx]?.id;
    };

    const initialRatings = [
      { userId: demoUser._id, movieId: findMovieId('Inception', 0), rating: 5 },
      { userId: demoUser._id, movieId: findMovieId('3 Idiots', 1), rating: 5 },
      { userId: demoUser._id, movieId: findMovieId('The Dark Knight', 2), rating: 5 },
      { userId: demoUser._id, movieId: findMovieId('RRR', 3), rating: 4.5 },
      { userId: demoUser._id, movieId: findMovieId('Dangal', 4), rating: 4.5 }
    ].filter(r => r.movieId);

    await Rating.insertMany(initialRatings);
    logger.info(`Seeded ${initialRatings.length} initial user ratings`);

    // Clean Initial Watchlist: Empty by default so only user-added titles appear
    logger.info('Clean watchlist configured: 0 default movies seeded');

    logger.info('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    logger.error(`Error during database seeding: ${error.message}`);
    process.exit(1);
  }
};

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}

export { seedDatabase };
