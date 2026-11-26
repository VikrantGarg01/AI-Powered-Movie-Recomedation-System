/**
 * Cinema Search & Actor Matching Intelligence
 * Supports Case-Insensitive, Multi-Token, Actor Aliases, Director, Genre, and Relevance Ranking
 */

export const ACTOR_ALIASES = {
  // Indian Cinema Legends
  'sharu khan': 'Shah Rukh Khan',
  'sharu': 'Shah Rukh Khan',
  'sharukh khan': 'Shah Rukh Khan',
  'sharukh': 'Shah Rukh Khan',
  'shahrukh': 'Shah Rukh Khan',
  'shahrukh khan': 'Shah Rukh Khan',
  'srk': 'Shah Rukh Khan',
  'king khan': 'Shah Rukh Khan',
  'shah rukh': 'Shah Rukh Khan',
  'shah rukh khan': 'Shah Rukh Khan',

  'aamir': 'Aamir Khan',
  'amir': 'Aamir Khan',
  'amir khan': 'Aamir Khan',
  'aamir khan': 'Aamir Khan',

  'salman': 'Salman Khan',
  'salman khan': 'Salman Khan',
  'sallu': 'Salman Khan',

  'amitabh': 'Amitabh Bachchan',
  'bachchan': 'Amitabh Bachchan',
  'big b': 'Amitabh Bachchan',
  'amitabh bachchan': 'Amitabh Bachchan',

  'hrithik': 'Hrithik Roshan',
  'hritik': 'Hrithik Roshan',
  'hritik roshan': 'Hrithik Roshan',
  'hrithik roshan': 'Hrithik Roshan',

  'deepika': 'Deepika Padukone',
  'deepika padukone': 'Deepika Padukone',

  'ranbir': 'Ranbir Kapoor',
  'ranbir kapoor': 'Ranbir Kapoor',

  'ranveer': 'Ranveer Singh',
  'ranveer singh': 'Ranveer Singh',

  'alia': 'Alia Bhatt',
  'alia bhatt': 'Alia Bhatt',

  'prabhas': 'Prabhas',
  'yash': 'Yash',
  'rocky bhai': 'Yash',

  'ntr': 'N.T. Rama Rao Jr.',
  'jr ntr': 'N.T. Rama Rao Jr.',
  'ram charan': 'Ram Charan',
  'allu arjun': 'Allu Arjun',

  'kamal haasan': 'Kamal Haasan',
  'rajinikanth': 'Rajinikanth',
  'rajini': 'Rajinikanth',
  'thalaivar': 'Rajinikanth',

  // Global Cinema & Hollywood Stars
  'nolan': 'Christopher Nolan',
  'chris nolan': 'Christopher Nolan',
  'christopher nolan': 'Christopher Nolan',

  'dicaprio': 'Leonardo DiCaprio',
  'leo': 'Leonardo DiCaprio',
  'leo dicaprio': 'Leonardo DiCaprio',
  'leonardo dicaprio': 'Leonardo DiCaprio',

  'cillian': 'Cillian Murphy',
  'cillian murphy': 'Cillian Murphy',

  'bale': 'Christian Bale',
  'christian bale': 'Christian Bale',

  'mcconaughey': 'Matthew McConaughey',
  'matthew mcconaughey': 'Matthew McConaughey',

  'tarantino': 'Quentin Tarantino',
  'quentin tarantino': 'Quentin Tarantino',

  'chalamet': 'Timothée Chalamet',
  'timothee': 'Timothée Chalamet',
  'timothee chalamet': 'Timothée Chalamet',

  'zendaya': 'Zendaya',

  'downey': 'Robert Downey Jr.',
  'robert downey': 'Robert Downey Jr.',
  'rdj': 'Robert Downey Jr.',

  'joaquin': 'Joaquin Phoenix',
  'joaquin phoenix': 'Joaquin Phoenix'
};

/**
 * Normalizes text by removing accents, extra punctuation, and whitespace (case-insensitive)
 */
export const normalizeText = (text = '') => {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const hasWordPrefix = (text, query) => {
  if (!text || !query) return false;
  return text.split(/\s+/).some((word) => word.startsWith(query));
};

const hasExactWord = (text, query) => {
  if (!text || !query) return false;
  return text.split(/\s+/).includes(query);
};

/**
 * Computes a case-insensitive search relevance score for ranking results.
 * Higher score = higher priority in search results (0 = no match).
 */
export const getMovieSearchScore = (movie, rawQuery) => {
  if (!rawQuery || !rawQuery.trim()) return 1;
  if (!movie) return 0;

  const q = normalizeText(rawQuery);
  if (!q) return 1;

  const movieTitle = normalizeText(movie.title);
  const movieDirector = normalizeText(movie.director);
  const movieCast = (movie.cast || []).map((c) => normalizeText(c.name || '')).filter(Boolean);
  const movieGenres = (movie.genres || []).map((g) => normalizeText(g)).filter(Boolean);
  const movieKeywords = (movie.similarityKeywords || []).map((k) => normalizeText(k)).filter(Boolean);

  // 1. Title priority tiers (highest priority)
  if (movieTitle === q) return 1000;
  if (movieTitle.startsWith(q)) return 850;
  if (hasExactWord(movieTitle, q)) return 750;
  if (hasWordPrefix(movieTitle, q)) return 680;
  if (movieTitle.includes(q)) return 600;

  // 2. Direct Actor/Director Alias Lookup (e.g. 'sharu khan' / 'srk' -> 'Shah Rukh Khan')
  const aliasMatch = ACTOR_ALIASES[q];
  if (aliasMatch) {
    const normAlias = normalizeText(aliasMatch);
    if (movieCast.some((c) => c === normAlias || c.includes(normAlias))) return 500;
    if (movieDirector.includes(normAlias)) return 480;
  }

  // 3. Direct Cast / Director match
  if (movieCast.some((c) => c === q)) return 460;
  if (movieDirector === q) return 450;
  if (movieCast.some((c) => hasExactWord(c, q) || hasWordPrefix(c, q))) return 400;
  if (hasExactWord(movieDirector, q) || hasWordPrefix(movieDirector, q)) return 380;
  if (movieCast.some((c) => c.includes(q)) || movieDirector.includes(q)) return 320;

  // 4. Multi-word Token Matching (e.g. 'sharu khan', 'dark knight')
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length > 1) {
    const allTitleTokens = tokens.every((t) => movieTitle.includes(t));
    if (allTitleTokens) return 560;

    const allCastOrDirectorTokens = tokens.every((token) => {
      if (movieTitle.includes(token)) return true;
      if (hasWordPrefix(movieDirector, token)) return true;
      if (movieCast.some((c) => hasWordPrefix(c, token))) return true;
      if (movieGenres.some((g) => hasWordPrefix(g, token))) return true;

      const subAlias = ACTOR_ALIASES[token];
      if (subAlias) {
        const normSubAlias = normalizeText(subAlias);
        if (movieCast.some((c) => c.includes(normSubAlias)) || movieDirector.includes(normSubAlias)) {
          return true;
        }
      }
      return false;
    });

    if (allCastOrDirectorTokens) return 260;
  }

  // 5. Genre & Keyword matches (lowest priority)
  if (movieGenres.some((g) => g === q || hasWordPrefix(g, q))) return 180;
  if (movieKeywords.some((k) => k === q || hasWordPrefix(k, q) || k.includes(q))) return 120;

  return 0;
};

/**
 * Checks if a movie matches a user search query (case-insensitive)
 */
export const matchMovieSearch = (movie, rawQuery) => {
  return getMovieSearchScore(movie, rawQuery) > 0;
};

/**
 * Returns a human-friendly highlight string explaining why this movie matched
 */
export const getMovieMatchHighlight = (movie, rawQuery) => {
  if (!rawQuery || !rawQuery.trim() || !movie) return null;
  const q = normalizeText(rawQuery);
  if (!q) return null;

  // If title directly matches, don't label it as an actor/genre match
  if (normalizeText(movie.title).includes(q)) {
    return null;
  }

  const alias = ACTOR_ALIASES[q];
  const targetActor = alias ? normalizeText(alias) : q;

  const matchedActor = (movie.cast || []).find((c) => {
    const norm = normalizeText(c.name);
    return norm.includes(targetActor) || hasWordPrefix(norm, targetActor);
  });

  if (matchedActor) {
    return `Starring ${matchedActor.name}`;
  }

  if (movie.director && normalizeText(movie.director).includes(q)) {
    return `Directed by ${movie.director}`;
  }

  const matchedGenre = (movie.genres || []).find((g) => normalizeText(g).includes(q));
  if (matchedGenre) {
    return `Genre: ${matchedGenre}`;
  }

  return null;
};
