import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  Grid, 
  List, 
  Star, 
  RotateCcw, 
  Compass,
  Loader2,
  Globe
} from 'lucide-react';
import { useMovies } from '../context/MovieContext';
import { api } from '../services/api';
import { SearchBar } from '../components/SearchBar';
import { getMovieSearchScore } from '../utils/searchHelper';
import { GenreFilter } from '../components/GenreFilter';
import { MovieGrid } from '../components/MovieGrid';

const PAGE_SIZE = 48;

export const DiscoverPage = () => {
  const { movies, allGenres, mergeMovies } = useMovies();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial values from URL params if present
  const initialGenre = searchParams.get('genre') || 'All';
  const initialSort = searchParams.get('sort') || 'popularity';
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [minRating, setMinRating] = useState('0'); // 0, 7.5, 8.0, 8.5
  const [sortBy, setSortBy] = useState(initialSort); // 'popularity', 'rating', 'year', 'title'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);
  const lastLiveQueryRef = useRef('');

  // Sync state if URL query changes
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    if (genreParam && allGenres.includes(genreParam)) {
      setSelectedGenre(genreParam);
    }
    const sortParam = searchParams.get('sort');
    if (sortParam) {
      setSortBy(sortParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam !== null && searchParam !== undefined) {
      setSearchQuery(searchParam);
    }
  }, [searchParams, allGenres]);

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    if (genre === 'All') {
      searchParams.delete('genre');
    } else {
      searchParams.set('genre', genre);
    }
    setSearchParams(searchParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setMinRating('0');
    setSortBy('popularity');
    setVisibleCount(PAGE_SIZE);
    setSearchParams({});
  };

  // Reset pagination when active filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedGenre, minRating, sortBy]);

  // Filter & Sort Logic (with case-insensitive search relevance priority when searching)
  const filteredMovies = useMemo(() => {
    const trimmedSearch = searchQuery.trim();
    const minR = parseFloat(minRating);

    return movies
      .map((movie) => ({
        movie,
        searchScore: trimmedSearch ? getMovieSearchScore(movie, trimmedSearch) : 0
      }))
      .filter(({ movie, searchScore }) => {
        if (trimmedSearch && searchScore <= 0) {
          return false;
        }

        // Genre filter
        if (selectedGenre !== 'All' && !(movie.genres || []).includes(selectedGenre)) {
          return false;
        }

        // Min Rating filter
        if (minR > 0 && movie.rating < minR) {
          return false;
        }

        return true;
      })
      .sort((entryA, entryB) => {
        if (trimmedSearch && entryB.searchScore !== entryA.searchScore) {
          return entryB.searchScore - entryA.searchScore;
        }
        const a = entryA.movie;
        const b = entryB.movie;
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        if (sortBy === 'year') {
          return b.year - a.year;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        // Popularity default
        const parseVotes = (str) => {
          if (!str) return 0;
          if (str.includes('M')) return parseFloat(str) * 1000000;
          if (str.includes('K')) return parseFloat(str) * 1000;
          return parseFloat(str) || 0;
        };
        return parseVotes(b.voteCount) - parseVotes(a.voteCount);
      })
      .map(({ movie }) => movie);
  }, [movies, searchQuery, selectedGenre, minRating, sortBy]);

  // Debounced live TMDB fallback search when local results are sparse
  const triggerLiveTMDBSearch = async (queryText) => {
    const trimmed = (queryText || '').trim();
    if (trimmed.length < 2) return;
    setIsSearchingTMDB(true);
    lastLiveQueryRef.current = trimmed.toLowerCase();
    try {
      const res = await api.searchLiveTMDB(trimmed);
      if (Array.isArray(res?.data) && res.data.length > 0) {
        mergeMovies(res.data);
      }
    } catch {
      // Offline or rate-limited; keep local results
    } finally {
      setIsSearchingTMDB(false);
    }
  };

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;
    if (filteredMovies.length >= 6) return;
    if (lastLiveQueryRef.current === trimmed.toLowerCase()) return;

    const timer = setTimeout(() => {
      triggerLiveTMDBSearch(trimmed);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, filteredMovies.length]);

  const displayedMovies = useMemo(
    () => filteredMovies.slice(0, visibleCount),
    [filteredMovies, visibleCount]
  );

  const hasMoreMovies = visibleCount < filteredMovies.length;
  const hasActiveFilters = searchQuery !== '' || selectedGenre !== 'All' || minRating !== '0' || sortBy !== 'popularity';

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-cinema-800 border border-cinema-700 text-cinema-cyan">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cinema-cyan">
            Movie Catalog Explorer
          </span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          Discover Movies
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Search, filter by genre and rating, and explore {movies.length.toLocaleString()}+ movies plus live TMDB search.
        </p>
      </div>

      {/* Control Bar: Search & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          className="flex-1"
          placeholder="Search by title, director, actor (e.g. Christopher Nolan, Zendaya)..."
        />

        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          {/* Rating filter dropdown */}
          <div className="flex items-center gap-1.5 bg-cinema-850 px-3 py-2 rounded-xl border border-cinema-700/80 text-xs">
            <Star className="w-4 h-4 text-cinema-gold fill-cinema-gold" />
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="0" className="bg-cinema-900 text-white">All Ratings</option>
              <option value="7.5" className="bg-cinema-900 text-white">7.5+ Rating</option>
              <option value="8.0" className="bg-cinema-900 text-white">8.0+ High Rating</option>
              <option value="8.5" className="bg-cinema-900 text-white">8.5+ Masterpiece</option>
            </select>
          </div>

          {/* Sort selector dropdown */}
          <div className="flex items-center gap-1.5 bg-cinema-850 px-3 py-2 rounded-xl border border-cinema-700/80 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="popularity" className="bg-cinema-900 text-white">Most Popular</option>
              <option value="rating" className="bg-cinema-900 text-white">Highest Rated</option>
              <option value="year" className="bg-cinema-900 text-white">Release Year (Newest)</option>
              <option value="title" className="bg-cinema-900 text-white">Title (A-Z)</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-cinema-850 p-1 rounded-xl border border-cinema-700/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-cinema-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-cinema-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Genre Pills Row */}
      <div className="mb-6">
        <GenreFilter
          genres={allGenres}
          selectedGenre={selectedGenre}
          onSelectGenre={handleGenreChange}
        />
      </div>

      {/* Active Filter Pills Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-cinema-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredMovies.length}</strong> {filteredMovies.length === 1 ? 'movie' : 'movies'}
          </span>
          {hasMoreMovies && (
            <span className="text-slate-500">• Viewing first {displayedMovies.length}</span>
          )}
          {hasActiveFilters && (
            <span className="text-slate-500">• Filters active</span>
          )}
          {isSearchingTMDB && (
            <span className="inline-flex items-center gap-1.5 text-cinema-cyan font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Fetching live from TMDB...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {searchQuery.trim().length >= 2 && (
            <button
              onClick={() => triggerLiveTMDBSearch(searchQuery)}
              disabled={isSearchingTMDB}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cinema-800 hover:bg-cinema-750 text-cinema-cyan border border-cinema-700 transition-colors disabled:opacity-50"
            >
              <Globe className="w-3 h-3" />
              <span>Fetch More from TMDB</span>
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cinema-800 hover:bg-cinema-750 text-slate-300 hover:text-white border border-cinema-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Movie Results Grid or List */}
      <MovieGrid
        movies={displayedMovies}
        viewMode={viewMode}
        emptyMessage={`No movies found matching "${searchQuery}" or the selected filters. Try broadening your criteria.`}
      />

      {hasMoreMovies && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="px-6 py-3 rounded-xl bg-cinema-800 hover:bg-cinema-750 text-white font-semibold text-sm border border-cinema-700 hover:border-cinema-accent/60 shadow-lg transition-all"
          >
            Load More Movies ({filteredMovies.length - displayedMovies.length} remaining)
          </button>
          <span className="text-xs text-slate-500">
            Displaying {displayedMovies.length} of {filteredMovies.length} matching movies
          </span>
        </div>
      )}
    </div>
  );
};
