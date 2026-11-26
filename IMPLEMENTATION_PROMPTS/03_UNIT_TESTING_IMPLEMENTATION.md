# IMPLEMENTATION PROMPT: 03_UNIT_TESTING_IMPLEMENTATION

> **Priority:** MANDATORY (Regression & Algorithm Verification)  
> **Order:** Step 3 in Remediation Sequence  
> **Dependencies:** `01_SECURITY_IMPLEMENTATION.md` (relies on sanitized security logic)  
> **Target Subsystem:** Mathematical Logic, Tokenization, TF-IDF Vectors, Password & OTP Utilities  

---

## 1. Project-Specific Context
CinePulse contains an in-memory Content-Based K-Nearest Neighbors recommendation engine in `server/utils/knnRecommender.js` and `src/utils/recommendationEngine.js`. Both engines implement text tokenization, stopword filtering, document soup extraction, sublinear TF-IDF vector generation, L2 normalization, and cosine distance ranking. In addition, `server/models/User.js` contains cryptographic Bcrypt pre-save hooks and OTP expiration logic.

---

## 2. Exact Problems Identified During Audit
1. **Zero Automated Unit Tests in the Project:**  
   The audit revealed 0 test files in `server/` and 0 test files in root `src/`.
2. **Untested Recommender Vector Calculations:**  
   No automated assertions verify that L2 normalization produces vectors with unit norm ($\|v\| = 1.0$), that cosine similarity is bounded between 0.0 and 1.0, or that cosine distance is $1 - \text{cosineSimilarity}$.
3. **Untested Cryptographic Password Logic:**  
   No automated tests confirm that `UserSchema.pre('save')` generates unique salts and hashes passwords, or that `matchPassword()` reliably succeeds on valid passwords and rejects invalid passwords.
4. **Untested OTP Generation & Expiry Logic:**  
   No automated tests verify that `generateVerificationOtp()` produces exactly 6 numeric digits and sets expiration to 10 minutes in the future.

---

## 3. Why the Improvement is Necessary
Without unit tests:
- Refactoring or optimizing recommender code could silently corrupt recommendation rankings.
- Security utilities (Bcrypt comparison, OTP generation, token verification) could fail silently.
- Academic evaluation criteria cannot be continuously validated via automated commands.

---

## 4. Affected Files and Components
- `server/utils/knnRecommender.js`
- `server/models/User.js`
- `src/utils/recommendationEngine.js`
- `package.json` and `server/package.json`

---

## 5. Required Implementation Steps

### Step 5.1: Configure Test Framework
- Add Vitest to `package.json` (or `server/package.json`):
  ```bash
  npm install -D vitest
  ```
- Configure npm test script in `package.json`:
  ```json
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
  ```

### Step 5.2: Create Unit Test Suites in `tests/unit/`

#### 1. Recommender Math Tests (`tests/unit/recommender.test.js`):
- Test `tokenizeText()`:
  - Strips punctuation and lowercase conversion.
  - Removes common stopwords (`the`, `and`, `is`).
  - Ignores short tokens ($< 3$ characters).
- Test `ContentBasedKNNRecommender`:
  - `fit()` correctly constructs vocabulary and IDF weights.
  - L2 normalized vectors have Euclidean norm $\approx 1.0 \pm 10^{-5}$.
  - `computeCosineSimilarity(a, b)`:
    - Dot product of identical vector $= 1.0$.
    - Dot product of orthogonal vectors $= 0.0$.
  - `computeCosineDistance(a, b)`:
    - Distance of identical vector $= 0.0$.
    - Distance of orthogonal vectors $= 1.0$.
  - Top-K recommendation ranking ordering: nearest neighbor has highest similarity.

#### 2. User Authentication & OTP Utilities (`tests/unit/userAuth.test.js`):
- Test `generateVerificationOtp()`:
  - Generates string of length 6.
  - Contains only digits (`/^\d{6}$/`).
  - Sets `verificationOtpExpires` approximately 10 minutes from `Date.now()`.
- Test `checkVerificationOtp()`:
  - Rejects expired OTPs (where `Date.now() > verificationOtpExpires`).
  - Rejects incorrect OTP strings.
  - Rejects backdoor `123456` if not the real generated OTP.
  - Accepts exact matching OTP.

#### 3. String Sanitization & ReDoS Helper (`tests/unit/sanitization.test.js`):
- Test `escapeRegex()` correctly escapes special characters (`.*+?^${}()|[]\`).
- Test that escaped string executes safely in `new RegExp(escaped)` without throwing syntax errors.

---

## 6. Security and Compatibility Considerations
- Tests run purely in-memory using Node.js without requiring live MongoDB daemon or external network connections.
- Vitest supports native ES modules seamlessly.

---

## 7. Expected Behavior After Implementation
- Running `npm test` discovers and executes all unit test suites.
- All test assertions pass in under 5 seconds.
- Fails immediately if any mathematical formula, normalization step, or OTP expiry logic is modified incorrectly.

---

## 8. Required Tests
- Minimum 15 unit test cases:
  1. `tokenizeText` basic cleaning.
  2. `tokenizeText` stopword filtering.
  3. Recommender `fit` builds vocabulary.
  4. L2 vector normalization verification.
  5. Cosine similarity identity and bounds ($[0, 1]$).
  6. Cosine distance calculation ($1 - \text{sim}$).
  7. KNN query returns $K$ nearest items sorted by similarity descending.
  8. OTP length and numeric format.
  9. OTP expiration detection.
  10. OTP verification match.
  11. OTP rejection on mismatch.
  12. OTP rejection on universal `123456` when different.
  13. `escapeRegex` handles regex meta-characters.
  14. `escapeRegex` neutralizes catastrophic backtracking payloads.
  15. Rating score boundary enforcement.

---

## 9. Verification Procedure
```bash
# Execute unit tests
npm test
```

---

## 10. Acceptance Criteria
- [ ] `npm test` executes cleanly with 100% test pass rate.
- [ ] Zero flaky or timing-dependent tests.
- [ ] Mathematical invariants of KNN recommender verified.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` item TST-01 to `Passed`.
- Update `MEMORY.md` with unit testing setup and command.
