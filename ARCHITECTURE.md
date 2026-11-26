# CinePulse — System Architecture Documentation

**Status:** Confirmed Architecture & Specifications  
**Last Updated:** 2026-11-23

---

## 1. Overall System Architecture

CinePulse is built using a decoupled, multi-tier full-stack architecture that combines a modern React client, a high-throughput Node.js/Express REST API backend, a persistent MongoDB database layer, and a dedicated Content-Based Machine Learning Recommendation Engine.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENT TIER (React 18 + Vite)                         │
│  • Cinema Design System (Tailwind CSS 3)  • Context State Persistence       │
│  • Client-Side Vector KNN Fallback Engine • Modular View & Modal Components │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / JSON (Bearer JWT)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY & BACKEND TIER (Express.js)                  │
│  • Node.js v24 (ES Modules)               • JWT Authentication & Bcrypt     │
│  • Winston Structured Logging & Morgan    • Rate Limiting & Helmet Security │
│  • Multer Multipart Media File Upload     • Centralized Error Middleware    │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     DATABASE TIER (MongoDB v9)       │  │    MACHINE LEARNING ENGINE (KNN)  │
│ • Mongoose 8.x ODM                   │  │ • Multi-attribute TF-IDF Soup     │
│ • Compound & Full-Text Text Indexes  │  │ • L2-Normalized Cosine Metric     │
│ • User, Movie, Rating, Watchlist     │  │ • Bayesian Rating Prior Smoothing │
│ • Aggregation Pipelines & Pre-hooks  │  │ • Scikit-Learn Python Pipeline    │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 2. Frontend Architecture
* **Framework:** React 18 with Vite 6 build system.
* **Styling:** Tailwind CSS 3 configured with custom `cinema-*` tokens (slate, obsidian, crimson accents).
* **Routing:** `react-router-dom` v6 for client-side routing (`/`, `/discover`, `/movie/:id`, `/watchlist`, `/profile`, `/login`).
* **State Management:** React Context API:
  * `AuthContext.jsx`: User identity, JWT bearer token lifecycle, login/register/OTP verification, profile avatar state.
  * `MovieContext.jsx`: Movie catalog cache, dynamic watchlist/rating synchronization, search filtering.
  * `ToastContext.jsx`: Notification delivery for user feedback.
* **Resilience Layer:**
  * `ErrorBoundary.jsx`: Catches client exceptions, preventing white-screen crashes.
  * `safeParseArray` / `safeParseObject` helpers for zero-crash localStorage parsing.
  * Client-side fallback vector KNN engine (`recommendationEngine.js`) ensuring seamless operation even if backend connectivity drops.

---

## 3. Backend Architecture
* **Runtime:** Node.js v24 (Native ES Modules).
* **Framework:** Express.js 4 REST API.
* **Logging:** Structured Winston logger with Morgan HTTP request interception.
* **Security Middleware:**
  * `helmet`: HTTP header hardening.
  * `cors`: Cross-Origin Resource Sharing with whitelisted origins.
  * `express-rate-limit`: Global API rate limiting (IP-based brute-force and DDoS prevention).
* **Error Handling:** Centralized `notFound` (404) and `errorHandler` (500) middleware with sanitized production traces.
* **File Uploads:** Multer with storage validation (`server/uploads/`) for user profile avatars.

---

## 4. Database Design & Schemas
* **Database Engine:** MongoDB v9 with Mongoose 8.x ODM.
* **Collections & Schemas:**
  1. `User`: `name`, `email` (unique, lowercase), `password` (bcrypt hashed), `role` (`user` | `admin`), `avatar`, `favoriteGenres`, `isEmailVerified`, `otpCode`, `otpExpiresAt`.
  2. `Movie`: `tmdbId` (unique), `title`, `overview`, `genres`, `releaseDate`, `voteAverage`, `voteCount`, `posterPath`, `backdropPath`, `director`, `cast`, `keywords`, `trailerUrl`, `runtime`. Compound text index with `{ default_language: 'none', language_override: 'none' }`.
  3. `Rating`: `userId` (ref: User), `movieId` (ref: Movie), `rating` (1–5 scale). Unique compound index on `{ userId: 1, movieId: 1 }`.
  4. `Watchlist`: `userId` (ref: User), `movieId` (ref: Movie), `addedAt`. Unique compound index on `{ userId: 1, movieId: 1 }`.

---

## 5. Machine Learning & Recommendation Engine Architecture
* **Algorithm:** K-Nearest Neighbors (KNN) with $L_2$-Normalized Cosine Distance.
* **Feature Representation:**
  * Multi-attribute metadata soup: Plot overview + Genres (weighted 3x) + Keywords + Director + Top Cast.
  * TF-IDF (Term Frequency-Inverse Document Frequency) sparse vector embeddings (500 features).
* **Metric:** Cosine Distance: $D_{\text{cos}}(\mathbf{u}, \mathbf{v}) = 1 - \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$.
* **Dynamic Personalization:** Centered user rating vectors ($R_m - 2.5$) dynamically bias neighbor ranking.
* **Bayesian Rating Smoothing:** IMDb formula $S = \frac{v}{v+m} R + \frac{m}{v+m} C$ to mitigate small-sample rating bias.
* **Academic Python Pipeline (`ml_pipeline/`):** Scikit-learn KNN, K-Means clustering with Silhouette Score, 2D PCA projection, and Ridge Regression ($RMSE = 0.6789$).

---

## 6. API Design & Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and KNN model state | Public |
| `POST` | `/api/auth/register` | User registration (sends 6-digit OTP) | Public |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit email OTP and activate account | Public |
| `POST` | `/api/auth/resend-otp` | Resend verification OTP code | Public |
| `POST` | `/api/auth/login` | Authenticate user and issue signed JWT | Public |
| `GET` | `/api/auth/profile` | Retrieve authenticated user profile | Private (Bearer JWT) |
| `PUT` | `/api/auth/profile` | Update profile information and genre preferences | Private (Bearer JWT) |
| `GET` | `/api/movies` | Paginated movie catalog with genre & text query | Public |
| `GET` | `/api/movies/:id` | Detailed movie information with fallback to TMDB | Public |
| `GET` | `/api/recommendations` | User personalized KNN recommendations | Private (Bearer JWT) |
| `GET` | `/api/recommendations/:id` | Item-based KNN nearest neighbors for a movie | Public |
| `GET` | `/api/watchlist` | Get user watchlist items | Private (Bearer JWT) |
| `POST` | `/api/watchlist` | Add movie to watchlist | Private (Bearer JWT) |
| `DELETE` | `/api/watchlist/:movieId` | Remove movie from watchlist | Private (Bearer JWT) |
| `POST` | `/api/upload/avatar` | Upload user profile avatar image (Multer) | Private (Bearer JWT) |

---

## 7. Authentication & Authorization Flow
1. **Registration:** User inputs credentials $\rightarrow$ Password hashed via Bcrypt (salt round 10) $\rightarrow$ 6-digit numeric OTP generated $\rightarrow$ Dispatched via Nodemailer Gmail SMTP $\rightarrow$ Account set to unverified until OTP confirmed.
2. **OTP Verification:** User inputs OTP within 10-minute expiry window $\rightarrow$ Account verified $\rightarrow$ JWT issued.
3. **Login:** Authenticates with bcrypt $\rightarrow$ Issues signed HMAC-SHA256 JWT token with 7-day expiration.
4. **Token Verification:** `authMiddleware.js` verifies `Authorization: Bearer <token>`, decodes payload, and attaches `req.user`.
5. **Role-Based Access Control (RBAC):** `admin` check for privileged administrative routes.

---

## 8. Third-Party & External Integrations
* **The Movie Database (TMDB) API:** On-demand fetching and synchronization of movie metadata, cast, crew, and high-resolution posters.
* **Nodemailer / Gmail SMTP:** Transactional emails for email verification and OTP security.
* **YouTube Embeds:** Trailer streaming through standard privacy-enhanced embeds.

---

## 9. Security Considerations
* No credentials or secrets committed to repository; managed via `.env`.
* Bcrypt hashing with automated salt generation.
* Rate limiting prevents credential brute-forcing.
* Strict CORS configuration.
* Helmet HTTP protection headers enabled.
* Input validation on all authentication and mutation endpoints.

---

## 10. Deployment & Infrastructure
* **Containerization:** Multi-service `docker-compose.yml` defining Node API backend and MongoDB persistence service.
* **Local Development:** `start.sh` orchestrates MongoDB service checks, Node backend on port `5001`, and Vite React frontend on port `5173`.
