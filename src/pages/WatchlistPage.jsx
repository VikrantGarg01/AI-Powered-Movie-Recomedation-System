import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bookmark, 
  Trash2, 
  Check, 
  Star, 
  Film, 
  Play
} from 'lucide-react';
import { useMovies } from '../context/MovieContext';
import { MoviePoster } from '../components/MoviePoster';

export const WatchlistPage = () => {
  const { 
    watchlist, 
    watched, 
    movies, 
    toggleWatchlist, 
    toggleWatched, 
    openTrailer 
  } = useMovies();

  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unwatched' | 'watched'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'rating' | 'year' | 'runtime'

  // Map IDs to movie objects in order of watchlist
  const watchlistMovies = useMemo(() => {
    return (watchlist || [])
      .map((id) => (movies || []).find((m) => String(m.id) === String(id) || String(m.tmdbId) === String(id)))
      .filter(Boolean);
  }, [watchlist, movies]);

  // Total runtime minutes
  const totalRuntimeMinutes = useMemo(() => {
    return watchlistMovies.reduce((acc, m) => acc + (m.runtimeMinutes || 120), 0);
  }, [watchlistMovies]);

  const totalHours = Math.floor(totalRuntimeMinutes / 60);
  const remainingMins = totalRuntimeMinutes % 60;

  // Filtered & Sorted list
  const displayMovies = useMemo(() => {
    return watchlistMovies
      .filter((movie) => {
        const isMovieWatched = (watched || []).some(
          (id) => String(id) === String(movie.id) || String(id) === String(movie.tmdbId)
        );
        if (filterMode === 'unwatched') return !isMovieWatched;
        if (filterMode === 'watched') return isMovieWatched;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'year') return b.year - a.year;
        if (sortBy === 'runtime') return (b.runtimeMinutes || 0) - (a.runtimeMinutes || 0);
        return 0; // default order
      });
  }, [watchlistMovies, filterMode, sortBy, watched]);

  const watchedInWatchlistCount = watchlistMovies.filter((m) =>
    (watched || []).some((id) => String(id) === String(m.id) || String(id) === String(m.tmdbId))
  ).length;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header and Stats Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-cinema-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-800 border border-cinema-700 text-cinema-accent text-xs font-semibold mb-2">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Queue</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            My Watchlist
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage movies you intend to watch. Mark titles completed to update recommendation metrics.
          </p>
        </div>

        {/* Stats Pill Card */}
        {watchlistMovies.length > 0 && (
          <div className="flex items-center gap-4 sm:gap-6 p-4 rounded-2xl bg-cinema-850/80 border border-cinema-750 backdrop-blur-md text-xs">
            <div>
              <p className="text-slate-400">Total Saved</p>
              <p className="text-lg font-extrabold text-white">{watchlistMovies.length}</p>
            </div>
            <div className="h-8 w-px bg-cinema-700/60" />
            <div>
              <p className="text-slate-400">Completed</p>
              <p className="text-lg font-extrabold text-emerald-400">
                {watchedInWatchlistCount}
              </p>
            </div>
            <div className="h-8 w-px bg-cinema-700/60" />
            <div>
              <p className="text-slate-400">Total Duration</p>
              <p className="text-lg font-extrabold text-white">
                {totalHours}h {remainingMins}m
              </p>
            </div>
          </div>
        )}
      </div>

      {watchlistMovies.length === 0 ? (
        /* Empty Watchlist State */
        <div className="py-24 text-center glass-panel rounded-3xl border border-cinema-800 p-8 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-cinema-800/80 border border-cinema-700 flex items-center justify-center mx-auto mb-4 text-cinema-accent">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
            You haven't added any movies to your watchlist yet. Explore our discovery catalog to start building your queue!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/discover"
              className="px-6 py-2.5 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-bold shadow-md shadow-cinema-accent/30 transition-all flex items-center gap-2"
            >
              <Film className="w-4 h-4" />
              Discover Movies
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Controls: Filter & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex p-1 rounded-xl bg-cinema-850 border border-cinema-750 text-xs font-medium">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterMode === 'all'
                    ? 'bg-cinema-750 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Movies ({watchlistMovies.length})
              </button>
              <button
                onClick={() => setFilterMode('unwatched')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterMode === 'unwatched'
                    ? 'bg-cinema-750 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                To Watch ({watchlistMovies.length - watchedInWatchlistCount})
              </button>
              <button
                onClick={() => setFilterMode('watched')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterMode === 'watched'
                    ? 'bg-cinema-750 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Watched ({watchedInWatchlistCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-cinema-850 border border-cinema-750 text-white px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="default">Date Added</option>
                <option value="rating">Highest Rated</option>
                <option value="year">Release Year (Newest)</option>
                <option value="runtime">Duration (Longest)</option>
              </select>
            </div>
          </div>

          {/* Watchlist Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayMovies.map((movie) => {
              const isMovieWatched = (watched || []).some(
                (id) => String(id) === String(movie.id) || String(id) === String(movie.tmdbId)
              );

              return (
                <div
                  key={movie.id}
                  className="p-3.5 rounded-2xl bg-cinema-850 border border-cinema-750 hover:border-cinema-600 transition-all flex gap-3.5 items-start group relative shadow-md hover:shadow-xl"
                >
                  {/* Poster */}
                  <Link
                    to={`/movie/${movie.id}`}
                    className="w-24 aspect-[2/3] rounded-xl overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-transform"
                  >
                    <MoviePoster
                      src={movie.poster}
                      alt={movie.title}
                      title={movie.title}
                      genres={movie.genres}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Metadata & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <Link
                          to={`/movie/${movie.id}`}
                          className="font-bold text-white text-sm hover:text-cinema-cyan transition-colors truncate"
                          title={movie.title}
                        >
                          {movie.title}
                        </Link>
                        <span className="flex items-center gap-0.5 text-xs font-bold text-cinema-gold">
                          <Star className="w-3 h-3 fill-cinema-gold" />
                          {movie.rating}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span>{movie.runtime}</span>
                        <span>•</span>
                        <span className="text-slate-300">{movie.genres[0]}</span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {movie.description}
                      </p>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-cinema-800">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleWatched(movie.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            isMovieWatched
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-cinema-800 border-cinema-700 text-slate-300 hover:text-white'
                          }`}
                          title={isMovieWatched ? 'Unmark as watched' : 'Mark as watched'}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isMovieWatched ? 'Watched' : 'Mark Watched'}</span>
                        </button>

                        <button
                          onClick={() => openTrailer(movie)}
                          className="p-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-750 text-slate-300 hover:text-white border border-cinema-700"
                          title="Watch Trailer"
                          aria-label={`Play trailer for ${movie.title}`}
                        >
                          <Play className="w-3 h-3 fill-slate-300" />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleWatchlist(movie.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove from Watchlist"
                        aria-label={`Remove ${movie.title} from Watchlist`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
