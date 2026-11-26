import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info, Star, Clock, Calendar, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '../context/MovieContext';

export const HeroBanner = () => {
  const { movies, toggleWatchlist, isInWatchlist, openTrailer } = useMovies();
  const navigate = useNavigate();

  // Featured spotlight movies dynamically selected from real TMDB catalog
  const heroMovies = React.useMemo(() => {
    if (!movies || movies.length === 0) return [];
    const featured = movies.filter(
      (m) => m.backdrop && (m.trending || m.popular || m.rating >= 8.2)
    );
    return featured.length >= 5 ? featured.slice(0, 6) : movies.slice(0, 6);
  }, [movies]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const currentMovie = heroMovies[currentIndex] || movies[0];

  // Auto-advance banner every 8 seconds unless hovered
  useEffect(() => {
    if (isHovered || heroMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isHovered, heroMovies.length]);

  if (!currentMovie) return null;

  const isSaved = isInWatchlist(currentMovie.id);

  return (
    <div
      className="relative w-full min-h-[75vh] md:min-h-[85vh] flex items-end pb-12 md:pb-20 pt-28 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentMovie.backdrop}
          alt={currentMovie.title}
          className="w-full h-full object-cover object-center transition-all duration-1000 scale-105"
        />
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-cinema-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-900 via-cinema-900/80 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-hero-gradient" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl space-y-4">
          {/* Spotlight Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-800/80 border border-cinema-700/60 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cinema-accent animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-cinema-cyan flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Featured Spotlight
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-medium text-emerald-400">98% Match</span>
          </div>

          {/* Title */}
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight drop-shadow-md">
            {currentMovie.title}
          </h1>

          {/* Tagline */}
          {currentMovie.tagline && (
            <p className="text-sm sm:text-base font-medium italic text-slate-300 drop-shadow">
              "{currentMovie.tagline}"
            </p>
          )}

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1 font-bold text-cinema-gold bg-cinema-800/70 px-2 py-0.5 rounded border border-cinema-700/50">
              <Star className="w-4 h-4 fill-cinema-gold" />
              {currentMovie.rating}
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {currentMovie.year}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {currentMovie.runtime}
            </span>
            <span>•</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] font-bold uppercase bg-cinema-700 text-slate-200">
              {currentMovie.certification || 'PG-13'}
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              {currentMovie.genres.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-cinema-800/80 border border-cinema-700 text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 max-w-xl drop-shadow">
            {currentMovie.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => openTrailer(currentMovie)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover text-white font-semibold text-sm shadow-lg shadow-cinema-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Trailer
            </button>

            <button
              onClick={() => toggleWatchlist(currentMovie.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm border backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-cinema-800/80 border-cinema-700 text-white hover:bg-cinema-700'
              }`}
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
              {isSaved ? 'In Watchlist' : 'Add to Watchlist'}
            </button>

            <button
              onClick={() => navigate(`/movie/${currentMovie.id}`)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-cinema-800/60 hover:bg-cinema-800 border border-cinema-700/60 text-slate-300 hover:text-white text-sm transition-all"
              aria-label="View movie details"
            >
              <Info className="w-4 h-4" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Rotation Slider Controls & Indicators */}
      <div className="absolute bottom-4 right-4 sm:right-8 z-20 flex items-center gap-2">
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length)}
          className="p-2 rounded-full bg-cinema-800/80 hover:bg-cinema-700 text-slate-300 hover:text-white border border-cinema-700 transition-all"
          aria-label="Previous featured movie"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {heroMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-cinema-accent' : 'w-2 bg-slate-600 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % heroMovies.length)}
          className="p-2 rounded-full bg-cinema-800/80 hover:bg-cinema-700 text-slate-300 hover:text-white border border-cinema-700 transition-all"
          aria-label="Next featured movie"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
