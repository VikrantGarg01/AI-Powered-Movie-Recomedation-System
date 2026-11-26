import { describe, it, expect } from 'vitest';
import { getMovieSearchScore, matchMovieSearch } from '../../src/utils/searchHelper.js';

describe('Search Helper Case-Insensitive Ranking', () => {
  const ramayana = {
    id: '656908',
    title: 'Ramayana: Rise of a Legend',
    director: 'Nitesh Tiwari',
    genres: ['Action', 'Adventure', 'Indian Cinema'],
    cast: [{ name: 'Ranbir Kapoor', role: 'Rama' }]
  };

  const unrelatedWithAnaCast = {
    id: '999',
    title: 'Out of the Clear Blue Sky',
    director: 'Pepe Bojorquez',
    genres: ['Comedy', 'Drama'],
    cast: [{ name: 'Ana Claudia Talancon', role: 'Lead' }]
  };

  const unrelatedWithAramayo = {
    id: '998',
    title: 'I Swear',
    director: 'Kirk Jones',
    genres: ['Drama'],
    cast: [{ name: 'Robert Aramayo', role: 'Lead' }]
  };

  it('treats uppercase, lowercase, and mixed case identically', () => {
    const lowerScore = getMovieSearchScore(ramayana, 'ramayana');
    const upperScore = getMovieSearchScore(ramayana, 'RAMAYANA');
    const mixedScore = getMovieSearchScore(ramayana, 'RaMaYaNa');

    expect(lowerScore).toBeGreaterThan(0);
    expect(lowerScore).toBe(upperScore);
    expect(lowerScore).toBe(mixedScore);
  });

  it('ranks title matches above unrelated cast substring false positives', () => {
    expect(getMovieSearchScore(ramayana, 'ramayana')).toBeGreaterThan(
      getMovieSearchScore(unrelatedWithAnaCast, 'ramayana')
    );
    expect(matchMovieSearch(unrelatedWithAnaCast, 'ramayana')).toBe(false);
    expect(matchMovieSearch(unrelatedWithAramayo, 'ramayana')).toBe(false);
  });

  it('supports actor aliases regardless of casing', () => {
    const srkMovie = {
      id: '872906',
      title: 'Jawan',
      director: 'Atlee',
      genres: ['Action'],
      cast: [{ name: 'Shah Rukh Khan', role: 'Azad' }]
    };
    expect(matchMovieSearch(srkMovie, 'SRK')).toBe(true);
    expect(matchMovieSearch(srkMovie, 'Sharu Khan')).toBe(true);
  });
});
