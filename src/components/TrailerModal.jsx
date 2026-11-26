import React, { useEffect } from 'react';
import { X, Star, Clock, Calendar, Bookmark, BookmarkCheck, Play } from 'lucide-react';
import { useMovies } from '../context/MovieContext';

export const TrailerModal = () => {
  const { activeTrailerMovie, closeTrailer, toggleWatchlist, isInWatchlist } = useMovies();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeTrailer();
    };
    if (activeTrailerMovie) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [activeTrailerMovie, closeTrailer]);

  if (!activeTrailerMovie) return null;

  const isSaved = isInWatchlist(activeTrailerMovie.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={closeTrailer} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trailer-modal-title"
        className="relative w-full max-w-4xl bg-cinema-850 border border-cinema-700/60 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cinema-700/50 bg-cinema-900/90">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cinema-accent animate-ping" />
            <h3 id="trailer-modal-title" className="font-bold text-white text-base md:text-lg truncate">
              {activeTrailerMovie.title} — Official Trailer
            </h3>
          </div>
          <button
            onClick={closeTrailer}
            className="p-1.5 rounded-lg bg-cinema-800 text-slate-300 hover:text-white hover:bg-cinema-700 transition-colors"
            aria-label="Close trailer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {activeTrailerMovie.trailerId ? (
            <iframe
              className="w-full h-full border-0"
              src={`https://www.youtube-nocookie.com/embed/${activeTrailerMovie.trailerId}?autoplay=1&rel=0&modestbranding=1`}
              title={`${activeTrailerMovie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Play className="w-12 h-12 text-cinema-accent mb-3 animate-pulse" />
              <p className="text-white font-semibold">Official Trailer Preview</p>
              <p className="text-sm text-slate-400 mt-1">Cinematic high-definition teaser preview</p>
            </div>
          )}
        </div>

        {/* Info & Metadata Footer */}
        <div className="p-5 overflow-y-auto bg-cinema-900/95 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-cinema-700/40">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-3 text-xs md:text-sm text-slate-300">
              <span className="flex items-center text-cinema-gold font-bold">
                <Star className="w-4 h-4 fill-cinema-gold mr-1" />
                {activeTrailerMovie.rating}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {activeTrailerMovie.year}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {activeTrailerMovie.runtime}
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-cinema-800 text-xs border border-cinema-700 text-slate-300">
                {activeTrailerMovie.genres?.slice(0, 2).join(' / ')}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 line-clamp-2">
              {activeTrailerMovie.description}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => toggleWatchlist(activeTrailerMovie.id)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all w-full md:w-auto ${
                isSaved
                  ? 'bg-cinema-700 text-emerald-400 border border-emerald-500/30 hover:bg-cinema-600'
                  : 'bg-white text-slate-900 hover:bg-slate-200'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  Saved to Watchlist
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Add to Watchlist
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
