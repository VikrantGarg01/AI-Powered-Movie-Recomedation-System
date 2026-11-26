# IMPLEMENTATION PROMPT: 02_DATABASE_IMPROVEMENTS

> **Priority:** MANDATORY (Data Integrity & Host Isolation)  
> **Order:** Step 2 in Remediation Sequence  
> **Dependencies:** None  
> **Target Subsystem:** MongoDB Persistence, Mongoose Connection Lifecycle, Input Sanitization  

---

## 1. Project-Specific Context
CinePulse persists data across four primary Mongoose collections: `users`, `movies`, `ratings`, and `watchlists`. The backend runs with Mongoose 8.x and connects to MongoDB on `mongodb://127.0.0.1:27017/cinepulse_db` locally or `mongodb://mongodb:27017/cinepulse_db` inside Docker Compose.

---

## 2. Exact Problems Identified During Audit
1. **Rating Input Validation Flaw (`NaN` bypass) in `server/controllers/watchlistController.js` (lines 111-114):**  
   `const numRating = parseFloat(rating);` followed by `if (numRating < 1 || numRating > 5)` does not test `isNaN(numRating)`. In JavaScript, both `NaN < 1` and `NaN > 5` evaluate to `false`, allowing non-numeric ratings or `NaN` to bypass validation and corrupt database records.
2. **Unauthenticated MongoDB Port Exposure in `docker-compose.yml` (lines 9-10):**  
   The `mongodb` container maps port `"27017:27017"` directly to the host network interface (`0.0.0.0`) without requiring database root authentication or binding to localhost only.
3. **Missing Mongoose Automatic Reconnection Backoff in `server/config/db.js` (lines 11-15):**  
   When the MongoDB daemon is offline on initial boot or drops connection mid-flight, Mongoose does not implement an exponential backoff retry loop, leaving the server running indefinitely in disconnected fallback mode without restoring live persistence.
4. **Missing NoSQL Query Injection Sanitization:**  
   Query parameters from `req.query` (e.g. `genre`, `language`, `minRating`) are passed directly into Mongoose filter objects without explicit string-type casting, allowing query object injection if nested objects (`?genre[$ne]=...`) are submitted.

---

## 3. Why the Improvement is Necessary
- Prevents database record corruption caused by `NaN` rating values.
- Prevents external unauthorized access to MongoDB ports in containerized deployments.
- Ensures backend automatically reconnects to MongoDB when network or daemon restarts.
- Closes NoSQL query manipulation attack surfaces.

---

## 4. Affected Files and Components
- `server/controllers/watchlistController.js`
- `server/config/db.js`
- `docker-compose.yml`
- `server/controllers/movieController.js`

---

## 5. Required Implementation Steps

### Step 5.1: Fix Rating Validation in `server/controllers/watchlistController.js`
- Update `submitRating` handler to strictly validate that `rating` is a valid finite number:
  ```javascript
  const numRating = Number(rating);
  if (isNaN(numRating) || !isFinite(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Invalid rating. Rating must be a valid number between 1.0 and 5.0'
    });
  }
  ```

### Step 5.2: Secure Docker Compose MongoDB Configuration in `docker-compose.yml`
- Restrict port binding to localhost only:
  ```yaml
  ports:
    - "127.0.0.1:27017:27017"
  ```
- Configure internal Docker network isolation between `mongodb` and `backend` services so MongoDB is not accessible from external public interfaces.

### Step 5.3: Add Reconnection Backoff Loop in `server/config/db.js`
- Add connection event listeners:
  ```javascript
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected! Attempting reconnection...');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB successfully reconnected.');
  });
  ```
- Add retry helper with exponential backoff on startup:
  ```javascript
  export const connectDBWithRetry = async (retries = 5, delay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinepulse_db', {
          serverSelectionTimeoutMS: 5000,
        });
        logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (err) {
        logger.error(`MongoDB Connection Attempt ${attempt} failed: ${err.message}`);
        if (attempt === retries) {
          logger.warn('Running in decoupled/fallback mode. Ensure mongod is active.');
          return null;
        }
        await new Promise(res => setTimeout(res, delay * attempt));
      }
    }
  };
  ```

### Step 5.4: Sanitize Query Parameters in `server/controllers/movieController.js`
- Cast query parameters strictly to strings:
  ```javascript
  const genre = typeof req.query.genre === 'string' ? req.query.genre.trim() : undefined;
  const language = typeof req.query.language === 'string' ? req.query.language.trim() : undefined;
  const minRating = typeof req.query.minRating === 'string' ? parseFloat(req.query.minRating) : undefined;
  ```

---

## 6. Security and Compatibility Considerations
- Preserves backward compatibility with existing rating submissions (1, 2, 3, 4, 5 stars).
- Existing compound indexes on `Rating` and `Watchlist` remain untouched.
- Fallback JSON mode continues to function cleanly if MongoDB is not installed locally.

---

## 7. Expected Behavior After Implementation
- Sending `rating: "abc"` or `rating: null` returns HTTP 400.
- Sending `rating: 4.5` succeeds with HTTP 200 and records `4.5` in MongoDB.
- MongoDB container does not bind to external interfaces (`0.0.0.0`).
- If MongoDB restarts, the backend reconnects automatically without requiring server restart.

---

## 8. Required Tests
1. Test rating submission with `rating: "invalid"` (assert HTTP 400).
2. Test rating submission with `rating: NaN` (assert HTTP 400).
3. Test rating submission with `rating: 0` and `rating: 6` (assert HTTP 400).
4. Test rating submission with `rating: 4` (assert HTTP 200 and database record created).
5. Test query parameter casting with nested object `{ "genre": { "$gt": "" } }` (assert sanitized as undefined or string).

---

## 9. Verification Procedure
```bash
# 1. Test NaN rating rejection
curl -s -X POST http://localhost:5001/api/watchlist/rate \
  -H "Authorization: Bearer <VALID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"movieId":"155","rating":"not-a-number"}'

# 2. Test valid rating acceptance
curl -s -X POST http://localhost:5001/api/watchlist/rate \
  -H "Authorization: Bearer <VALID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"movieId":"155","rating":5}'
```

---

## 10. Acceptance Criteria
- [ ] Non-numeric ratings (`NaN`, strings, booleans, undefined) are rejected with HTTP 400.
- [ ] Valid ratings (1 to 5) are accepted and written to MongoDB.
- [ ] Docker Compose binds MongoDB port exclusively to `127.0.0.1`.
- [ ] MongoDB connection retry backoff is implemented and logged.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` items DB-03 and DB-04 to `Passed`.
- Update `MEMORY.md` with database sanitization and retry details.
