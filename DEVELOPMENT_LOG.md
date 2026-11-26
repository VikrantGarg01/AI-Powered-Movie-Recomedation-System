# Development Activity Log

All significant project changes, architectural decisions, and feature additions are recorded chronologically in this file.

---

## [2026-11-23] — Project Initialization & Durable Memory Setup
- **Task Performed:** Initialized Google Antigravity durable project memory and verification system.
- **Files Created / Modified:**
  - `PROJECT_SPEC.md`: Created to preserve the complete original user project prompt and upcoming requirements.
  - `ARCHITECTURE.md`: Created to document the system architecture, component boundaries, API schemas, and ML pipeline.
  - `DEVELOPMENT_LOG.md`: Created to maintain continuous chronological tracking of all development updates.
  - `TASK_TRACKER.md`: Created with structured development tasks, priorities, dependencies, and statuses.
  - `MEMORY.md`: Re-organized and expanded into the standardized 21-section structure, preserving all existing context.
- **Technical Decisions:**
  - Preserved full existing codebase intelligence without destructive modification.
  - Retained existing MongoDB schemas, Vite configuration, TMDB integration, and in-memory KNN recommender.
- **Verification:** Completed verification check across all 5 mandatory memory files.

---

## [2026-11-23] — UI Clean-Up & Production Resilience Polish
- **Task Performed:** Cleaned up UI components for evaluation, removed evaluation badges, fixed white-screen crashes.
- **Files Modified:**
  - `src/main.jsx`: Added React `<ErrorBoundary>` wrapper.
  - `index.html`: Added inline dark canvas styling (`#0b0c10`) on `body`.
  - `src/pages/LoginPage.jsx`: Cleared placeholder sample values from inputs.
  - `src/pages/WatchlistPage.jsx`: Removed evaluation demo CTAs.
  - `src/pages/ProfilePage.jsx`: Initialized empty arrays for favorite genres; cleaned evaluation headers.
  - `src/components/Navbar.jsx`: Removed pulsating recommendation indicators.
- **Problems Encountered:** Unchecked `localStorage` parsing caused null-reference TypeErrors during render.
- **Solutions Implemented:** Implemented defensive parsing utilities across contexts and views.

---

## [2026-11-21] — Full TMDB API Integration & Live Database Synchronization
- **Task Performed:** Replaced mock movie dataset with 58 authentic TMDB titles (Indian & Global cinema).
- **Files Modified:**
  - `server/services/tmdbService.js`: Added TMDB API client with retry and error handling.
  - `server/models/Movie.js`: Added unique `tmdbId` indexing and upsert logic.
  - `server/utils/seeder.js`: Automated seeding of verified movies.
  - `src/pages/HomePage.jsx`: Added "Indian Cinema & Blockbusters" carousel.

---

## [2026-11-14] — Core Full-Stack & Machine Learning Engine Implementation
- **Task Performed:** Built full-stack movie recommendation system aligned with university syllabus.
- **Files Created:**
  - `server/`: Node.js Express REST API, Mongoose models, JWT auth, Multer file upload, Winston logger.
  - `ml_pipeline/`: Python ML training suite with TF-IDF, KNN, Cosine Distance, K-Means, Ridge Regression, PCA.
  - `src/`: React 18, Vite 6, Tailwind CSS frontend application.
  - `techstack.md`, `question.md`, `README.md`: Academic viva preparation and architecture guides.
