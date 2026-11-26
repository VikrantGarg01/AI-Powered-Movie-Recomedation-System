# IMPLEMENTATION PROMPT: 07_PERFORMANCE_OPTIMIZATION

> **Priority:** RECOMMENDED (Event Loop Health & Concurrency)  
> **Order:** Step 7 in Remediation Sequence  
> **Dependencies:** `01_SECURITY_IMPLEMENTATION.md`  
> **Target Subsystem:** KNN Recommendation Engine, TMDB Service, HTTP Caching  

---

## 1. Project-Specific Context
CinePulse calculates recommendations by running matrix dot products across 58 movie feature vectors on the Node.js main event loop. It also fetches movie metadata from TMDB when movies are requested that do not yet exist in MongoDB, and serves static movie assets and poster thumbnails to the React client.

---

## 2. Exact Problems Identified During Audit
1. **Event Loop Latency on Recommendation Computing:**  
   `globalKNNRecommender.getPersonalizedRecommendations()` iterates through all unwatched movies in memory. While execution time is currently fast for 58 movies (< 5ms), the recommendation computation is re-executed on every HTTP POST `/api/recommendations` without in-memory caching for identical user preference payloads.
2. **Sequential TMDB Catalog Fetching in `server/services/tmdbService.js`:**  
   `syncCuratedCatalog()` iterates over an array of 40+ movie IDs sequentially (`for (const id of finalUniqueIds)` with sequential `await fetchTMDB`). This causes catalog synchronization to take over 25 seconds to complete.
3. **Missing HTTP Cache Headers on Static Endpoints:**  
   Responses from `GET /api/movies/meta/genres` and `GET /api/movies/:id` do not include `Cache-Control` headers (e.g. `public, max-age=3600`), forcing browsers to make redundant network round-trips for static data.

---

## 3. Why the Improvement is Necessary
- Reduces Node.js event-loop CPU load during concurrent user traffic spikes.
- Cuts catalog synchronization time from >25s down to <5s through controlled concurrency batches.
- Minimizes redundant API requests from the frontend client.

---

## 4. Affected Files and Components
- `server/utils/knnRecommender.js`
- `server/services/tmdbService.js`
- `server/controllers/movieController.js`
- `server/controllers/recommendationController.js`

---

## 5. Required Implementation Steps

### Step 5.1: Implement Recommendation Cache / Memoization
- Add a lightweight LRU or TTL cache (e.g. 5 minutes) keyed on `hash(favoriteGenres.sort(), watchedMovieIds.sort(), algorithmMode, k)`:
  ```javascript
  const recommendationCache = new Map();
  // Check cache before computing
  // Evict entries older than 300 seconds
  ```

### Step 5.2: Concurrency Batching in `server/services/tmdbService.js`
- Replace sequential `for ... of` with chunked parallel execution (concurrency limit = 5):
  ```javascript
  const pLimit = 5;
  // Process movie IDs in concurrent batches of 5 to prevent TMDB rate limiting while accelerating sync 5x
  ```

### Step 5.3: Add Static HTTP Cache Headers in `server/controllers/movieController.js`
- In `getGenres`:
  ```javascript
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  ```
- In `getMovieById`:
  ```javascript
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  ```

---

## 6. Security and Compatibility Considerations
- Ensure user-specific personalization (ratings, watched movies) is properly hashed into cache keys so one user does not receive another user's cached recommendation feed.
- Ensure TMDB concurrency does not exceed TMDB API rate limit (40 requests per 10 seconds).

---

## 7. Expected Behavior After Implementation
- Repeated identical recommendation queries resolve in < 1ms from cache.
- Curated TMDB catalog sync completes in under 6 seconds.
- Browser caches genres and movie details without re-requesting on every page change.

---

## 8. Required Tests
1. Benchmark: Execute 100 concurrent requests to `/api/recommendations`; verify p95 latency < 50ms.
2. Verify `Cache-Control` header is present on `GET /api/movies/meta/genres`.
3. Verify recommendation cache invalidates properly when ratings or preferences change.

---

## 9. Verification Procedure
```bash
# Verify Cache-Control header
curl -I http://localhost:5001/api/movies/meta/genres
```

---

## 10. Acceptance Criteria
- [ ] Static endpoints include valid `Cache-Control` headers.
- [ ] TMDB sync utilizes concurrent chunking without rate-limit errors.
- [ ] Recommendation endpoint responds in < 50ms under concurrent requests.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` item PERF-01 to `Passed`.
- Update `MEMORY.md` with performance benchmarks.
