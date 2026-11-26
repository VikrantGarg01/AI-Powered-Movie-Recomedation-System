import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  Play, 
  Bookmark, 
  BookmarkCheck, 
  Eye, 
  EyeOff, 
  Share2, 
  Calendar, 
  Clock, 
  Film, 
  Users, 
  ArrowLeft,
  Check
} from 'lucide-react';
import { useMovies } from '../context/MovieContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { MoviePoster } from '../components/MoviePoster';
import { MovieCarousel } from '../components/MovieCarousel';
import { getSimilarMovies } from '../utils/recommendationEngine';

export const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { 
    movies, 
    mergeMovies,
    toggleWatchlist, 
    isInWatchlist, 
    toggleWatched, 
    isWatched, 
    rateMovie, 
    userRatings,
    openTrailer 
  } = useMovies();

  const [fetchedMovie, setFetchedMovie] = useState(null);
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);

  const localMovie = (movies || []).find((m) => String(m.id) === String(id) || String(m.tmdbId) === String(id));
  const movie = localMovie || fetchedMovie;

  // Scroll to top when movie changes and dynamically fetch from backend/TMDB if missing
  useEffect(() => {
    window.scrollTo(0, 0);
    setFetchedMovie(null);
    if (localMovie || !id) return;

    let isMounted = true;
    setIsLoadingMovie(true);
    api.getMovieById(id)
      .then((res) => {
        if (!isMounted) return;
        if (res?.data) {
          setFetchedMovie(res.data);
          mergeMovies([res.data, ...(res.similarMovies || [])]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingMovie(false);
      });

    return () => { isMounted = false; };
  }, [id, localMovie]);

  if (isLoadingMovie && !movie) {
    return (
      <div className="min-h-screen pt-36 pb-20 px-4 text-center">
        <Film className="w-12 h-12 mx-auto text-cinema-cyan animate-pulse mb-4" />
        <p className="text-slate-300 text-sm">Loading movie details from TMDB...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen pt-36 pb-20 px-4 text-center">
        <Film className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">
          The requested movie id "{id}" does not exist in our catalog.
        </p>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cinema-accent text-white font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(movie.id);
  const watchedStatus = isWatched(movie.id);
  const currentRating = userRatings[movie.id] || 0;

  // Calculate Similar Movies
  const similarMovies = getSimilarMovies(movie, movies, 8);

  // Share link handler
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Link for "${movie.title}" copied to clipboard!`, 'info');
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Top Large Cinematic Backdrop */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] lg:h-[72vh] overflow-hidden">
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.4] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-cinema-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-900 via-transparent to-transparent w-full" />

        {/* Back navigation pill */}
        <div className="absolute top-24 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Main Movie Content Overlay Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-48 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Left Column: Movie Poster & Quick Actions */}
          <div className="w-48 sm:w-64 lg:w-72 shrink-0 mx-auto md:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-cinema-700/80 aspect-[2/3] relative group">
              <MoviePoster
                src={movie.poster}
                alt={movie.title}
                title={movie.title}
                genres={movie.genres}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => openTrailer(movie)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cinema-accent text-white font-bold text-xs shadow-lg shadow-cinema-accent/40">
                  <Play className="w-4 h-4 fill-white" />
                  Play Trailer
                </div>
              </button>
            </div>

            {/* User Rating Widget Card */}
            <div className="mt-5 p-4 rounded-2xl bg-cinema-850/90 border border-cinema-750 backdrop-blur-md text-center">
              <p className="text-xs font-semibold text-slate-300 mb-2">
                Your Rating for this Film
              </p>
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => rateMovie(movie.id, star)}
                    className="p-1 hover:scale-125 transition-transform"
                    title={`Rate ${star} Stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= currentRating
                          ? 'text-cinema-gold fill-cinema-gold'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {currentRating > 0
                  ? `You rated this ${currentRating}/5 stars (Updated recommendation weights)`
                  : 'Click stars to rate and calibrate your AI recommendations'}
              </p>
            </div>
          </div>

          {/* Right Column: Metadata, Description & Cast */}
          <div className="flex-1 min-w-0 space-y-6 pt-2">
            {/* Title & Tagline */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-cinema-800 text-cinema-cyan border border-cinema-700">
                  {movie.genres[0]}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-cinema-750 text-slate-300 border border-cinema-700">
                  {movie.certification || 'PG-13'}
                </span>
                {watchedStatus && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Watched by You
                  </span>
                )}
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-sm sm:text-base italic text-slate-300 font-medium mt-1">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Ratings & Technical Specs Row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-3 px-4 rounded-2xl bg-cinema-850/80 border border-cinema-750/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-cinema-gold/15 border border-cinema-gold/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-cinema-gold fill-cinema-gold" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">
                    {movie.rating} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{movie.voteCount} reviews</div>
                </div>
              </div>

              <div className="h-8 w-px bg-cinema-700/60" />

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs font-bold text-white">{movie.year}</div>
                  <div className="text-[10px] text-slate-400">Release Year</div>
                </div>
              </div>

              <div className="h-8 w-px bg-cinema-700/60" />

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs font-bold text-white">{movie.runtime}</div>
                  <div className="text-[10px] text-slate-400">Duration</div>
                </div>
              </div>

              <div className="h-8 w-px bg-cinema-700/60" />

              <div>
                <div className="text-xs font-bold text-white truncate max-w-[150px]">{movie.director}</div>
                <div className="text-[10px] text-slate-400">Director</div>
              </div>
            </div>

            {/* Genre Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1 font-medium">Genres:</span>
              {movie.genres.map((g) => (
                <Link
                  key={g}
                  to={`/discover?genre=${g}`}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-cinema-800 hover:bg-cinema-750 border border-cinema-700 text-slate-300 hover:text-white transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => openTrailer(movie)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover text-white font-semibold text-sm shadow-lg shadow-cinema-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Watch Official Trailer
              </button>

              <button
                onClick={() => toggleWatchlist(movie.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm border backdrop-blur-md transition-all ${
                  isSaved
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-cinema-800 border-cinema-700 text-white hover:bg-cinema-750'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
                {isSaved ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              <button
                onClick={() => toggleWatched(movie.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border transition-all ${
                  watchedStatus
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-cinema-800 border-cinema-700 text-slate-300 hover:text-white hover:bg-cinema-750'
                }`}
                title={watchedStatus ? 'Mark as unwatched' : 'Mark as watched'}
              >
                {watchedStatus ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                <span>{watchedStatus ? 'Watched' : 'Mark Watched'}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-xl bg-cinema-800 hover:bg-cinema-750 border border-cinema-700 text-slate-300 hover:text-white transition-all"
                title="Share Movie Link"
                aria-label="Share movie link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Synopsis */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Storyline Overview
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Cast & Crew Section */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cinema-cyan" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Lead Cast & Characters
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {movie.cast.map((actor, idx) => (
                    <Link
                      key={idx}
                      to={`/discover?search=${encodeURIComponent(actor.name)}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-cinema-850/60 border border-cinema-750 hover:border-cinema-cyan/50 hover:bg-cinema-800/80 transition-all group"
                      title={`Find movies starring ${actor.name}`}
                    >
                      <img
                        src={actor.avatar}
                        alt={actor.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-cinema-700 group-hover:ring-cinema-cyan transition-all"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-cinema-cyan transition-colors truncate">
                          {actor.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{actor.role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Movies Section */}
      <div className="mt-16 border-t border-cinema-800/80 pt-8">
        <MovieCarousel
          title={`More Like "${movie.title}"`}
          subtitle="Content similarity based on matching genres, keywords, themes, and directorial tone"
          movies={similarMovies}
          badge="Related Titles"
          showMatchScore={true}
        />
      </div>
    </div>
  );
};
