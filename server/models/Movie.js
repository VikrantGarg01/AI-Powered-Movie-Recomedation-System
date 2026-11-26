import mongoose from 'mongoose';

const CastMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  avatar: { type: String, default: '' }
}, { _id: false });

const MovieSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    tmdbId: {
      type: Number,
      unique: true,
      sparse: true,
      index: true
    },
    language: {
      type: String,
      default: 'en',
      index: true
    },
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    tagline: {
      type: String,
      default: ''
    },
    year: {
      type: Number,
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      index: true
    },
    voteCount: {
      type: String,
      default: '100K'
    },
    certification: {
      type: String,
      default: 'PG-13'
    },
    runtime: {
      type: String,
      default: '120 min'
    },
    runtimeMinutes: {
      type: Number,
      default: 120
    },
    genres: {
      type: [String],
      required: true,
      index: true
    },
    director: {
      type: String,
      required: true,
      index: true
    },
    writer: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    },
    cast: [CastMemberSchema],
    poster: {
      type: String,
      required: true
    },
    backdrop: {
      type: String,
      required: true
    },
    trailerId: {
      type: String,
      default: ''
    },
    similarityKeywords: {
      type: [String],
      default: [],
      index: true
    },
    trending: {
      type: Boolean,
      default: false
    },
    popular: {
      type: Boolean,
      default: false
    },
    topRated: {
      type: Boolean,
      default: false
    },
    recentlyReleased: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    language_override: 'none'
  }
);

// Compound Text Index for Full-Text Search with language_override: none
MovieSchema.index({
  title: 'text',
  description: 'text',
  director: 'text',
  similarityKeywords: 'text'
}, {
  default_language: 'none',
  language_override: 'none'
});

// Static helper to query by genres or minimum rating
MovieSchema.statics.findByFilter = function ({ genre, minRating, search, sort }) {
  const query = {};
  if (genre && genre !== 'All') {
    query.genres = genre;
  }
  if (minRating) {
    query.rating = { $gte: parseFloat(minRating) };
  }
  if (search) {
    query.$text = { $search: search };
  }

  let sortOption = { rating: -1 };
  if (sort === 'rating_asc') sortOption = { rating: 1 };
  if (sort === 'year_desc') sortOption = { year: -1 };
  if (sort === 'year_asc') sortOption = { year: 1 };
  if (sort === 'title_asc') sortOption = { title: 1 };

  return this.find(query).sort(sortOption);
};

export const Movie = mongoose.model('Movie', MovieSchema);
