import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Bookmark, 
  CheckCircle2, 
  Star, 
  Edit3, 
  Film, 
  ShieldCheck, 
  Check, 
  Camera, 
  Upload, 
  Link as LinkIcon 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMovies } from '../context/MovieContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { MoviePoster } from '../components/MoviePoster';

export const ProfilePage = () => {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const { 
    watchlist, 
    watched, 
    userRatings, 
    movies, 
    allGenres, 
    toggleFavoriteGenre, 
    toggleWatched 
  } = useMovies();

  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Preset movie lover avatar options
  const avatarPresets = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80"
  ];

  // Direct file upload handler (Camera click or Drawer file picker)
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be under 5MB', 'error');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result;
      if (base64Url) {
        setSelectedAvatar(base64Url);
        updateProfile({ avatar: base64Url });
        showToast('Profile image updated successfully!', 'success');
      }

      try {
        const uploadRes = await api.uploadAvatar(file);
        if (uploadRes?.avatarUrl) {
          setSelectedAvatar(uploadRes.avatarUrl);
          updateProfile({ avatar: uploadRes.avatarUrl });
        }
      } catch {
        // Base64 already saved in user profile
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      bio,
      avatar: selectedAvatar
    });
    setIsEditing(false);
  };

  // Watched movies mapped with user rating
  const watchedMoviesList = (watched || [])
    .map((id) => (movies || []).find((m) => String(m.id) === String(id) || String(m.tmdbId) === String(id)))
    .filter(Boolean);

  // Watchlist movies mapped with movie details
  const watchlistMoviesList = (watchlist || [])
    .map((id) => (movies || []).find((m) => String(m.id) === String(id) || String(m.tmdbId) === String(id)))
    .filter(Boolean);

  const favoriteGenres = Array.isArray(user?.favoriteGenres) ? user.favoriteGenres : [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-36 pb-20 px-4 max-w-md mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cinema-800/80 border border-cinema-700 flex items-center justify-center mx-auto text-cinema-accent shadow-xl">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Sign In Required</h2>
        <p className="text-slate-400 text-sm">
          Please sign in to access your profile, customize genre preferences, and manage your watchlist and history.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-bold shadow-md shadow-cinema-accent/30 transition-all"
        >
          Sign In to Movie+
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Profile Header Glass Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cinema-750 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Camera upload button */}
          <div className="relative group shrink-0">
            <img
              src={user?.avatar || avatarPresets[0]}
              alt={user?.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-cinema-accent/40 shadow-xl"
            />
            {/* Interactive Camera Hover Overlay */}
            <label
              htmlFor="main-avatar-upload"
              className="absolute inset-0 rounded-2xl bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer backdrop-blur-xs text-white"
              title="Click to add or change your photo"
            >
              <Camera className="w-6 h-6 text-white mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                {isUploading ? 'Uploading...' : 'Add Photo'}
              </span>
            </label>
            <input
              id="main-avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileUpload}
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-cinema-800 border border-cinema-700 text-cinema-cyan">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Profile text */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                {user?.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cinema-800 text-cinema-cyan border border-cinema-700">
                Verified Cinephile
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.email}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Check className="w-2.5 h-2.5" /> Email Verified
              </span>
              <span className="text-slate-600">•</span>
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Member: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : (user?.memberSince || 'Active Member')}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed pt-1">
              {user?.bio || "Film enthusiast exploring AI recommendation algorithms and modern cinema discovery."}
            </p>
          </div>

          {/* Edit button */}
          <div className="shrink-0 flex sm:flex-col gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-750 border border-cinema-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Edit Modal / Form Drawer */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-8 pt-6 border-t border-cinema-750 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Edit Profile Details
            </h3>

            {/* Avatar & Profile Image Customizer */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-400">
                  Profile Photo & Avatar
                </label>
                <label
                  htmlFor="drawer-avatar-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinema-800 hover:bg-cinema-750 border border-cinema-700 text-cinema-cyan text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Upload from Device'}</span>
                </label>
                <input
                  id="drawer-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileUpload}
                />
              </div>

              {/* Custom Image URL input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="Or enter image URL (https://...)"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      if (e.target.value) {
                        setSelectedAvatar(e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-cinema-900 border border-cinema-750 text-white text-xs focus:outline-none focus:border-cinema-accent placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Preset Personas */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-1.5">Or choose a curated persona:</span>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset);
                        setCustomAvatarUrl('');
                      }}
                      className={`w-12 h-12 rounded-xl overflow-hidden ring-2 shrink-0 transition-all ${
                        selectedAvatar === preset
                          ? 'ring-cinema-accent scale-105'
                          : 'ring-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-cinema-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-cinema-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Bio / Cinema Philosophy
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-cinema-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-bold shadow-md shadow-cinema-accent/30"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-cinema-800 text-center sm:text-left">
          <div className="p-3.5 rounded-2xl bg-cinema-900/60 border border-cinema-800">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">In Watchlist</p>
            <p className="text-xl font-black text-white mt-0.5">{(watchlist || []).length} Movies</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cinema-900/60 border border-cinema-800">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Watched Films</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{(watched || []).length} Movies</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cinema-900/60 border border-cinema-800">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">User Ratings</p>
            <p className="text-xl font-black text-cinema-gold mt-0.5">
              {Object.keys(userRatings).length} Given
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cinema-900/60 border border-cinema-800">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Affinity Genres</p>
            <p className="text-xl font-black text-cinema-cyan mt-0.5">
              {favoriteGenres.length} Active
            </p>
          </div>
        </div>
      </div>

      {/* Favorite Genres Manager */}
      <section className="glass-panel p-6 sm:p-7 rounded-3xl border border-cinema-750 space-y-4">
        <div>
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-cinema-accent" />
            Favorite Genre Preferences
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click any genre to toggle it on or off. Customize your preferred genres to personalize your movie discovery experience.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {allGenres.filter((g) => g !== 'All').map((genre) => {
            const isFav = favoriteGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleFavoriteGenre(genre)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isFav
                    ? 'bg-cinema-accent text-white shadow-md shadow-cinema-accent/30 scale-105'
                    : 'bg-cinema-850 hover:bg-cinema-800 text-slate-400 hover:text-white border border-cinema-750'
                }`}
              >
                <span>{genre}</span>
                {isFav && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Watched Movies History Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              Watched Movies History ({watchedMoviesList.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Movies you have completed. These serve as content-similarity anchors for "Because You Watched" models.
            </p>
          </div>
        </div>

        {watchedMoviesList.length === 0 ? (
          <div className="p-8 text-center bg-cinema-850 rounded-2xl border border-cinema-750">
            <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-white text-sm font-semibold">No watched movies recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Mark movies as watched from the Discover or Movie Details page!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {watchedMoviesList.map((movie) => {
              const rating = userRatings[movie.id];
              return (
                <div
                  key={movie.id}
                  className="p-3 rounded-2xl bg-cinema-850 border border-cinema-750 flex gap-3 items-center group relative"
                >
                  <Link
                    to={`/movie/${movie.id}`}
                    className="w-16 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-md"
                  >
                    <MoviePoster
                      src={movie.poster}
                      alt={movie.title}
                      title={movie.title}
                      genres={movie.genres}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/movie/${movie.id}`}
                      className="font-bold text-white text-xs hover:text-cinema-cyan transition-colors truncate block"
                      title={movie.title}
                    >
                      {movie.title}
                    </Link>
                    <p className="text-[10px] text-slate-400 mt-0.5">{movie.year} • {movie.genres[0]}</p>

                    <div className="flex items-center gap-1 text-xs text-cinema-gold font-bold mt-1.5">
                      <Star className="w-3 h-3 fill-cinema-gold" />
                      <span>{rating ? `${rating}★ by You` : `${movie.rating} (IMDb)`}</span>
                    </div>

                    <button
                      onClick={() => toggleWatched(movie.id)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 mt-2 block"
                    >
                      Unmark Watched
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Watchlist Queue Section */}
      {watchlistMoviesList.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-cinema-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-cinema-accent" />
                My Watchlist Queue ({watchlistMoviesList.length})
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Movies you have saved to watch later
              </p>
            </div>
            <Link
              to="/watchlist"
              className="text-xs font-semibold text-cinema-cyan hover:underline"
            >
              View Full Watchlist →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {watchlistMoviesList.map((movie) => (
              <div
                key={movie.id}
                className="p-3 rounded-2xl bg-cinema-850 border border-cinema-750 flex gap-3 items-center group relative"
              >
                <Link
                  to={`/movie/${movie.id}`}
                  className="w-16 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-md"
                >
                  <MoviePoster
                    src={movie.poster}
                    alt={movie.title}
                    title={movie.title}
                    genres={movie.genres}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/movie/${movie.id}`}
                    className="font-bold text-white text-xs hover:text-cinema-cyan transition-colors truncate block"
                    title={movie.title}
                  >
                    {movie.title}
                  </Link>
                  <p className="text-[10px] text-slate-400 mt-0.5">{movie.year} • {movie.genres[0]}</p>

                  <div className="flex items-center gap-1 text-xs text-cinema-gold font-bold mt-1.5">
                    <Star className="w-3 h-3 fill-cinema-gold" />
                    <span>{movie.rating} (IMDb)</span>
                  </div>

                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold bg-cinema-accent/20 text-cinema-accent border border-cinema-accent/30 mt-2">
                    In Watchlist
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
