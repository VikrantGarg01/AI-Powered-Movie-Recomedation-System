import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Movie } from '../models/Movie.js';
import { logger } from '../config/logger.js';
import { globalKNNRecommender } from '../utils/knnRecommender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// api.tmdb.org works reliably even on networks that block api.themoviedb.org; keep both as fallbacks
const TMDB_API_BASES = process.env.TMDB_API_BASE
  ? [process.env.TMDB_API_BASE]
  : ['https://api.tmdb.org/3', 'https://api.themoviedb.org/3'];

const INDIAN_LANGUAGES = new Set(['hi', 'te', 'ta', 'ml', 'kn']);

// Permanently excluded TMDB IDs (removed from dataset)
export const EXCLUDED_TMDB_IDS = new Set([1141868]);

const isExcludedMovie = (movie) => {
  if (!movie) return false;
  const numId = Number(movie.tmdbId ?? movie.id);
  if (Number.isFinite(numId) && EXCLUDED_TMDB_IDS.has(numId)) return true;
  return typeof movie.title === 'string' && movie.title.trim().toLowerCase() === 'tante siska';
};

export const getApiKey = () => process.env.TMDB_API_KEY || '';

/**
 * Robust HTTPS request with automatic host fallback and retries across transient network resets
 */
export const fetchTMDB = async (endpoint, params = {}, retries = 3) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured in environment variables');
  }
  const queryParams = new URLSearchParams({ api_key: apiKey, ...params });

  for (let attempt = 1; attempt <= retries; attempt++) {
    const baseUrl = TMDB_API_BASES[(attempt - 1) % TMDB_API_BASES.length];
    const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

    try {
      return await new Promise((resolve, reject) => {
        const req = https.get(
          url,
          {
            headers: {
              'User-Agent': 'MoviePlus/1.0',
              Accept: 'application/json'
            },
            timeout: 8000
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                if (res.statusCode >= 400) {
                  return reject(new Error(`TMDB HTTP ${res.statusCode}: ${data}`));
                }
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error(`TMDB JSON Parse Error: ${e.message}`));
              }
            });
          }
        );

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('TMDB Request Timeout'));
        });
      });
    } catch (err) {
      const isNotFound = err.message.includes('TMDB HTTP 404');
      if (isNotFound || attempt === retries) {
        if (!isNotFound) {
          logger.error(`TMDB fetch failed after ${retries} attempts: ${err.message} (${endpoint})`);
        }
        throw err;
      }
      await new Promise((r) => setTimeout(r, 350 * attempt));
    }
  }
};

/**
 * Transform raw TMDB details into Movie+ Movie model format
 */
export const transformTMDBMovie = (tmdbMovie, details = {}, category = {}) => {
  const credits = details.credits || {};
  const videos = details.videos?.results || [];
  const rawKeywords = details.keywords?.keywords || details.keywords?.results || [];

  const director = credits.crew?.find((c) => c.job === 'Director')?.name || 'Acclaimed Director';

  const writers = credits.crew
    ?.filter((c) => ['Screenplay', 'Writer', 'Story'].includes(c.job))
    .map((c) => c.name)
    .slice(0, 2)
    .join(', ');

  const cast = (credits.cast || []).slice(0, 5).map((actor) => ({
    name: actor.name,
    role: actor.character || 'Leading Cast',
    avatar: actor.profile_path
      ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }));

  const trailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
    videos.find((v) => v.site === 'YouTube');

  const originalLang = tmdbMovie.original_language || details.original_language || 'en';
  const isIndian =
    INDIAN_LANGUAGES.has(originalLang) ||
    (details.origin_country || tmdbMovie.origin_country || []).includes('IN');

  const genres = (details.genres || tmdbMovie.genres || [])
    .map((g) => (typeof g === 'string' ? g : g.name))
    .filter(Boolean);

  const finalGenres = genres.length > 0 ? [...genres] : ['Drama'];
  if (isIndian && !finalGenres.includes('Indian Cinema')) {
    finalGenres.push('Indian Cinema');
  }

  const similarityKeywords =
    rawKeywords.length > 0
      ? rawKeywords.map((k) => k.name)
      : [...finalGenres, isIndian ? 'bollywood' : 'cinema'];

  const posterPath = tmdbMovie.poster_path || details.poster_path;
  const backdropPath = tmdbMovie.backdrop_path || details.backdrop_path;

  const poster = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

  const backdrop = backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : poster;

  const voteAverage = Number((tmdbMovie.vote_average || details.vote_average || 7.5).toFixed(1));
  const voteCountRaw = tmdbMovie.vote_count || details.vote_count || 1000;
  const voteCountFormatted =
    voteCountRaw >= 1000 ? `${(voteCountRaw / 1000).toFixed(1)}K` : `${voteCountRaw}`;

  const runtimeMinutes = details.runtime || 120;
  const rawReleaseDate = tmdbMovie.release_date || details.release_date;
  const parsedYear = rawReleaseDate ? new Date(rawReleaseDate).getFullYear() : 2024;
  const releaseYear = Number.isFinite(parsedYear) ? parsedYear : 2024;
  const popularity = details.popularity || tmdbMovie.popularity || 0;

  return {
    id: String(tmdbMovie.id),
    tmdbId: Number(tmdbMovie.id),
    title: tmdbMovie.title || details.title || 'Untitled Movie',
    tagline: details.tagline || '',
    year: releaseYear,
    rating: voteAverage,
    voteCount: voteCountFormatted,
    certification: 'PG-13',
    runtime: `${runtimeMinutes} min`,
    runtimeMinutes,
    genres: finalGenres,
    director,
    writer: writers || director,
    description: tmdbMovie.overview || details.overview || 'No description available.',
    cast: cast.length > 0 ? cast : [{ name: 'Ensemble Cast', role: 'Main Lead', avatar: '' }],
    poster,
    backdrop,
    trailerId: trailer ? trailer.key : '',
    similarityKeywords,
    language: originalLang,
    trending: category.trending !== undefined ? !!category.trending : popularity >= 35,
    popular:
      category.popular !== undefined
        ? !!category.popular
        : voteCountRaw >= 1500 || popularity >= 25,
    topRated: category.topRated !== undefined ? !!category.topRated : voteAverage >= 8.0,
    recentlyReleased:
      category.recentlyReleased !== undefined
        ? !!category.recentlyReleased
        : releaseYear >= 2023
  };
};

/**
 * Upsert movie into MongoDB: check TMDB ID, update if existing, insert if new
 */
export const upsertMovie = async (movieData) => {
  if (isExcludedMovie(movieData)) return null;
  return await Movie.findOneAndUpdate(
    {
      $or: [{ tmdbId: movieData.tmdbId }, { id: movieData.id }]
    },
    { $set: movieData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Bulk upsert movies into MongoDB cleanly and quickly
 */
export const bulkUpsertMovies = async (movies = []) => {
  const filteredMovies = movies.filter((m) => !isExcludedMovie(m));
  if (!filteredMovies.length) return;
  const chunkSize = 250;
  for (let i = 0; i < filteredMovies.length; i += chunkSize) {
    const chunk = filteredMovies.slice(i, i + chunkSize);
    const ops = chunk.map((movieData) => ({
      updateOne: {
        filter: { $or: [{ tmdbId: movieData.tmdbId }, { id: movieData.id }] },
        update: { $set: movieData },
        upsert: true
      }
    }));
    await Movie.bulkWrite(ops, { ordered: false });
  }
};

/**
 * Fetch detailed movie by TMDB ID dynamically and store in MongoDB
 */
export const fetchMovieByIdFromTMDB = async (tmdbId) => {
  if (EXCLUDED_TMDB_IDS.has(Number(tmdbId))) {
    return null;
  }
  try {
    const details = await fetchTMDB(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos,keywords'
    });
    const movieData = transformTMDBMovie(details, details);
    if (isExcludedMovie(movieData)) return null;
    try {
      return await upsertMovie(movieData);
    } catch {
      return movieData;
    }
  } catch (err) {
    logger.warn(`Could not dynamically fetch TMDB movie ${tmdbId}: ${err.message}`);
    return null;
  }
};

/**
 * Search TMDB dynamically across all ~1M+ TMDB movies and cache results into MongoDB
 */
export const searchTMDB = async (query, page = 1) => {
  const res = await fetchTMDB('/search/movie', { query, page, include_adult: false });
  const rawResults = (res.results || [])
    .filter((raw) => !EXCLUDED_TMDB_IDS.has(Number(raw.id)))
    .slice(0, 12);

  const settled = await Promise.allSettled(
    rawResults.map(async (raw) => {
      try {
        const details = await fetchTMDB(`/movie/${raw.id}`, {
          append_to_response: 'credits,videos,keywords'
        });
        return transformTMDBMovie(raw, details);
      } catch {
        return transformTMDBMovie(raw, {});
      }
    })
  );

  const movies = settled
    .filter((r) => r.status === 'fulfilled' && r.value && !isExcludedMovie(r.value))
    .map((r) => r.value);

  if (movies.length > 0) {
    try {
      await bulkUpsertMovies(movies);
    } catch (err) {
      logger.warn(`Live TMDB search DB upsert skipped: ${err.message}`);
    }
  }

  return movies;
};

const CURATED_INDIAN_IDS = [
  20453, 579974, 360814, 19404, 7508, 297222, 256040, 350312, 560057, 632617,
  872906, 14624, 106440, 534780, 4247, 73783, 376867, 497814, 335033, 955991,
  19402, 592834, 780076, 799766
];

const CURATED_GLOBAL_IDS = [
  157336, 27205, 155, 872585, 693134, 550, 278, 496243, 603, 299534, 634649,
  129, 76600, 19995, 680, 545611, 438631, 98, 238, 13, 244786, 569094, 361743,
  335984, 929590
];

const TMDB_GENRE_IDS = [28, 12, 16, 35, 80, 18, 14, 27, 9648, 10749, 878, 53];

/**
 * Collect a comprehensive deduplicated list of TMDB movie IDs across global, Indian, and genre catalogs
 */
export const collectExpandedTMDBIds = async ({
  popularPages = 15,
  topRatedPages = 15,
  nowPlayingPages = 4,
  upcomingPages = 3,
  trendingPages = 3,
  indianPages = 12,
  genrePages = 2
} = {}) => {
  const idSet = new Set([...CURATED_INDIAN_IDS, ...CURATED_GLOBAL_IDS]);

  const fetchListPages = async (endpoint, pages, extraParams = {}) => {
    const pageNums = Array.from({ length: pages }, (_, i) => i + 1);
    for (let i = 0; i < pageNums.length; i += 5) {
      const batch = pageNums.slice(i, i + 5);
      const responses = await Promise.allSettled(
        batch.map((page) => fetchTMDB(endpoint, { page, ...extraParams }))
      );
      responses.forEach((res) => {
        if (res.status === 'fulfilled') {
          (res.value?.results || []).forEach((m) => {
            if (m?.id && !EXCLUDED_TMDB_IDS.has(Number(m.id))) {
              idSet.add(Number(m.id));
            }
          });
        }
      });
    }
  };

  await fetchListPages('/trending/movie/week', trendingPages);
  await fetchListPages('/movie/popular', popularPages);
  await fetchListPages('/movie/top_rated', topRatedPages);
  await fetchListPages('/movie/now_playing', nowPlayingPages);
  await fetchListPages('/movie/upcoming', upcomingPages);
  await fetchListPages('/discover/movie', indianPages, {
    with_origin_country: 'IN',
    sort_by: 'vote_count.desc'
  });

  // Regional Indian cinema pages (Hindi, Telugu, Tamil, Malayalam)
  for (const lang of ['hi', 'te', 'ta', 'ml']) {
    await fetchListPages('/discover/movie', 2, {
      with_original_language: lang,
      sort_by: 'popularity.desc'
    });
  }

  // Genre diversity across global catalog
  for (const genreId of TMDB_GENRE_IDS) {
    await fetchListPages('/discover/movie', genrePages, {
      with_genres: String(genreId),
      sort_by: 'vote_count.desc'
    });
  }

  for (const excludedId of EXCLUDED_TMDB_IDS) {
    idSet.delete(excludedId);
  }

  return Array.from(idSet);
};

/**
 * Fetch deep metadata for an array of TMDB IDs in parallel batches
 */
export const fetchExpandedTMDBCatalog = async (options = {}) => {
  const { concurrency = 15, onProgress, ...pageOptions } = options;
  const uniqueIds = (await collectExpandedTMDBIds(pageOptions)).filter(
    (id) => !EXCLUDED_TMDB_IDS.has(Number(id))
  );
  logger.info(`Collected ${uniqueIds.length} unique TMDB movie IDs. Fetching full metadata...`);

  const movies = [];
  const seenIds = new Set();

  for (let i = 0; i < uniqueIds.length; i += concurrency) {
    const batch = uniqueIds.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map((id) =>
        fetchTMDB(`/movie/${id}`, {
          append_to_response: 'credits,videos,keywords'
        })
      )
    );

    results.forEach((res) => {
      if (res.status === 'fulfilled' && res.value?.id && !seenIds.has(res.value.id)) {
        seenIds.add(res.value.id);
        const movieObj = transformTMDBMovie(res.value, res.value);
        movies.push(movieObj);
      }
    });

    if (onProgress) {
      onProgress(movies.length, uniqueIds.length);
    }

    if (i + concurrency < uniqueIds.length) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return movies;
};

/**
 * Sync expanded catalog of Indian & Global movies from TMDB into MongoDB & static fallbacks
 */
export const syncCuratedCatalog = async (options = {}) => {
  logger.info('Starting Expanded TMDB Catalog Sync (Indian & Global Hits)...');

  const processedMovies = await fetchExpandedTMDBCatalog(options);
  logger.info(`Fetched ${processedMovies.length} unique movies from TMDB`);

  if (processedMovies.length > 0) {
    await bulkUpsertMovies(processedMovies);
    logger.info(`Upserted ${processedMovies.length} movies into MongoDB`);

    globalKNNRecommender.fit(processedMovies);
    saveStaticFallbacks(processedMovies);
  }

  return processedMovies;
};

/**
 * Saves fetched TMDB data to seed, ML dataset, and frontend fallback files
 */
export const saveStaticFallbacks = (movies) => {
  const filteredMovies = (movies || []).filter((m) => !isExcludedMovie(m));
  if (filteredMovies.length === 0) return;

  try {
    const seedPath = path.resolve(__dirname, '../data/moviesSeed.json');
    fs.writeFileSync(seedPath, JSON.stringify(filteredMovies, null, 2), 'utf-8');
    logger.info(`Saved ${filteredMovies.length} real TMDB movies to ${seedPath}`);

    const mlPath = path.resolve(__dirname, '../../ml_pipeline/data/movies_dataset.json');
    if (fs.existsSync(path.dirname(mlPath))) {
      fs.writeFileSync(mlPath, JSON.stringify(filteredMovies, null, 2), 'utf-8');
      logger.info(`Saved ${filteredMovies.length} real TMDB movies to ${mlPath}`);
    }

    const frontendPath = path.resolve(__dirname, '../../src/data/moviesData.js');
    if (fs.existsSync(path.dirname(frontendPath))) {
      const allGenres = Array.from(new Set(filteredMovies.flatMap((m) => m.genres || [])))
        .filter((g) => g && g !== 'All')
        .sort();

      const frontendCode = `/**
 * Real TMDB Movie Dataset (Auto-generated from TMDB API)
 * Total Movies: ${filteredMovies.length} (Indian & Global Masterpieces)
 */
export const INITIAL_USER_PROFILE = {
  name: "",
  email: "",
  role: "user",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  favoriteGenres: []
};

export const ALL_GENRES = ${JSON.stringify(['All', ...allGenres], null, 2)};

export const MOVIES_DATA = ${JSON.stringify(filteredMovies, null, 2)};
`;
      fs.writeFileSync(frontendPath, frontendCode, 'utf-8');
      logger.info(`Saved ${filteredMovies.length} real TMDB movies to ${frontendPath}`);
    }
  } catch (err) {
    logger.error(`Error saving static fallback files: ${err.message}`);
  }
};
