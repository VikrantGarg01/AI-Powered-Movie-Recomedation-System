import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MovieCard } from './MovieCard';

export const MovieCarousel = ({
  title,
  subtitle,
  movies = [],
  viewAllLink,
  badge,
  showMatchScore = false,
  maxItems = 24
}) => {
  const scrollContainerRef = useRef(null);
  const displayMovies = maxItems > 0 ? movies.slice(0, maxItems) : movies;

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!movies.length) return null;

  return (
    <section className="relative my-8 sm:my-12">
      {/* Header Row */}
      <div className="flex items-end justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-cinema-800 text-cinema-cyan border border-cinema-700">
                {badge}
              </span>
            )}
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors mr-2 group"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Nav arrow controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-cinema-800/80 hover:bg-cinema-700 text-slate-300 hover:text-white border border-cinema-700/60 transition-colors shadow-sm"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-cinema-800/80 hover:bg-cinema-700 text-slate-300 hover:text-white border border-cinema-700/60 transition-colors shadow-sm"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-2"
      >
        {displayMovies.map((movie) => (
          <div
            key={movie.id}
            className="w-[180px] sm:w-[220px] md:w-[240px] shrink-0"
          >
            <MovieCard
              movie={movie}
              showMatchScore={showMatchScore}
              matchScore={movie.matchPercentage}
              matchReason={movie.matchReasons?.[0] || movie.matchReason}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
