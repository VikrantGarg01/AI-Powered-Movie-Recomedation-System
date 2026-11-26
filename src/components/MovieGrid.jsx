import React from 'react';
import { Film, Star, Play, Bookmark, BookmarkCheck, Eye, EyeOff, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MovieCard } from './MovieCard';
import { MoviePoster } from './MoviePoster';
import { useMovies } from '../context/MovieContext';

export const MovieGrid = ({
  movies = [],
  viewMode = 'grid',
  showMatchScore = false,
  emptyMessage = "No movies found matching your criteria."
}) => {
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist, toggleWatched, isWatched, openTrailer } = useMovies();

  if (!movies.length) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-cinema-800 border border-cinema-700 flex items-center justify-center mb-4 text-slate-500">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No Movies Found</h3>
        <p className="text-sm text-slate-400 max-w-md">{emptyMessage}</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {movies.map((movie) => {
          const isSaved = isInWatchlist(movie.id);
          const watchedStatus = isWatched(movie.id);

          return (
            <div
              key={movie.id}
              className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-cinema-850 border border-cinema-750/70 hover:border-cinema-600 transition-all hover:shadow-xl group"
            >
              {/* Thumbnail */}
              <div
                className="w-full sm:w-32 md:w-40 aspect-[2/3] rounded-xl overflow-hidden shrink-0 cursor-pointer relative"
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <MoviePoster
                  src={movie.poster}
                  alt={movie.title}
                  title={movie.title}
                  genres={movie.genres}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info & Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="font-bold text-lg text-white hover:text-cinema-cyan transition-colors cursor-pointer truncate"
                    >
                      {movie.title}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cinema-800 border border-cinema-700 text-xs font-bold text-cinema-gold">
                        <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                        {movie.rating}
                      </span>
                      {showMatchScore && (
                        <span className="px-2 py-0.5 rounded bg-cinema-accent/90 text-white text-xs font-bold">
                          {movie.matchPercentage || 90}% Match
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {movie.year}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {movie.runtime}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">
                      Dir: {movie.director}
                    </span>
                  </div>

                  {/* Genre Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {movie.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cinema-800 border border-cinema-700 text-slate-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Synopsis */}
                  <p className="text-xs sm:text-sm text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                    {movie.description}
                  </p>

                  {/* Recommendation Reason if available */}
                  {(movie.matchReasons || movie.matchReason) && (
                    <p className="text-xs text-cyan-300 font-medium mt-2">
                      ✦ {movie.matchReasons?.[0] || movie.matchReason}
                    </p>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-cinema-800">
                  <button
                    onClick={() => openTrailer(movie)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Trailer
                  </button>

                  <button
                    onClick={() => toggleWatchlist(movie.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSaved
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-cinema-800 border-cinema-700 text-slate-300 hover:text-white hover:bg-cinema-750'
                    }`}
                  >
                    {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                    {isSaved ? 'Watchlist' : 'Add to Watchlist'}
                  </button>

                  <button
                    onClick={() => toggleWatched(movie.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      watchedStatus
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-cinema-800 border-cinema-700 text-slate-300 hover:text-white hover:bg-cinema-750'
                    }`}
                  >
                    {watchedStatus ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {watchedStatus ? 'Watched' : 'Mark Watched'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default Grid View
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          showMatchScore={showMatchScore}
          matchScore={movie.matchPercentage}
          matchReason={movie.matchReasons?.[0] || movie.matchReason}
        />
      ))}
    </div>
  );
};
