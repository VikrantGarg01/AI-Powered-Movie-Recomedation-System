import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, ArrowRight, Film, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '../context/MovieContext';
import { api } from '../services/api';
import { MoviePoster } from './MoviePoster';
import { getMovieSearchScore, getMovieMatchHighlight } from '../utils/searchHelper';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);
  const { movies, mergeMovies } = useMovies();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const lastLiveQueryRef = useRef('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // will be triggered by toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredMovies = query.trim()
    ? (movies || [])
        .map((m) => ({ movie: m, score: getMovieSearchScore(m, query) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (b.movie.rating || 0) - (a.movie.rating || 0);
        })
        .map((item) => item.movie)
    : (movies || []).slice(0, 6);

  const visibleResults = filteredMovies.slice(0, 25);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 2 || filteredMovies.length >= 5) return;
    if (lastLiveQueryRef.current === trimmed.toLowerCase()) return;

    const timer = setTimeout(async () => {
      setIsSearchingTMDB(true);
      lastLiveQueryRef.current = trimmed.toLowerCase();
      try {
        const res = await api.searchLiveTMDB(trimmed);
        if (Array.isArray(res?.data) && res.data.length > 0) {
          mergeMovies(res.data);
        }
      } catch {
        // Keep local results
      } finally {
        setIsSearchingTMDB(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [isOpen, query, filteredMovies.length]);

  if (!isOpen) return null;

  const handleSelectMovie = (id) => {
    navigate(`/movie/${id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global movie search dialog"
        className="relative w-full max-w-2xl bg-cinema-850 border border-cinema-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-cinema-700/60 bg-cinema-900">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies by title, actor, director, genre..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm md:text-base focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-medium rounded border border-cinema-700 text-slate-400 bg-cinema-800">
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-1 divide-y divide-cinema-800/40">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              {query.trim() ? `Search Results (${filteredMovies.length})` : 'Popular Searches'}
              {isSearchingTMDB && <Loader2 className="w-3.5 h-3.5 animate-spin text-cinema-cyan" />}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">Click to view details</span>
          </div>

          {filteredMovies.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-white font-medium">No movies found matching "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for an actor like "Shah Rukh Khan", "Aamir", or a genre</p>
            </div>
          ) : (
            visibleResults.map((movie) => {
              const highlight = getMovieMatchHighlight(movie, query);
              const leadCast = (movie.cast || []).slice(0, 3).map((c) => c.name).join(', ');

              return (
                <div
                  key={movie.id}
                  onClick={() => handleSelectMovie(movie.id)}
                  className="group flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-cinema-750/70 cursor-pointer transition-all border border-transparent hover:border-cinema-600/50"
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-md">
                    <MoviePoster
                      src={movie.poster}
                      alt={movie.title}
                      title={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white group-hover:text-cinema-cyan transition-colors truncate">
                        {movie.title}
                      </h4>
                      <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 text-cinema-gold fill-cinema-gold" />
                        {movie.rating}
                      </span>
                      {highlight && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-cinema-800 text-cinema-cyan border border-cinema-700/80">
                          {highlight}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      {movie.year} • {movie.genres.slice(0, 3).join(', ')} • Dir: {movie.director}
                    </p>
                    {leadCast && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        <strong className="text-slate-300">Cast:</strong> {leadCast}
                      </p>
                    )}
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cinema-cyan group-hover:translate-x-1 transition-all shrink-0 mr-1" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
