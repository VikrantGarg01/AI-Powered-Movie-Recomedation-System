# IMPLEMENTATION PROMPT: 08_ACCESSIBILITY_IMPROVEMENTS

> **Priority:** RECOMMENDED (WCAG 2.1 AA Compliance)  
> **Order:** Step 8 in Remediation Sequence  
> **Dependencies:** None  
> **Target Subsystem:** React Components, Form Labels, Interactive Modals  

---

## 1. Project-Specific Context
CinePulse features a custom cinematic dark theme (`#0b0f19` canvas, rose `#e11d48` accent, slate text) built with Tailwind CSS. It contains interactive modals (`TrailerModal`, `GlobalSearchModal`), movie carousels, genre pills, and an authentication form in `LoginPage.jsx`.

---

## 2. Exact Problems Identified During Audit
1. **Missing Visible / Accessible `<label>` Elements in Forms:**  
   In `LoginPage.jsx`, form inputs rely primarily on placeholder text and adjacent icons without explicitly associated `<label htmlFor="...">` attributes or hidden screen-reader labels.
2. **Icon-Only Buttons Missing Explicit Names:**  
   Several interactive buttons (e.g. trailer close button, share buttons, carousel navigation chevrons) rely purely on Lucide SVG icons without fallback text or consistent `aria-label` tags.
3. **Focus Trapping in Modals:**  
   `TrailerModal.jsx` and `GlobalSearchModal.jsx` do not trap keyboard focus within the dialog when open, allowing Tab key navigation to escape to background elements.
4. **Color Contrast on Subtitles:**  
   Small utility text styled with `text-slate-500` on dark `#0b0f19` background yields a contrast ratio of ~3.8:1, falling slightly below WCAG AA required 4.5:1 for normal text.

---

## 3. Why the Improvement is Necessary
- Ensures blind and visually impaired users navigating via screen readers (VoiceOver, NVDA) can understand all interactive controls and form inputs.
- Prevents keyboard users from losing focus context when modals are active.
- Achieves compliance with WCAG 2.1 AA accessibility guidelines.

---

## 4. Affected Files and Components
- `src/pages/LoginPage.jsx`
- `src/components/TrailerModal.jsx`
- `src/components/GlobalSearchModal.jsx`
- `src/components/MovieCarousel.jsx`
- `src/components/SearchBar.jsx`

---

## 5. Required Implementation Steps

### Step 5.1: Add Accessible Labels in `src/pages/LoginPage.jsx`
- Associate every input with an `id` and `<label htmlFor="...">`:
  ```jsx
  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
    Email Address
  </label>
  <input
    id="auth-email"
    name="email"
    type="email"
    autoComplete="email"
    ...
  />
  ```
- Add `aria-invalid` and `aria-describedby` when errors occur.

### Step 5.2: Ensure All Icon Buttons Have `aria-label`
- Review all `<button>` elements containing only an `<svg>` icon.
- Add descriptive labels:
  - `aria-label="Scroll carousel left"`
  - `aria-label="Scroll carousel right"`
  - `aria-label="Clear search input"`
  - `aria-label="Close dialog"`

### Step 5.3: Focus Management in Modals
- In `TrailerModal.jsx` and `GlobalSearchModal.jsx`:
  - Add `role="dialog"` and `aria-modal="true"`.
  - Add `aria-labelledby="modal-title"`.
  - Auto-focus the primary interactive element (e.g. search input or close button) upon open.

### Step 5.4: Contrast Adjustment
- Upgrade utility text classes from `text-slate-500` to `text-slate-400` or `text-slate-300` across dark containers to ensure minimum 4.5:1 contrast.

---

## 6. Security and Compatibility Considerations
- HTML accessibility attributes do not alter visual styling or break layout.
- Screen reader announcements improve user experience without affecting performance.

---

## 7. Expected Behavior After Implementation
- Screen readers announce "Email Address, edit text" and "Password, secure edit text".
- Tabbing through the page highlights all interactive elements with visible focus rings.
- Pressing Escape closes any open modal and restores focus to the triggering element.

---

## 8. Required Tests
1. Keyboard navigation test: verify user can tab through entire login form, submit, and receive feedback without mouse.
2. Modal focus test: verify focus is captured when `TrailerModal` is open and restored on Escape.
3. Contrast audit: verify all text achieves 4.5:1 minimum contrast.

---

## 9. Verification Procedure
Run Lighthouse accessibility audit via Chrome DevTools or Lighthouse CLI:
```bash
npx lighthouse http://localhost:5173 --only-categories=accessibility --view
```

---

## 10. Acceptance Criteria
- [ ] Lighthouse accessibility score is $\ge 90$.
- [ ] All form fields have linked `<label>` or `aria-label`.
- [ ] All icon-only buttons include descriptive `aria-label`.
- [ ] Modals use `role="dialog"` and `aria-modal="true"`.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` item under Accessibility.
- Update `MEMORY.md` with accessibility compliance notes.
