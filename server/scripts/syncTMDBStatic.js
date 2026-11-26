import '../config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import {
  fetchExpandedTMDBCatalog,
  bulkUpsertMovies,
  saveStaticFallbacks
} from '../services/tmdbService.js';

async function run() {
  console.log('Fetching expanded TMDB movie catalog (Indian & Global Cinema)...');

  const movies = await fetchExpandedTMDBCatalog({
    onProgress: (done, total) => {
      if (done % 100 === 0 || done === total) {
        console.log(`Progress: ${done}/${total} movies fetched`);
      }
    }
  });

  console.log(`\nSuccessfully fetched ${movies.length} unique real TMDB movies!`);

  // Save static fallbacks (moviesSeed.json, ml_pipeline/data/movies_dataset.json, src/data/moviesData.js)
  saveStaticFallbacks(movies);
  console.log('✓ Updated server/data/moviesSeed.json, ml_pipeline/data/movies_dataset.json, and src/data/moviesData.js');

  // Sync into MongoDB if available
  const conn = await connectDB();
  if (conn) {
    await bulkUpsertMovies(movies);
    const totalInDb = await mongoose.connection.db.collection('movies').countDocuments();
    console.log(`✓ Synced into MongoDB (total movies in collection: ${totalInDb})`);
    await mongoose.disconnect();
  } else {
    console.warn('⚠ MongoDB not connected; static catalog files updated.');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('TMDB sync failed:', err);
  process.exit(1);
});
