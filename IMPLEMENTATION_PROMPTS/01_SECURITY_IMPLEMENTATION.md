# IMPLEMENTATION PROMPT: 01_SECURITY_IMPLEMENTATION

> **Priority:** MANDATORY (Critical Security Blocker)  
> **Order:** Step 1 in Remediation Sequence  
> **Dependencies:** None (Self-contained)  
> **Target Subsystem:** Authentication, API Endpoints, Secrets Management, File Uploads  

---

## 1. Project-Specific Context
CinePulse is a full-stack movie recommendation platform with a Node.js/Express backend (port 5001) and a React/Vite frontend (port 5173). The backend uses JSON Web Tokens (JWT), Bcrypt password hashing, Nodemailer for Gmail SMTP email verification with 6-digit OTP codes, and Multer for profile avatar uploads. The movie catalog connects to The Movie Database (TMDB) API for movie details and features an in-memory Content-Based KNN recommendation engine.

---

## 2. Exact Problems Identified During Audit
1. **Universal Backdoor OTP (`123456`) in `server/models/User.js` (lines 98-103):**  
   The `checkVerificationOtp` instance method contains a hardcoded bypass allowing any account verification to succeed if `123456` is submitted.
2. **Hardcoded Gmail App Password in `server/utils/emailService.js` (lines 9-10):**  
   A plain text Google App Password (`cmfg jazk innu ytmz`) is hardcoded as a fallback in the source file.
3. **Hardcoded TMDB API Key in `server/services/tmdbService.js` (lines 13-15):**  
   A plain text TMDB API key (`44cdd23d855d0dc44ed0c840c30f3b25`) is hardcoded as `DEFAULT_API_KEY`.
4. **Auto-Verification Bypass on Login in `server/controllers/authController.js` (lines 183-189):**  
   If an unverified user logs in with a password, the system automatically sets `user.isVerified = true` without requiring OTP validation.
5. **Client-Side Fake Token Issuance in `src/services/api.js` (lines 55-67):**  
   If backend communication fails, the frontend fabricates a `'local-demo-token'` and logs the user in based on unverified localStorage data.
6. **Unauthenticated Administrative Data Sync Endpoint in `server/routes/movieRoutes.js` (line 14):**  
   `POST /api/movies/sync-tmdb` has no authentication or authorization middleware, allowing anyone to trigger database mutations and disk writes.
7. **Unauthenticated File Upload Flooding in `server/routes/uploadRoutes.js` (line 8):**  
   `POST /api/upload/avatar` uses `optionalAuth`, allowing anonymous users to upload 5MB files repeatedly to `server/uploads/`.
8. **ReDoS Vulnerability in Movie Search in `server/controllers/movieController.js` (lines 55-60):**  
   `req.query.search` is injected directly into `$regex` without escaping regex meta-characters.
9. **Sensitive Email Leakage in Health Check in `server/server.js` (line 70):**  
   `GET /api/health` returns `smtpUser: process.env.SMTP_USER || 'adminrecallc@gmail.com'` to unauthenticated callers.

---

## 3. Why the Improvement is Necessary
These vulnerabilities expose CinePulse to:
- Arbitrary account takeover via universal backdoor OTP.
- Unauthorized email relaying and credential harvesting from source code.
- Remote denial of service via ReDoS and uncontrolled disk filling.
- Data tampering and catalog corruption via unauthenticated administrative endpoints.
- Insecure client session spoofing.

---

## 4. Affected Files and Components
- `server/models/User.js`
- `server/utils/emailService.js`
- `server/services/tmdbService.js`
- `server/controllers/authController.js`
- `src/services/api.js`
- `server/routes/movieRoutes.js`
- `server/routes/uploadRoutes.js`
- `server/controllers/movieController.js`
- `server/server.js`

---

## 5. Required Implementation Steps

### Step 5.1: Remove Universal Backdoor OTP in `server/models/User.js`
- Locate `UserSchema.methods.checkVerificationOtp`.
- Remove the `cleanEntered === '123456'` check completely.
- Ensure the method strictly verifies:
  1. `this.verificationOtp` and `this.verificationOtpExpires` exist.
  2. `new Date() <= this.verificationOtpExpires`.
  3. `this.verificationOtp.trim() === cleanEntered`.

### Step 5.2: Strip Hardcoded Credentials in `server/utils/emailService.js`
- Remove the hardcoded fallback password.
- Read credentials strictly from `process.env.SMTP_USER` and `process.env.SMTP_PASS`.
- If credentials are not set, throw a descriptive initialization warning and disable email dispatch gracefully without crashing the server.

### Step 5.3: Strip Hardcoded API Key in `server/services/tmdbService.js`
- Remove `const DEFAULT_API_KEY = '44cdd...'`.
- Read API key strictly from `process.env.TMDB_API_KEY`.
- If missing, log a structured warning and fall back to local seed data.

### Step 5.4: Enforce Email Verification on Login in `server/controllers/authController.js`
- In `login`, check `if (!user.isVerified)`.
- If unverified, generate a new OTP, dispatch the verification email, and respond with HTTP 403 Forbidden:
  ```json
  {
    "success": false,
    "requireVerification": true,
    "email": "user@example.com",
    "error": "Account not verified. A verification code has been sent to your email."
  }
  ```
- Do NOT automatically set `user.isVerified = true`.

### Step 5.5: Eliminate Client-Side Fake Auth Tokens in `src/services/api.js`
- In `api.login()`, remove the fallback block that returns `{ token: 'local-demo-token', user: parsed }`.
- Re-throw network and API errors cleanly so UI can display standard offline/connection error toasts.

### Step 5.6: Protect `/api/movies/sync-tmdb` Route in `server/routes/movieRoutes.js`
- Import `protect` and `authorize` from `../middleware/authMiddleware.js`.
- Mount route with protection:
  ```javascript
  router.post('/sync-tmdb', protect, authorize('admin'), syncTMDB);
  ```

### Step 5.7: Require Authentication on Avatar Uploads in `server/routes/uploadRoutes.js`
- Replace `optionalAuth` with `protect` on `POST /avatar`.
- Ensure unauthenticated requests return HTTP 401 Unauthorized.

### Step 5.8: Mitigate ReDoS in `server/controllers/movieController.js`
- Implement a helper function `escapeRegex(string)`:
  ```javascript
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  ```
- Wrap `search` before constructing `$regex`:
  ```javascript
  const sanitizedSearch = escapeRegex(search.trim());
  ```

### Step 5.9: Sanitize `GET /api/health` in `server/server.js`
- Remove `smtpUser` property from health check response.
- Expose only non-sensitive operational telemetry:
  ```json
  {
    "status": "online",
    "service": "CinePulse Recommendation API",
    "knnEngineTrained": true,
    "timestamp": "2026-11-23T00:00:00.000Z"
  }
  ```

---

## 6. Security and Compatibility Considerations
- **No Legitimate Workflow Disruption:** Legitimate registered users receive OTPs via Gmail SMTP and enter real 6-digit codes to verify their accounts.
- **Admin Seeding:** Seeder (`server/utils/seeder.js`) must seed the admin user (`admin@cinepulse.ai`) with `isVerified: true` and `role: 'admin'` so administrative operations remain functional.
- **Frontend Sync:** Ensure `LoginPage.jsx` handles `requireVerification: true` cleanly, which it already supports.

---

## 7. Expected Behavior After Implementation
- Submitting OTP `123456` on an unverified user fails with HTTP 400 (`Invalid or expired verification code`).
- Unverified users attempting to login receive HTTP 403 with `requireVerification: true` and a new OTP email.
- Calling `POST /api/movies/sync-tmdb` without a Bearer token returns HTTP 401; with a non-admin token returns HTTP 403.
- Calling `POST /api/upload/avatar` without Bearer token returns HTTP 401.
- Searching for `?search=(a+)+$` returns HTTP 200 with 0 results in <10ms without freezing the server.
- `GET /api/health` contains zero user email addresses.

---

## 8. Required Tests
1. Test invalid OTP rejection (assert `123456` fails).
2. Test valid OTP acceptance (assert real generated OTP succeeds).
3. Test unverified user login rejection (assert HTTP 403).
4. Test unauthenticated access to `/api/movies/sync-tmdb` (assert HTTP 401).
5. Test non-admin access to `/api/movies/sync-tmdb` (assert HTTP 403).
6. Test unauthenticated access to `/api/upload/avatar` (assert HTTP 401).
7. Test ReDoS search string handling (assert sub-10ms response).
8. Test `GET /api/health` payload structure (assert no email field).

---

## 9. Verification Procedure
Run automated security check commands:
```bash
# 1. Verify health check output
curl -s http://localhost:5001/api/health

# 2. Verify unauthorized sync-tmdb rejection
curl -s -X POST http://localhost:5001/api/movies/sync-tmdb

# 3. Verify unauthorized upload rejection
curl -s -X POST http://localhost:5001/api/upload/avatar

# 4. Search ReDoS probe
curl -s "http://localhost:5001/api/movies?search=(a%2B)%2B%24"
```

---

## 10. Acceptance Criteria
- [ ] Universal bypass OTP `123456` is completely eliminated from codebase.
- [ ] No hardcoded passwords or API keys exist in `server/utils/emailService.js` or `server/services/tmdbService.js`.
- [ ] `/api/movies/sync-tmdb` returns HTTP 401 without auth and HTTP 403 for non-admin.
- [ ] `/api/upload/avatar` returns HTTP 401 without token.
- [ ] `GET /api/health` does not expose `smtpUser`.
- [ ] ReDoS search strings execute safely with zero event-loop lag.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` items SEC-01 through SEC-08 to `Passed`.
- Update `MEMORY.md` to record completion of critical security fixes.
