import { describe, it, expect, beforeEach } from 'vitest';
import { 
  tokenizeText, 
  ContentBasedKNNRecommender 
} from '../../server/utils/knnRecommender.js';

describe('KNN Recommender Unit Tests', () => {
  describe('tokenizeText', () => {
    it('should convert text to lowercase and remove punctuation', () => {
      const tokens = tokenizeText('Sci-Fi & Action Movie, Directed by Nolan!');
      expect(tokens).toContain('sci-fi');
      expect(tokens).toContain('action');
      expect(tokens).toContain('movie');
      expect(tokens).toContain('directed');
      expect(tokens).toContain('nolan');
    });

    it('should filter out common English stopwords', () => {
      const tokens = tokenizeText('this is a movie about the stars and an astronaut in space');
      expect(tokens).not.toContain('this');
      expect(tokens).not.toContain('is');
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('and');
      expect(tokens).toContain('movie');
      expect(tokens).toContain('stars');
      expect(tokens).toContain('astronaut');
      expect(tokens).toContain('space');
    });

    it('should ignore short tokens of 2 characters or fewer', () => {
      const tokens = tokenizeText('it is go to up on AI');
      expect(tokens.length).toBe(0);
    });
  });

  describe('ContentBasedKNNRecommender Math & Vectors', () => {
    let recommender;
    const sampleMovies = [
      {
        id: 'interstellar-2014',
        title: 'Interstellar',
        genres: ['Sci-Fi', 'Drama', 'Adventure'],
        director: 'Christopher Nolan',
        similarityKeywords: ['black hole', 'space', 'quantum physics'],
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
        rating: 8.7
      },
      {
        id: 'inception-2010',
        title: 'Inception',
        genres: ['Sci-Fi', 'Action', 'Thriller'],
        director: 'Christopher Nolan',
        similarityKeywords: ['dreams', 'subconscious', 'mind heist'],
        description: 'A thief who steals corporate secrets through dream-sharing technology is given an inverse task.',
        rating: 8.8
      },
      {
        id: 'the-dark-knight-2008',
        title: 'The Dark Knight',
        genres: ['Action', 'Crime', 'Drama'],
        director: 'Christopher Nolan',
        similarityKeywords: ['batman', 'joker', 'vigilante', 'gotham'],
        description: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.',
        rating: 9.0
      },
      {
        id: 'ddlj-1995',
        title: 'Dilwale Dulhania Le Jayenge',
        genres: ['Romance', 'Drama'],
        director: 'Aditya Chopra',
        similarityKeywords: ['bollywood', 'romance', 'love story', 'europe trip'],
        description: 'Raj and Simran meet on a train trip across Europe and fall in love against family traditions.',
        rating: 8.0
      }
    ];

    beforeEach(() => {
      recommender = new ContentBasedKNNRecommender();
      recommender.fit(sampleMovies);
    });

    it('should fit and build non-empty vocabulary and IDF weights', () => {
      expect(recommender.isTrained).toBe(true);
      expect(recommender.vocabulary.size).toBeGreaterThan(10);
      expect(recommender.idf.length).toBe(recommender.vocabulary.size);
    });

    it('should compute L2 normalized vectors with unit norm (magnitude ≈ 1.0)', () => {
      sampleMovies.forEach(movie => {
        const vec = recommender.movieVectors.get(movie.id);
        expect(vec).toBeDefined();

        let normSq = 0;
        for (let i = 0; i < vec.length; i++) {
          normSq += vec[i] * vec[i];
        }
        const norm = Math.sqrt(normSq);
        expect(norm).toBeCloseTo(1.0, 4);
      });
    });

    it('should satisfy cosine similarity identity (cosSim(v, v) === 1.0)', () => {
      const vec = recommender.movieVectors.get('interstellar-2014');
      const sim = recommender.computeCosineSimilarity(vec, vec);
      expect(sim).toBeCloseTo(1.0, 4);
    });

    it('should satisfy cosine distance invariant (cosDist === 1 - cosSim)', () => {
      const vecA = recommender.movieVectors.get('interstellar-2014');
      const vecB = recommender.movieVectors.get('inception-2010');
      const sim = recommender.computeCosineSimilarity(vecA, vecB);
      const dist = recommender.computeCosineDistance(vecA, vecB);
      expect(dist).toBeCloseTo(1.0 - sim, 4);
      expect(sim).toBeGreaterThan(0.0);
      expect(sim).toBeLessThanOrEqual(1.0);
    });

    it('should rank Christopher Nolan Sci-Fi films higher in similarity than unrelated romance', () => {
      const neighbors = recommender.getKNearestMovies('interstellar-2014', 3);
      expect(neighbors.length).toBeGreaterThan(0);
      expect(neighbors[0].id).toBe('inception-2010');
      expect(neighbors[0].cosineSimilarity).toBeGreaterThan(neighbors[neighbors.length - 1].cosineSimilarity);
    });

    it('should synthesize personalized recommendations based on watched movies and content similarity', () => {
      const recs = recommender.getPersonalizedRecommendations({
        favoriteGenres: ['Sci-Fi'],
        watchedMovieIds: ['interstellar-2014'],
        userRatings: { 'interstellar-2014': 5.0 },
        algorithmMode: 'hybrid',
        k: 2
      });

      expect(recs.length).toBeGreaterThan(0);
      // Inception is Christopher Nolan Sci-Fi; must rank top among unwatched
      expect(recs[0].id).toBe('inception-2010');
      expect(recs[0].genres).toContain('Sci-Fi');
    });
  });
});
