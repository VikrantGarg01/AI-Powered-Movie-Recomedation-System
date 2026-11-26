# 🎬 Movie+ — AI-Powered Movie Recommendation Platform

<div align="center">

![Movie+ Banner](https://img.shields.io/badge/Movie+-Streaming_%26_Discovery-e50914?style=for-the-badge&logo=film&logoColor=white)

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit_Learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-38%20Passing-brightgreen?style=flat-square&logo=vitest&logoColor=white)](#-testing--verification)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**Movie+** is a full-stack movie discovery and recommendation app built with **React**, **Node.js / Express**, **MongoDB**, and a **K-Nearest Neighbors (KNN)** recommendation engine.  
It ships with **1,095+ movies** across Global and Indian cinema, live **TMDB search**, **case-insensitive actor/title ranking**, **YouTube trailers**, and **real-time personalized picks**.

[How It Works](#-how-it-works-for-new-users) • [Quick Start](#-quick-start-guide) • [Catalog & TMDB Sync](#-movie-catalog--tmdb-sync) • [Architecture](#-architecture--project-layout) • [API Reference](#-rest-api-endpoints) • [Troubleshooting](#-troubleshooting)

</div>

---

## 👋 What Movie+ Does

If you are opening the project for the first time, here is what each part of the app gives you:

- **Explore 1,095+ Movies Offline or Online**: Browse Global blockbusters, Top Rated classics, Now Playing releases, and Indian Cinema (Hindi, Telugu, Tamil, Malayalam, Kannada) right away—even without an internet connection, thanks to synced local fallbacks.
- **Find Any Movie via Live TMDB Search**: Searching in **Discover** (`/discover`) or **Global Search** (`Ctrl+K` / `Cmd+K`) automatically queries TMDB's live catalog when local results are sparse and saves newly found titles into MongoDB.
- **Smart Case-Insensitive & Actor-Alias Search**: Typing `ramayana`, `RAMAYANA`, or `Ramayana` produces identical top-ranked title matches. Searching nicknames like `srk`, `sharu khan`, `aamir`, `prabhas`, or `nolan` resolves directly to the corresponding actor or director.
- **Recommendations That Adapt to You**:
  - **New Users (0 watched movies)**: Receive randomized discovery picks across the catalog instead of stale hardcoded suggestions.
  - **After Watching 1+ Movies**: The KNN engine compares TF-IDF vectors (genres, plot, keywords, director, and lead cast) and immediately ranks similar films with match percentages and plain-English reasons.
- **Clean Watchlist vs. Watched History**: Bookmarking adds a movie to your **Watchlist**. Marking a movie as **Watched** or rating it (1–5 stars) trains your recommendations without cluttering your Watchlist.
- **Accounts, Email OTP & Custom Avatars**: Register with email OTP verification (via Gmail SMTP), sign in with JWT sessions, and upload a custom profile image from your device.

---

## 🧭 How It Works (User Walkthrough)

1. **Open the App (`http://localhost:5173`)**: Browse carousels for *Recommended For You*, *Trending*, *Indian Cinema & Blockbusters*, *Popular Worldwide*, *Top Rated*, and *Recently Released*.
2. **Search Everything (`Cmd+K` / `Ctrl+K` or `/discover`)**:
   - Filter by genre (`All` is always first), minimum rating (`7.5+`, `8.0+`, `8.5+`), or sort order.
   - Discover displays `48` movies per batch with a **Load More Movies** button so browsing 1,000+ titles stays fast.
   - Need a title not in the local 1,095-movie library? Click **Fetch More from TMDB** or wait half a second while typing to pull live results from TMDB.
3. **Inspect Any Movie (`/movie/:id`)**: Watch the embedded YouTube trailer, read cast details, click any actor card to view their films, or jump straight to a TMDB movie ID in the URL (fetched on demand if not yet cached).
4. **Personalize Your Feed (`/recommendations`)**: Toggle favorite genres, mark films watched, or rate movies to see your match scores update live, including an **Actor Spotlight** row featuring more films starring the lead cast of your last watched movie.

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** `v18+` (tested with Node.js v24)
- **MongoDB** running locally on port `27017` *(optional—if MongoDB is stopped, the app falls back to local JSON data automatically)*
- **Python 3.10+** *(optional—only needed if you want to run the standalone ML training script or Jupyter notebook in `ml_pipeline/`)*

### Option 1: One-Command Launch (macOS / Linux)

```bash
./start.sh
```

*(Or run `npm start` from the project root.)*

This script checks MongoDB, installs missing dependencies, starts the Express API on `http://localhost:5001`, starts the Vite UI on `http://localhost:5173`, and opens your browser. Press `Ctrl + C` to stop both servers cleanly.

---

### Option 2: Manual Setup (Step-by-Step)

#### 1. Configure Environment Variables

Copy the example environment file in `server/` and add your keys:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/cinepulse_db
JWT_SECRET=replace_with_a_strong_random_secret
CLIENT_URL=http://localhost:5173
TMDB_API_KEY=your_tmdb_v3_api_key
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
```

> **Optional Email OTP Variables**: To send live registration/login verification emails via Gmail, also configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` (Gmail App Password) in `server/.env`.

#### 2. Install Dependencies & Seed the Database

```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
cd server && npm install

# (Optional) Seed MongoDB with moviesSeed.json, demo users, and sample ratings
npm run seed
```

#### 3. Start Backend and Frontend

In terminal 1 (Backend on port `5001`):

```bash
cd server
npm start
```

In terminal 2 (Frontend on port `5173`):

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

---

### Option 3: Docker Compose

Run MongoDB, the Express backend, and the frontend together in containers:

```bash
docker-compose up --build
```

---

## 🎞️ Movie Catalog & TMDB Sync

The project stores synced movie metadata in four places so both the database and offline/client fallback engines stay in sync:

- **MongoDB**: `cinepulse_db.movies`
- **Backend seed**: `server/data/moviesSeed.json`
- **Frontend bundle fallback**: `src/data/moviesData.js`
- **ML dataset**: `ml_pipeline/data/movies_dataset.json`

To refresh or expand the catalog directly from TMDB (requires `TMDB_API_KEY` in `server/.env`):

```bash
cd server
node scripts/syncTMDBStatic.js
```

> **Network Note**: The TMDB service (`server/services/tmdbService.js`) uses `https://api.tmdb.org/3` as its primary host with automatic fallback to `https://api.themoviedb.org/3`, so catalog sync and live search still work on ISPs that block `api.themoviedb.org`.

---

## 🏗️ Architecture & Project Layout

```text
Frontend (React 18 + Vite 6 + Tailwind CSS — Port 5173)
  ├── Proxies /api and /uploads to :5001
  ├── Client-side KNN fallback (src/utils/recommendationEngine.js)
  └── Case-insensitive ranked search (src/utils/searchHelper.js)
           │
           ▼  REST / JSON + Bearer JWT
Backend (Node.js + Express 4 — Port 5001)
  ├── Auth & OTP verification (JWT, Bcrypt, Nodemailer)
  ├── Catalog, live TMDB search & bulk sync (tmdbService.js)
  ├── In-memory TF-IDF KNN recommender (knnRecommender.js)
  └── Security & logs (Helmet, Rate Limit, Multer, Winston)
           │
           ▼
Database (MongoDB — Port 27017) + Offline ML Pipeline (ml_pipeline/)
```

### Directory Structure

```text
Movie Recommended System/
├── src/
│   ├── components/          # BrandLogo, Navbar, HeroBanner, MovieCard, MovieCarousel, Modals
│   ├── context/             # AuthContext, MovieContext, ToastContext
│   ├── data/moviesData.js   # Local TMDB catalog fallback (1,095+ movies) & default profile
│   ├── pages/               # HomePage, DiscoverPage, MovieDetailsPage, RecommendationsPage, WatchlistPage, ProfilePage, LoginPage
│   ├── services/api.js      # Frontend HTTP client wrapping /api endpoints
│   └── utils/               # recommendationEngine.js, searchHelper.js
├── server/
│   ├── config/              # db.js, env.js, logger.js (Winston daily rotation + redaction)
│   ├── controllers/         # authController, movieController, recommendationController, watchlistController, uploadController
│   ├── data/moviesSeed.json # MongoDB seed dataset (1,095+ TMDB movies)
│   ├── middleware/          # authMiddleware, errorMiddleware, rateLimiter, uploadMiddleware
│   ├── models/              # User.js, Movie.js, Rating.js, Watchlist.js
│   ├── routes/              # authRoutes, movieRoutes, recommendationRoutes, watchlistRoutes, uploadRoutes
│   ├── scripts/             # syncTMDBStatic.js (bulk TMDB catalog sync)
│   ├── services/            # tmdbService.js
│   ├── tests/               # api.test.js (Supertest integration suite)
│   └── utils/               # emailService.js, knnRecommender.js, seeder.js
├── ml_pipeline/
│   ├── data/                # movies_dataset.json
│   ├── output/              # movie_features_knn.json
│   ├── train_recommender.py # Scikit-Learn TF-IDF, KNN, Ridge Regression & K-Means pipeline
│   └── movie_recommendation_knn.ipynb
├── tests/
│   ├── unit/                # recommender.test.js, sanitization.test.js, searchHelper.test.js, userAuth.test.js
│   └── e2e/                 # smoke.spec.js (Playwright browser tests)
├── docker-compose.yml
└── start.sh
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Server status and KNN engine training state |
| `POST` | `/api/auth/register` | Public | Register a new user and send email verification OTP |
| `POST` | `/api/auth/verify-email` | Public | Verify registration OTP and activate account |
| `POST` | `/api/auth/login` | Public | Authenticate user and trigger/issue JWT session |
| `POST` | `/api/auth/verify-login-otp` | Public | Verify login OTP and return JWT token |
| `POST` | `/api/auth/resend-otp` | Public | Resend verification OTP code |
| `GET` | `/api/auth/me` | Private | Fetch currently authenticated user |
| `PUT` | `/api/auth/profile` | Private | Update profile details and favorite genres |
| `GET` | `/api/movies` | Public | Query catalog (`genre`, `language`, `minRating`, `search`, `sort`, `page`, `limit` up to `5000`) |
| `GET` | `/api/movies/meta/genres` | Public | Unique catalog genres with `"All"` first |
| `GET` | `/api/movies/search/live` | Public | Live TMDB search (`?q=...`) that caches results to MongoDB |
| `GET` | `/api/movies/:id` | Public | Fetch movie details + similar movies (falls back to live TMDB by ID) |
| `POST` | `/api/movies/sync-tmdb` | Admin | Trigger full TMDB catalog sync (requires `admin` JWT) |
| `POST` | `/api/recommendations` | Public / Auth | Personalized KNN recommendations with match scores |
| `GET` | `/api/recommendations/similar/:id` | Public | Top-$K$ similar movies for a given movie ID |
| `GET` | `/api/watchlist` | Private | Retrieve user's watchlist, watched IDs, and ratings |
| `POST` | `/api/watchlist/toggle` | Private | Add or remove a movie from the Watchlist |
| `POST` | `/api/watchlist/watched` | Private | Toggle watched status for a movie |
| `POST` | `/api/watchlist/rate` | Private | Submit a 1–5 star rating |
| `POST` | `/api/upload/avatar` | Private | Upload a custom profile avatar image (`multipart/form-data`) |

---

## 🧠 Machine Learning Pipeline

Both the live Node.js engine (`server/utils/knnRecommender.js`, `src/utils/recommendationEngine.js`) and the Python offline pipeline (`ml_pipeline/train_recommender.py`) model movies as $L_2$-normalized TF-IDF vectors over plot descriptions, genres ($3\times$ weight), keywords ($2\times$ weight), director ($2\times$ weight), and lead cast.

- **Similarity Metric**: Cosine Distance:
  $$D_{\text{cos}}(\mathbf{u}, \mathbf{v}) = 1 - \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
- **Python Offline Evaluation** (`cd ml_pipeline && pip install -r requirements.txt && python train_recommender.py`):
  - Content-based KNN (`metric="cosine"`)
  - Ridge Regression rating prediction
  - K-Means clustering + 2D PCA projection
  - Interactive analysis in `ml_pipeline/movie_recommendation_knn.ipynb`

---

## 🧪 Testing & Verification

The project includes **38 automated tests** across unit, API integration, and browser E2E layers:

```bash
# Run all Vitest suites (21 unit tests + 12 API integration tests = 33 tests)
npm test

# Run backend Supertest suite directly
npm run test:api

# Run Playwright Chromium E2E tests (5 browser tests)
npm run test:e2e

# Verify Vite production bundle
npm run build
```

---

## 🛠️ Troubleshooting

- **Only seeing older data after updating the catalog**: Restart the backend and refresh the browser tab so `MovieContext` fetches the updated `/api/movies` response instead of an older running process.
- **MongoDB is not running**: Start MongoDB (`brew services start mongodb-community` on macOS or `sudo systemctl start mongod` on Linux), or let the server fall back automatically to `server/data/moviesSeed.json` and `src/data/moviesData.js`.
- **TMDB requests fail or time out**: Confirm `TMDB_API_KEY` is set in `server/.env`. The client automatically falls back between `api.tmdb.org` and `api.themoviedb.org` if one host is blocked by your network.
- **Ports `5001` or `5173` already in use**: `./start.sh` clears stale processes on both ports automatically, or stop them manually with `lsof -ti :5001,5173 | xargs kill -9`.

---

## 📄 License & Attribution

- Movie metadata, posters, backdrops, and cast profiles are sourced from **The Movie Database (TMDB)**.
- Trailers are played via the **YouTube Embed API**.
- Licensed under the [MIT License](LICENSE).
