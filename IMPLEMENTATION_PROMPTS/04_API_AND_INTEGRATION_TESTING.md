# IMPLEMENTATION PROMPT: 04_API_AND_INTEGRATION_TESTING

> **Priority:** MANDATORY (API Contract & Endpoint Verification)  
> **Order:** Step 4 in Remediation Sequence  
> **Dependencies:** `01_SECURITY_IMPLEMENTATION.md`, `02_DATABASE_IMPROVEMENTS.md`  
> **Target Subsystem:** Express Routes, Controllers, Middleware, MongoDB Integration  

---

## 1. Project-Specific Context
CinePulse exposes RESTful endpoints under `/api`:
- Authentication: `/api/auth/register`, `/api/auth/login`, `/api/auth/verify-email`, `/api/auth/resend-otp`, `/api/auth/me`, `/api/auth/profile`
- Movies: `/api/movies`, `/api/movies/:id`, `/api/movies/meta/genres`, `/api/movies/sync-tmdb`, `/api/movies/search/live`
- Recommendations: `/api/recommendations`, `/api/recommendations/similar/:id`
- Watchlist: `/api/watchlist`, `/api/watchlist/toggle`, `/api/watchlist/watched`, `/api/watchlist/rate`
- Uploads: `/api/upload/avatar`
- System: `/api/health`

---

## 2. Exact Problems Identified During Audit
1. **Zero Automated API Contract Testing:**  
   Currently, testing relies entirely on manual curl requests or manual Postman execution.
2. **Untested HTTP Error Codes:**  
   No automated tests assert that protected routes return HTTP 401 when tokens are missing or expired.
3. **Untested Role-Based Access Control:**  
   No automated tests assert that non-admin tokens receive HTTP 403 on `/api/movies/sync-tmdb`.
4. **Untested Validation Errors:**  
   No automated tests assert that malformed requests return HTTP 400 with structured JSON error messages.

---

## 3. Why the Improvement is Necessary
- Ensures API changes do not break the frontend React client.
- Verifies that security middleware (`protect`, `authorize`, `authLimiter`) actively enforces access boundaries.
- Provides immediate regression alerts whenever a controller or route definition is modified.

---

## 4. Affected Files and Components
- `server/routes/*`
- `server/controllers/*`
- `server/server.js`
- `tests/api/*`

---

## 5. Required Implementation Steps

### Step 5.1: Install Supertest
```bash
cd server && npm install -D supertest
```

### Step 5.2: Create Test Suite in `server/tests/api.test.js`

#### 1. System Health Tests:
- `GET /api/health`:
  - Returns HTTP 200.
  - Returns `{ status: 'online', service: ... }`.
  - Asserts response does NOT contain `smtpUser` or any plain text email address.

#### 2. Authentication Endpoint Tests:
- `POST /api/auth/register`:
  - Returns HTTP 400 if `email`, `password`, or `name` is missing.
  - Returns HTTP 201 or 200 with `requireVerification: true` when valid.
- `POST /api/auth/verify-email`:
  - Returns HTTP 400 on invalid or expired OTP.
  - Returns HTTP 400 on `123456` when it is not the actual user OTP.
- `POST /api/auth/login`:
  - Returns HTTP 401 on incorrect password.
  - Returns HTTP 401 on non-existent email.
  - Returns HTTP 403 on unverified user account.
  - Returns HTTP 200 with JWT token for verified user with matching credentials.

#### 3. Protected Endpoint Authorization Tests:
- `GET /api/auth/me`:
  - Returns HTTP 401 when `Authorization` header is omitted.
  - Returns HTTP 401 when `Bearer invalid_token` is provided.
  - Returns HTTP 200 with user profile when valid JWT is supplied.
- `GET /api/watchlist`:
  - Returns HTTP 401 without Bearer token.
  - Returns HTTP 200 with user watchlist array when authorized.
- `POST /api/movies/sync-tmdb`:
  - Returns HTTP 401 without Bearer token.
  - Returns HTTP 403 when authenticated as standard `user` role.
  - Returns HTTP 200 when authenticated as `admin` role.
- `POST /api/upload/avatar`:
  - Returns HTTP 401 without Bearer token.

#### 4. Movie Catalog & Search Tests:
- `GET /api/movies`:
  - Returns HTTP 200 with `success: true`, `count`, and `data` array.
  - Supports `?genre=Action` filter.
  - Supports `?minRating=8` filter.
  - Safely handles ReDoS query `?search=(a+)+$` in < 50ms without error.
- `GET /api/movies/:id`:
  - Returns HTTP 200 and similar movies for valid ID (`155`).
  - Returns HTTP 404 for non-existent movie ID.

#### 5. Recommendations API Tests:
- `POST /api/recommendations`:
  - Returns HTTP 200 with array of Top-K recommendations.
  - Contains `matchPercentage` and `cosineSimilarity` properties on items.

---

## 6. Security and Compatibility Considerations
- Tests instantiate `app` from `server/server.js` (exported without starting listening socket).
- Tests run against in-memory mock or dedicated local test database to avoid mutating development data.

---

## 7. Expected Behavior After Implementation
- All API tests execute via `npm run test:api`.
- Status codes, response bodies, and security headers are validated automatically.
- Total test execution time is under 15 seconds.

---

## 8. Required Tests
1. Health check returns 200 and no secret leaks.
2. Registration validation rules enforced (HTTP 400).
3. Login requires valid password (HTTP 401 on wrong password).
4. Login blocks unverified user (HTTP 403).
5. Protected route blocks missing token (HTTP 401).
6. Admin route blocks non-admin token (HTTP 403).
7. Movie search handles ReDoS payload cleanly (HTTP 200).
8. Rating submission rejects `NaN` (HTTP 400).
9. Recommendation endpoint returns ranked candidates (HTTP 200).

---

## 9. Verification Procedure
```bash
# Run API test suite
npm run test:api
```

---

## 10. Acceptance Criteria
- [ ] All API test scenarios execute and pass with zero errors.
- [ ] Security boundaries (401, 403, 400, 429) verified via automated assertions.
- [ ] Test command integrated into package scripts.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` item TST-02 to `Passed`.
- Update `MEMORY.md` with API testing command and suite details.
