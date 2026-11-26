import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { MOVIES_DATA, ALL_GENRES } from '../data/moviesData';
import { getPersonalizedRecommendations, getSimilarMovies } from '../utils/recommendationEngine';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const MovieContext = createContext(null);

const deduplicateMovies = (list) => {
  const seen = new Set();
  return (list || []).filter((m) => {
    const key = String(m.tmdbId || m.id);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const MovieProvider = ({ children }) => {
  const { showToast } = useToast();
  const { user, updateProfile, isAuthenticated } = useAuth();

  // Dynamic movies state initialized from real TMDB catalog
  const [movies, setMovies] = useState(() => deduplicateMovies(MOVIES_DATA));

  const mergeMovies = (incomingMovies = []) => {
    if (!Array.isArray(incomingMovies) || incomingMovies.length === 0) return;
    setMovies((prev) => deduplicateMovies([...incomingMovies, ...(prev || [])]));
  };

  // Sync all movies from backend MongoDB / TMDB on startup
  useEffect(() => {
    let isMounted = true;
    api.getAllMovies({ pageSize: 2500 })
      .then((fetched) => {
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          setMovies(deduplicateMovies([...fetched, ...MOVIES_DATA]));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Derive sorted genres dynamically from loaded movies, guaranteeing 'All' is first
  const allGenres = useMemo(() => {
    const genreSet = new Set(
      (ALL_GENRES || []).filter((g) => g && g !== 'All')
    );
    (movies || []).forEach((m) => {
      (m.genres || []).forEach((g) => {
        if (g && g !== 'All') genreSet.add(g);
      });
    });
    return ['All', ...Array.from(genreSet).sort()];
  }, [movies]);

  const safeParseArray = (val) => {
    try {
      if (!val) return [];
      const p = JSON.parse(val);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  };

  const safeParseObject = (val) => {
    try {
      if (!val) return {};
      const p = JSON.parse(val);
      return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    } catch {
      return {};
    }
  };

  const userKey = user?.email ? user.email.toLowerCase().trim() : 'guest';
  const loadedUserKeyRef = useRef(userKey);
  const isLoadedRef = useRef(false);

  // Watchlist state scoped to current account
  const [watchlist, setWatchlist] = useState(() => {
    return safeParseArray(localStorage.getItem(`cinepulse_watchlist_${userKey}`));
  });

  // Watched history scoped to current account
  const [watched, setWatched] = useState(() => {
    return safeParseArray(localStorage.getItem(`cinepulse_watched_${userKey}`));
  });

  // User movie ratings scoped to current account
  const [userRatings, setUserRatings] = useState(() => {
    return safeParseObject(localStorage.getItem(`cinepulse_ratings_${userKey}`));
  });

  // Active Trailer modal target
  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);

  // Recommendation algorithm mode
  const [algorithmMode, setAlgorithmMode] = useState('hybrid'); // 'hybrid' | 'genre' | 'watched' | 'rating'

  // Load account data from backend MongoDB or user-scoped cache on login / user switch
  useEffect(() => {
    let isMounted = true;
    const currentKey = user?.email ? user.email.toLowerCase().trim() : 'guest';

    // Guard against race condition: mark loading for the new userKey
    loadedUserKeyRef.current = currentKey;
    isLoadedRef.current = false;

    // 1. Immediately hydrate from local cache for currentKey without delay
    const cachedWatchlist = safeParseArray(localStorage.getItem(`cinepulse_watchlist_${currentKey}`));
    const cachedWatched = safeParseArray(localStorage.getItem(`cinepulse_watched_${currentKey}`));
    const cachedRatings = safeParseObject(localStorage.getItem(`cinepulse_ratings_${currentKey}`));

    setWatchlist(cachedWatchlist);
    setWatched(cachedWatched);
    setUserRatings(cachedRatings);

    // If unauthenticated or guest session, initial hydration is complete
    if (!isAuthenticated || !user) {
      isLoadedRef.current = true;
      return () => { isMounted = false; };
    }

    // 2. For authenticated users, synchronize authoritative state from backend API
    const syncBackendData = async () => {
      try {
        const token = localStorage.getItem('cinepulse_token');
        if (!token) {
          isLoadedRef.current = true;
          return;
        }

        const backendData = await api.getWatchlist();
        if (!isMounted || loadedUserKeyRef.current !== currentKey) {
          return;
        }

        if (backendData) {
          if (Array.isArray(backendData.watchlist)) {
            const normalizedWatchlist = backendData.watchlist.map(String);
            setWatchlist(normalizedWatchlist);
            localStorage.setItem(`cinepulse_watchlist_${currentKey}`, JSON.stringify(normalizedWatchlist));
          }
          if (Array.isArray(backendData.watched)) {
            const normalizedWatched = backendData.watched.map(String);
            setWatched(normalizedWatched);
            localStorage.setItem(`cinepulse_watched_${currentKey}`, JSON.stringify(normalizedWatched));
          }
          if (backendData.userRatings && typeof backendData.userRatings === 'object') {
            setUserRatings(backendData.userRatings);
            localStorage.setItem(`cinepulse_ratings_${currentKey}`, JSON.stringify(backendData.userRatings));
          }
        }
      } catch (err) {
        // Maintain local storage cache if offline
      } finally {
        if (isMounted && loadedUserKeyRef.current === currentKey) {
          isLoadedRef.current = true;
        }
      }
    };

    syncBackendData();

    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.id, isAuthenticated]);

  // Persist state changes to account-scoped local cache ONLY when fully loaded for the current user
  useEffect(() => {
    if (!isLoadedRef.current || loadedUserKeyRef.current !== userKey) return;
    localStorage.setItem(`cinepulse_watchlist_${userKey}`, JSON.stringify(watchlist || []));
  }, [watchlist, userKey]);

  useEffect(() => {
    if (!isLoadedRef.current || loadedUserKeyRef.current !== userKey) return;
    localStorage.setItem(`cinepulse_watched_${userKey}`, JSON.stringify(watched || []));
  }, [watched, userKey]);

  useEffect(() => {
    if (!isLoadedRef.current || loadedUserKeyRef.current !== userKey) return;
    localStorage.setItem(`cinepulse_ratings_${userKey}`, JSON.stringify(userRatings || {}));
  }, [userRatings, userKey]);

  // Derived user genres (empty by default)
  const favoriteGenres = Array.isArray(user?.favoriteGenres) ? user.favoriteGenres : [];

  // Toggle Watchlist with live backend sync & immediate local persistence
  const toggleWatchlist = (movieId) => {
    if (!movieId) return;
    if (!isAuthenticated) {
      showToast('Please sign in to save movies to your watchlist.', 'info');
      return;
    }
    const strId = String(movieId).trim();
    const movie = (movies || []).find((m) => String(m.id) === strId || String(m.tmdbId) === strId);
    const title = movie ? movie.title : 'Movie';

    setWatchlist((prev) => {
      const arr = Array.isArray(prev) ? prev.map(String) : [];
      const exists = arr.some((id) => id === strId);
      let updated;
      if (exists) {
        showToast(`Removed "${title}" from Watchlist`, 'info');
        updated = arr.filter((id) => id !== strId);
      } else {
        showToast(`Added "${title}" to your Watchlist!`, 'success');
        updated = [...arr, strId];
      }
      localStorage.setItem(`cinepulse_watchlist_${userKey}`, JSON.stringify(updated));
      return updated;
    });

    api.toggleWatchlist(strId).catch(() => {});
  };

  const isInWatchlist = (movieId) => {
    if (!movieId || !Array.isArray(watchlist)) return false;
    const strId = String(movieId).trim();
    return watchlist.some((id) => String(id) === strId);
  };

  // Toggle Watched with live backend sync & immediate local persistence
  const toggleWatched = (movieId) => {
    if (!movieId) return;
    if (!isAuthenticated) {
      showToast('Please sign in to record watched films.', 'info');
      return;
    }
    const strId = String(movieId).trim();
    const movie = (movies || []).find((m) => String(m.id) === strId || String(m.tmdbId) === strId);
    const title = movie ? movie.title : 'Movie';

    setWatched((prev) => {
      const arr = Array.isArray(prev) ? prev.map(String) : [];
      const isAlreadyWatched = arr.some((id) => id === strId);
      let updated;
      if (isAlreadyWatched) {
        showToast(`Unmarked "${title}" as watched`, 'info');
        updated = arr.filter((id) => id !== strId);
      } else {
        showToast(`Marked "${title}" as watched! Recommendations updated.`, 'success');
        updated = [...arr, strId];
      }
      localStorage.setItem(`cinepulse_watched_${userKey}`, JSON.stringify(updated));
      return updated;
    });

    api.toggleWatched(strId).catch(() => {});
  };

  const isWatched = (movieId) => {
    if (!movieId || !Array.isArray(watched)) return false;
    const strId = String(movieId).trim();
    return watched.some((id) => String(id) === strId);
  };

  // Rate Movie with live backend sync & immediate local persistence
  const rateMovie = (movieId, rating) => {
    if (!movieId) return;
    if (!isAuthenticated) {
      showToast('Please sign in to rate movies.', 'info');
      return;
    }
    const strId = String(movieId).trim();
    const movie = movies.find((m) => String(m.id) === strId || String(m.tmdbId) === strId);
    const title = movie ? movie.title : 'Movie';

    setUserRatings((prev) => {
      const updated = {
        ...prev,
        [strId]: rating
      };
      localStorage.setItem(`cinepulse_ratings_${userKey}`, JSON.stringify(updated));
      return updated;
    });

    // Auto mark as watched if rated
    setWatched((prev) => {
      const arr = Array.isArray(prev) ? prev.map(String) : [];
      if (!arr.some((id) => id === strId)) {
        const updated = [...arr, strId];
        localStorage.setItem(`cinepulse_watched_${userKey}`, JSON.stringify(updated));
        return updated;
      }
      return arr;
    });

    showToast(`Rated "${title}" ${rating}★!`, 'success');
    api.submitRating(strId, rating).catch(() => {});
  };

  // Toggle Favorite Genre in Profile
  const toggleFavoriteGenre = (genre) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save your favorite genres.', 'info');
      return;
    }
    if (genre === 'All') return;
    const current = [...favoriteGenres];
    const index = current.indexOf(genre);
    let updated;
    if (index > -1) {
      updated = current.filter((g) => g !== genre);
    } else {
      updated = [...current, genre];
    }
    updateProfile({ favoriteGenres: updated });
    showToast(
      updated.length > 0 
        ? `Preferences updated: ${updated.join(', ')}` 
        : 'All genre preferences cleared.', 
      'info'
    );
  };

  // Trailer Modal controls
  const openTrailer = (movie) => {
    setActiveTrailerMovie(movie);
  };

  const closeTrailer = () => {
    setActiveTrailerMovie(null);
  };

  // Reset user preferences
  const resetPreferences = () => {
    setWatchlist([]);
    setWatched([]);
    setUserRatings({});
    localStorage.removeItem(`cinepulse_watchlist_${userKey}`);
    localStorage.removeItem(`cinepulse_watched_${userKey}`);
    localStorage.removeItem(`cinepulse_ratings_${userKey}`);
    showToast('Preferences cleared for this account!', 'info');
  };

  // Filtered categories computed dynamically from real TMDB movies state
  const trendingMovies = useMemo(() => deduplicateMovies(movies.filter((m) => m.trending)), [movies]);
  const popularMovies = useMemo(() => deduplicateMovies(movies.filter((m) => m.popular)), [movies]);
  const topRatedMovies = useMemo(() => deduplicateMovies(movies.filter((m) => m.topRated)), [movies]);
  const recentlyReleasedMovies = useMemo(() => deduplicateMovies(movies.filter((m) => m.recentlyReleased)), [movies]);
  const indianMovies = useMemo(
    () => deduplicateMovies(movies.filter((m) => (m.genres || []).includes('Indian Cinema') || ['hi', 'te', 'ta', 'ml', 'kn'].includes(m.language))),
    [movies]
  );

  // Personalized dynamic recommendations
  const personalizedRecommendations = useMemo(() => {
    return getPersonalizedRecommendations({
      allMovies: movies,
      favoriteGenres,
      watchedMovieIds: (watched || []).map(String),
      userRatings,
      algorithmMode
    });
  }, [movies, favoriteGenres, watched, userRatings, algorithmMode]);

  // Last watched movie for "Because You Watched"
  const lastWatchedMovie = useMemo(() => {
    if (!watched.length) return null;
    const lastId = String(watched[watched.length - 1]);
    return movies.find((m) => String(m.id) === lastId || String(m.tmdbId) === lastId) || null;
  }, [watched, movies]);

  const becauseYouWatchedRecommendations = useMemo(() => {
    if (!lastWatchedMovie) return [];
    return getSimilarMovies(lastWatchedMovie, movies, 6);
  }, [lastWatchedMovie, movies]);

  // Movies matching top favorite genres
  const favoriteGenreMovies = useMemo(() => {
    const topGenre = favoriteGenres[0] || 'Sci-Fi';
    return movies.filter((m) => (m.genres || []).includes(topGenre));
  }, [favoriteGenres, movies]);

  const getMovieById = (id) => movies.find((m) => String(m.id) === String(id) || String(m.tmdbId) === String(id));

  return (
    <MovieContext.Provider
      value={{
        movies,
        mergeMovies,
        allGenres,
        watchlist,
        watched,
        userRatings,
        favoriteGenres,
        algorithmMode,
        setAlgorithmMode,
        toggleWatchlist,
        isInWatchlist,
        toggleWatched,
        isWatched,
        rateMovie,
        toggleFavoriteGenre,
        activeTrailerMovie,
        openTrailer,
        closeTrailer,
        resetPreferences,
        getMovieById,
        trendingMovies,
        popularMovies,
        topRatedMovies,
        recentlyReleasedMovies,
        indianMovies,
        personalizedRecommendations,
        lastWatchedMovie,
        becauseYouWatchedRecommendations,
        favoriteGenreMovies
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovies must be used within a MovieProvider');
  }
  return context;
};
