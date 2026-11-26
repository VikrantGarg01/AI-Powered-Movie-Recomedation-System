/**
 * CinePulse API Service Layer
 * Connects React UI to Node.js / Express REST API (Port 5001)
 * Includes Automatic Graceful Fallback to Local Dataset & Storage
 */

const API_BASE_URL = '/api';

// Helper to retrieve auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem('cinepulse_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // 1. Health check
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'fallback', service: 'Client-Side Engine' };
    }
  },

  // 2. Auth Endpoints
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Login failed');
        err.data = data;
        err.requireVerification = data.requireVerification;
        err.requireOtp = data.requireOtp;
        err.email = data.email;
        throw err;
      }
      if (data.token) {
        localStorage.setItem('cinepulse_token', data.token);
      }
      return data;
    } catch (networkOrApiErr) {
      throw networkOrApiErr;
    }
  },

  async register(name, email, password, favoriteGenres) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, favoriteGenres })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Registration failed');
      err.data = data;
      throw err;
    }
    if (data.token) {
      localStorage.setItem('cinepulse_token', data.token);
    }
    return data;
  },

  async verifyEmail(email, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Verification failed');
      err.data = data;
      throw err;
    }
    if (data.token) {
      localStorage.setItem('cinepulse_token', data.token);
    }
    return data;
  },

  async verifyLoginOtp(email, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Login verification failed');
      err.data = data;
      throw err;
    }
    if (data.token) {
      localStorage.setItem('cinepulse_token', data.token);
    }
    return data;
  },

  async resendOtp(email, type = 'register') {
    const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to resend code');
      err.data = data;
      throw err;
    }
    return data;
  },

  async getMe() {
    const token = localStorage.getItem('cinepulse_token');
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  },

  async updateProfile(updates) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Profile update failed');
    return data.user;
  },

  // 3. Movies Catalog Endpoints
  async getMovies({ genre, minRating, search, sort, page = 1, limit = 2500 } = {}) {
    const params = new URLSearchParams();
    if (genre && genre !== 'All') params.append('genre', genre);
    if (minRating) params.append('minRating', minRating);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    params.append('page', page);
    params.append('limit', limit);

    const res = await fetch(`${API_BASE_URL}/movies?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch movies');
    const data = await res.json();
    return data.data;
  },

  async getAllMovies({ pageSize = 2500 } = {}) {
    const firstRes = await fetch(`${API_BASE_URL}/movies?page=1&limit=${pageSize}`);
    if (!firstRes.ok) throw new Error('Failed to fetch movies');
    const firstPayload = await firstRes.json();
    const collected = Array.isArray(firstPayload.data) ? [...firstPayload.data] : [];
    const total = Number(firstPayload.total) || collected.length;

    let currentPage = 2;
    while (collected.length < total) {
      const res = await fetch(`${API_BASE_URL}/movies?page=${currentPage}&limit=${pageSize}`);
      if (!res.ok) break;
      const payload = await res.json();
      if (!Array.isArray(payload.data) || payload.data.length === 0) break;
      collected.push(...payload.data);
      currentPage += 1;
    }
    return collected;
  },

  async getMovieById(id) {
    const res = await fetch(`${API_BASE_URL}/movies/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch movie ${id}`);
    return await res.json();
  },

  async syncTMDB() {
    const res = await fetch(`${API_BASE_URL}/movies/sync-tmdb`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to sync TMDB movies');
    return await res.json();
  },

  async searchLiveTMDB(query) {
    const res = await fetch(`${API_BASE_URL}/movies/search/live?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Live search failed');
    return await res.json();
  },

  // 4. High-Accuracy Personalized Recommendations (KNN)
  async getRecommendations({ favoriteGenres, watchedMovieIds, userRatings, algorithmMode, k = 10, metric = 'cosine' }) {
    const res = await fetch(`${API_BASE_URL}/recommendations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        favoriteGenres,
        watchedMovieIds,
        userRatings,
        algorithmMode,
        k,
        metric
      })
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    const data = await res.json();
    return data.data;
  },

  async getSimilarMovies(movieId, k = 6) {
    const res = await fetch(`${API_BASE_URL}/recommendations/similar/${movieId}?k=${k}`);
    if (!res.ok) throw new Error('Failed to fetch similar movies');
    const data = await res.json();
    return data.data;
  },

  // 5. Watchlist & Rating Endpoints
  async getWatchlist() {
    const res = await fetch(`${API_BASE_URL}/watchlist`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  },

  async toggleWatchlist(movieId) {
    const res = await fetch(`${API_BASE_URL}/watchlist/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ movieId })
    });
    return await res.json();
  },

  async toggleWatched(movieId) {
    const res = await fetch(`${API_BASE_URL}/watchlist/watched`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ movieId })
    });
    return await res.json();
  },

  async submitRating(movieId, rating) {
    const res = await fetch(`${API_BASE_URL}/watchlist/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ movieId, rating })
    });
    return await res.json();
  },

  // 6. Multer Avatar Upload
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('cinepulse_token');
    const res = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.avatarUrl;
  }
};
