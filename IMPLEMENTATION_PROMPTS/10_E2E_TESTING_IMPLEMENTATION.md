# IMPLEMENTATION PROMPT: 10_E2E_TESTING_IMPLEMENTATION

> **Priority:** RECOMMENDED (Full-Stack User Workflow Simulation)  
> **Order:** Step 10 in Remediation Sequence  
> **Dependencies:** `01_SECURITY_IMPLEMENTATION.md`, `03_UNIT_TESTING_IMPLEMENTATION.md`  
> **Target Subsystem:** Frontend Rendering, Navigation, Auth Flow, User State Persistence  

---

## 1. Project-Specific Context
CinePulse is a single-page React 18 application with client-side routing via React Router DOM 6. Key user flows include discovering movies, searching via the keyboard shortcut modal (`Cmd+K`), viewing movie details and trailers, logging in, rating films, and viewing dynamically recalculated KNN recommendations.

---

## 2. Exact Problems Identified During Audit
1. **Zero Browser-Level E2E Testing:**  
   Currently, all frontend testing is manual clicking in a live browser. No automated tests simulate real user interactions or verify that React Context properly coordinates with `localStorage` and backend API endpoints.
2. **Risk of Navigation & State Regressions:**  
   Changes to routing or authentication headers can inadvertently cause white screens or broken navigation without being caught by backend API tests.

---

## 3. Why the Improvement is Necessary
- Validates the complete user experience from browser load to recommendation rendering.
- Catches UI layout crashes, broken buttons, and React state desynchronization before deployment.

---

## 4. Affected Files and Components
- `tests/e2e/*` (to create)
- `package.json`
- `playwright.config.js` (to create)

---

## 5. Required Implementation Steps

### Step 5.1: Install Playwright
```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

### Step 5.2: Configure Playwright (`playwright.config.js`)
```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  webServer: {
    command: 'npm start',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120000
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  }
});
```

### Step 5.3: Create Core User Journey E2E Specs (`tests/e2e/userFlow.spec.js`)

#### 1. Catalog & Search Flow:
- Load homepage (`http://localhost:5173`).
- Verify navbar brand, hero banner, and carousels render.
- Click search bar or press `Cmd+K` / `Ctrl+K`.
- Search for "Inception" and verify movie card appears in search modal results.
- Click movie card and verify navigation to `/movie/inception-2010` (or TMDB ID).

#### 2. Movie Details & Trailer Flow:
- On Movie Details page, verify poster, title, rating, and cast display.
- Click "Watch Official Trailer" and verify `TrailerModal` appears with YouTube iframe.
- Press `Escape` and verify modal closes cleanly.

#### 3. Authentication & Watchlist Flow:
- Navigate to `/login`.
- Fill email and password.
- Submit and verify authentication state updates.
- Navigate to `/discover`, click "Add to Watchlist" on a movie.
- Navigate to `/watchlist` and verify movie appears in the saved queue.

---

## 6. Security and Compatibility Considerations
- Tests run against headless Chromium for fast, reliable CI execution.
- Web server starts automatically using `./start.sh` or existing dev server.

---

## 7. Expected Behavior After Implementation
- Running `npx playwright test` launches headless browser, executes user journeys, and reports all passed.
- Screenshots and traces captured automatically on test failures.

---

## 8. Required Tests
1. Homepage initial load & carousel rendering test.
2. Global search modal and filter test.
3. Movie details view and trailer modal test.
4. Watchlist addition and removal sync test.

---

## 9. Verification Procedure
```bash
# Execute headless E2E test suite
npx playwright test
```

---

## 10. Acceptance Criteria
- [ ] Playwright test suite executes and passes 100% of core flows.
- [ ] No uncaught console errors or React Error Boundary triggers.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` item under E2E testing.
- Update `MEMORY.md` with E2E instructions.
