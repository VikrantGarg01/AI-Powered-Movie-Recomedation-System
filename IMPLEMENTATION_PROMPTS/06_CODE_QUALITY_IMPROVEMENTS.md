# IMPLEMENTATION PROMPT: 06_CODE_QUALITY_IMPROVEMENTS

> **Priority:** RECOMMENDED (Maintainability, Standards & Dependency Security)  
> **Order:** Step 6 in Remediation Sequence  
> **Dependencies:** None  
> **Target Subsystem:** Package Dependencies, Linting, Code Standardization  

---

## 1. Project-Specific Context
CinePulse is built with React 18, Vite 6, and Node.js v24 (ES Modules). The project currently has zero linter configuration (`.eslintrc` or `eslint.config.js`) and relies on dependencies that trigger vulnerability advisories during `npm audit`.

---

## 2. Exact Problems Identified During Audit
1. **Moderate Vulnerabilities in `react-router-dom`:**  
   `npm audit` reports moderate vulnerabilities in `react-router` / `react-router-dom`:
   - GHSA-wrjc-x8rr-h8h6: Open redirect via backslash in `<Link>` and `useNavigate`.
   - GHSA-337j-9hxr-rhxg: Constructor Injection via `deserializeErrors()`.
2. **Moderate Vulnerability in `minimatch` / `nodemon`:**  
   `server/` dependency audit reports GHSA-g3hv-75wg-m249: ReDoS vulnerability in `minimatch` via globparts amplification.
3. **Missing Linter and Formatting Rules:**  
   No ESLint configuration exists to enforce uniform code styling, prevent unused variables, or flag unsafe React Hook dependencies (`react-hooks/exhaustive-deps`).
4. **Code Duplication in Recommender Engines:**  
   `server/utils/knnRecommender.js` and `src/utils/recommendationEngine.js` duplicate identical tokenization, soup extraction, TF-IDF, and Cosine math with slight naming discrepancies (`computeCosineSimilarity` vs `cosineSimilarity`).

---

## 3. Why the Improvement is Necessary
- Eliminates known dependency advisories reported by automated security scanners.
- Standardizes code conventions across frontend and backend.
- Prevents silent React rendering bugs caused by missing hook dependency arrays.

---

## 4. Affected Files and Components
- `package.json`
- `server/package.json`
- `eslint.config.js` (to create)
- `.prettierrc` (to create)

---

## 5. Required Implementation Steps

### Step 5.1: Address Dependency Advisories Safely
- For `server/`: Run `npm audit fix` to update `minimatch` and `nodemon` to safe patched versions.
- For root frontend: Update `react-router-dom` to the latest patch release within the v6 semver range (`^6.28.2` or compatible) that addresses advisory GHSA-wrjc-x8rr-h8h6 without breaking v6 routing conventions.

### Step 5.2: Configure ESLint Flat Config (`eslint.config.js`)
- Install minimal ESLint tools:
  ```bash
  npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks
  ```
- Configure standard rules:
  - `no-unused-vars`: `warn`
  - `react-hooks/rules-of-hooks`: `error`
  - `react-hooks/exhaustive-deps`: `warn`
  - `no-console`: `off` (needed for structured logging)

### Step 5.3: Add `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100
}
```

### Step 5.4: Add Lint Script to `package.json`
```json
"scripts": {
  "lint": "eslint src/ server/ --ext .js,.jsx"
}
```

---

## 6. Security and Compatibility Considerations
- Ensure upgrading `react-router-dom` does not introduce breaking API changes to `<Routes>`, `<Route>`, `useNavigate`, or `useLocation`.
- ESLint rules should warn on existing code without blocking builds immediately.

---

## 7. Expected Behavior After Implementation
- `npm audit` in `server/` reports 0 vulnerabilities.
- Running `npm run lint` scans all `.js` and `.jsx` files without fatal syntax errors.
- Code style is uniform across all directories.

---

## 8. Required Tests
1. Run `npm audit` on root: verify resolved or documented risk status.
2. Run `npm audit` on `server/`: verify 0 vulnerabilities.
3. Run `npm run lint`: verify clean lint output.
4. Run `npm run build`: verify frontend bundle builds cleanly.

---

## 9. Verification Procedure
```bash
# 1. Check server dependencies
cd server && npm audit

# 2. Check root dependencies
cd .. && npm audit

# 3. Run lint
npm run lint
```

---

## 10. Acceptance Criteria
- [ ] Server `npm audit` reports 0 vulnerabilities.
- [ ] Linter executes and reports no errors.
- [ ] Production build succeeds with 0 errors.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` item under Code Quality.
- Update `MEMORY.md` with linter instructions.
