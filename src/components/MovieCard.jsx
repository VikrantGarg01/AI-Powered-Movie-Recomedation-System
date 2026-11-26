import React from 'react';
import { Star, Play, Check, Bookmark, BookmarkCheck, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '../context/MovieContext';
import { MoviePoster } from './MoviePoster';

export const MovieCard = ({ movie, showMatchScore = false, matchScore, matchReason }) => {
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist, toggleWatched, isWatched, openTrailer } = useMovies();

  if (!movie) return null;

  const isSaved = isInWatchlist(movie.id);
  const watchedStatus = isWatched(movie.id);

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-cinema-850 border border-cinema-750/70 hover:border-cinema-600 transition-all duration-300 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1 flex flex-col h-full">
      {/* Poster Media Box */}
      <div 
        className="relative aspect-[2/3] w-full overflow-hidden bg-cinema-900 cursor-pointer"
        onClick={() => navigate(`/movie/${movie.id}`)}
      >
        <MoviePoster
          src={movie.poster}
          alt={movie.title}
          title={movie.title}
          genres={movie.genres}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {/* Rating */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-cinema-gold">
            <Star className="w-3.5 h-3.5 fill-cinema-gold" />
            <span>{movie.rating}</span>
          </div>

          {/* Match Score (if in recommendation mode) */}
          {showMatchScore && (
            <div className="px-2 py-0.5 rounded-lg bg-cinema-accent/90 backdrop-blur-md text-[11px] font-bold text-white shadow-md">
              {matchScore || movie.matchPercentage || 92}% Match
            </div>
          )}

          {/* Watched Badge */}
          {watchedStatus && !showMatchScore && (
            <div className="px-2 py-0.5 rounded-lg bg-emerald-500/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-1">
              <Check className="w-3 h-3" /> Watched
            </div>
          )}
        </div>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 z-20">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openTrailer(movie);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-cinema-accent hover:bg-cinema-accentHover text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Play Trailer"
              aria-label={`Play trailer for ${movie.title}`}
            >
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(movie.id);
                }}
                className={`p-2 rounded-full border backdrop-blur-md transition-colors ${
                  isSaved
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-black/60 border-white/20 text-white hover:bg-white/20'
                }`}
                title={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                aria-label={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatched(movie.id);
                }}
                className={`p-2 rounded-full border backdrop-blur-md transition-colors ${
                  watchedStatus
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-black/60 border-white/20 text-white hover:bg-white/20'
                }`}
                title={watchedStatus ? "Mark as unwatched" : "Mark as watched"}
                aria-label={watchedStatus ? "Mark as unwatched" : "Mark as watched"}
              >
                {watchedStatus ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <h3 
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="font-bold text-white text-sm hover:text-cinema-cyan transition-colors truncate cursor-pointer"
            title={movie.title}
          >
            {movie.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
            <span>{movie.year}</span>
            <span>•</span>
            <span className="truncate max-w-[120px]">{movie.genres[0]}</span>
            <span>•</span>
            <span>{movie.runtime}</span>
          </div>

          {matchReason && (
            <p className="text-[11px] text-cyan-300/90 line-clamp-1 mt-1.5 font-medium">
              ✦ {matchReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
