# EABD learning platform code review

Reviewed `feature/passkey-sign-in` at `0a6eda7` on 28 October 2026. The running app is Vite 7, React 19, React Router 7, and Supabase. This document records the findings from the code review and compares them against `docs/eae/2026-10-28-learner-record-plan.md`.

## Summary

The marketing pages, passkey sign-in, and the single Canva pathway form a working pilot front end. The learner record is not safe to treat as real yet. One refresh bug can overwrite saved progress, onboarding prints support needs to the browser console and discards them, and there is no working lint or test gate.

`docs/eae/2026-10-28-learner-record-plan.md` replaces the demo onboarding and local progress with Supabase tables, row level security, a private document bucket, profile-driven display settings, and a supervisor review flow. Several findings from this review are already solved by that plan. The remaining gaps below are not yet covered in the plan and should be folded into the tasks as they are built.

## Critical finding

### 1. Refreshing the learning journey can overwrite saved progress

- **Location:** `src/pages/LearningJourney.jsx:36-50`, `src/utils/progress.js:55-95`, `src/context/AuthContext.jsx:31-33`
- **Issue:** `AuthProvider` starts with `session: null` while `supabase.auth.getSession()` resolves. `LearningJourney` initializes `progress` once with `useState(() => loadProgress(learnerId, pathway))` while `learnerId` is still `undefined`, which returns an empty progress record. It never reloads when `user?.id` arrives. The first checkbox change then writes that empty record back to `localStorage`, overwriting earlier progress.
- **How the learner-record plan affects it:** Task 3 (`LearnerContext`) and Task 9 replace `localStorage` with `task_progress` and `task_reviews` rows. Task 9 still needs to wait for `AuthContext` and `LearnerContext` loading before rendering or mutating progress, and `LearningJourney` should sit inside `ProtectedRoute`.

## Important findings

### 2. Onboarding logs barriers and support needs and does not save them

- **Location:** `src/pages/Onboarding.jsx:38-57`
- **Issue:** Onboarding collects goal, barriers, support, and adjustments, prints them with `console.info`, and navigates to `/dashboard`. A visitor who is not signed in hits `ProtectedRoute` on `/dashboard` and loses what they typed.
- **How the learner-record plan affects it:** Task 5 deletes `src/pages/Onboarding.jsx`, moves `/onboarding` inside `ProtectedRoute`, and saves each step to `public.learners`.

### 3. Pathway selection lives only in the query string

- **Location:** `src/pages/Dashboard.jsx:21-27`, `src/pages/Account.jsx:173`
- **Issue:** `Dashboard` reads `window.location.search` directly instead of React Router's `useSearchParams`. Navigating to `/account` and back to `/dashboard` drops `?pathway=`, so the dashboard falls back to the empty state.
- **How the learner-record plan affects it:** Task 8 and Task 9 wire the dashboard and journey to the learner record and the Canva pathway. `Dashboard` should use `useSearchParams` (or default to the active pathway in `learningPaths[0]` when a learner has started or completed onboarding) so returning from `/account` or `/profile` never loses the pathway.

### 4. Client-side review approval and unlocked journey route

- **Location:** `src/pages/LearningJourney.jsx:275-285`, `src/utils/progress.js:223-244`, `src/App.jsx:52-60`
- **Issue:** The learner page renders a "Simulate reviewer approval" button that clears pending reviews in the browser, and `/learning-journey` is outside `ProtectedRoute`.
- **How the learner-record plan affects it:** Task 2, Task 9, and Task 10 move reviews to `public.task_reviews` under RLS (`supervises_learner`) with an `apply_review` trigger, and remove the local demo approval. `/learning-journey` should also be placed inside `ProtectedRoute` in `src/App.jsx`.

### 5. Tooling, lint, typecheck, and documentation drift

- **Location:** `package.json:6-9`, `eslint.config.mjs:1-16`, `tsconfig.json:16`, `README.md:1`, `AGENTS.md:1`
- **Issue:** `package.json` has no `lint` or `test` scripts. `eslint.config.mjs` imports `eslint-config-next`, which is not installed. `tsconfig.json` includes only `.ts` and `.tsx` while the codebase is `.js` and `.jsx`. `README.md` and `AGENTS.md` still describe Next.js. There is no `.env.example`.
- **How the learner-record plan affects it:** Task 1 replaces `eslint.config.mjs` for Vite and React, adds Vitest, and rewrites `README.md` and `AGENTS.md`. Task 1 should also add `.env.example` and either remove `tsconfig.json` or include `.js`/`.jsx` (`checkJs: false`) so editor tooling matches the repo.

### 6. Automated testing is absent

- **Location:** `src/utils/progress.js`, `src/lib/passkeys.js`
- **Issue:** There are zero unit, component, or end-to-end tests, and no CI workflow.
- **How the learner-record plan affects it:** The plan adds `scripts/rls-check.mjs` (Task 2), `src/lib/extraction.test.js` (Task 7), `src/lib/adaptations.test.js` (Task 8), and `src/utils/progress.test.js` (Task 9). Adding a unit test for `src/lib/passkeys.js` in Task 1 gives immediate test verification before database work begins.

### 7. Missing CSS rules and theme token bypasses on learner screens

- **Location:** `src/index.css:24-59`, `src/index.css:230-235`, `src/pages/Dashboard.jsx`, `src/pages/SignUp.jsx:129-195`, `src/components/Navbar.css:73-80`, `src/components/Navbar.css:172-176`
- **Issue:**
  - `Dashboard` uses `dashboard-*` classes that have no CSS rules (except `.dashboard-account-link`).
  - `App.jsx` renders `.not-found-page`, `.not-found-eyebrow`, `.not-found-actions`, `.not-found-primary`, and `.not-found-secondary`, while `src/pages/NotFound.css` is empty and not imported.
  - `.auth-field` styles `input` (`src/index.css:230`) and does not style `textarea` or `select`, leaving onboarding textareas at browser defaults.
  - `.auth-password-control` and `.auth-password-toggle` in `SignUp.jsx` have no rules in `src/index.css`.
  - `.text-size-control`, `.text-size-options`, `.text-size-button`, `.reading-controls`, `.reading-speed-control`, and `.reading-speed-labels` in `SiteHeader.jsx` have no rules in `src/components/Navbar.css`.
  - Fixed hex colours on `.nav-cta`, `.accessibility-option[aria-pressed="true"]`, `.auth-error`, `.learning-notice`, `.learning-error`, and `.status-*` bypass dark mode (`:root[data-theme="dark"]`) and high-contrast (`:root.a11y-high-contrast`) tokens.
- **How the learner-record plan affects it:** Task 8 adds `dashboard-*` CSS and target-size rules in `accessibility.css`. The remaining unstyled selectors (`textarea`, `select`, password toggle, header accessibility controls, 404 page, and high-contrast/dark-mode token variables) should be included in Task 5 and Task 8.

### 8. Accessibility gaps in skip link, hero video motion, settings dialog, and speech synthesis

- **Location:** `src/pages/Home.jsx:13-27`, `src/components/SiteHeader.jsx:92-171`, `src/components/SiteHeader.jsx:196`, `src/components/SiteHeader.jsx:264-399`, `src/components/Navbar.css:250-254`
- **Issue:**
  - `SiteHeader` renders `<a className="skip-link" href="#main-content">`. `Home.jsx` renders `<main className="home-page">` without `id="main-content"` or `tabIndex="-1"`.
  - The homepage hero `<video autoPlay muted loop playsInline>` continues playing when `prefers-reduced-motion: reduce` or `a11y-reduced-motion` is active; CSS `animation-duration` does not pause `<video>`.
  - The accessibility panel (`#accessibility-panel`) does not close on `Escape` or outside click, and below `420px` `.header-tool-button` drops to `40px` (`Navbar.css:250`), below the 44 by 44 px minimum used elsewhere.
  - `startReading` calls `window.speechSynthesis.getVoices()` synchronously; in browsers that populate voices asynchronously on `voiceschanged`, the first call sees an empty array.
- **How the learner-record plan affects it:** Task 8 already edits `SiteHeader.jsx` and `accessibility.css`. These fixes belong alongside Task 8 so every interactive control and page honours the accessibility settings.

### 9. Account and navigation state when signed in

- **Location:** `src/components/SiteHeader.jsx:229-235`, `src/pages/SignUp.jsx:33-35`, `src/pages/SignIn.jsx:111-123`
- **Issue:**
  - `SiteHeader` always displays `Learner sign in` pointing to `/signin`, even when a user is signed in (and even when that user is a supervisor in Task 10).
  - `SignIn.jsx` has no show/hide password button (unlike `SignUp.jsx`).
- **How the learner-record plan affects it:** Task 8 and Task 10 update `SiteHeader.jsx` and add `/profile` and `/supervisor`. `SiteHeader` should link signed-in users to `/dashboard`, `/profile`, `/account` (or `/supervisor` when `isSupervisor()` is true) instead of `/signin`.

## Minor findings and hygiene

1. **Empty and unused files:** `src/components/AccessibilityControls.jsx`, `src/components/SiteFooter.jsx`, `src/pages/NotFound.jsx`, `src/utils/accessibility.js`, `src/data/navigation.js`, `src/layouts/DashboardLayout.jsx`, and `src/layouts/MainLayout.jsx` are 0-byte files. `src/components/Footer.css` and `src/pages/NotFound.css` are 1-line comments. `src/styles/accessibility.css` is never imported in `src/main.jsx`. `public/globe.svg` and `public/videos/two-smiling-people.mp4` are unused.
2. **Unused icon imports:** `CheckCircle2` in `src/pages/Dashboard.jsx:6`; `Type`, `Minus`, and `Plus` in `src/components/SiteHeader.jsx:13-18`.
3. **Null pathway guard in `progress.js`:** `loadProgress` calls `createEmptyProgress(pathway)` when `!pathway?.id`, and `createEmptyProgress` reads `pathway.id` (`src/utils/progress.js:7-15` and `:55-58`). Task 9 rewrites `progress.js` and should guard against a missing pathway.

## Gap matrix against `docs/eae/2026-10-28-learner-record-plan.md`

| Review finding | Covered in learner-record plan? | Where to integrate |
| --- | --- | --- |
| 1. `LearningJourney` initial state race on auth load | Partially (Task 9 moves to DB) | Task 9: put `/learning-journey` in `ProtectedRoute` and wait for `LearnerContext` loading before querying or writing |
| 2. `Onboarding` `console.info` of support needs | Yes (Task 5 replaces `Onboarding.jsx`) | Task 5: ensure zero `console.info`/`console.log` of learner fields |
| 3. `Dashboard` loses pathway when returning from `/account` | Partially (Task 8 rewrites `Dashboard.jsx`) | Task 8: read pathway with `useSearchParams` and default to `learningPaths[0]` for onboarded learners |
| 4. Client-side "Simulate reviewer approval" button | Yes (Task 2, Task 9, Task 10) | Task 9 & Task 10: remove demo approval button; supervisor writes `task_reviews` |
| 5. Broken `eslint.config.mjs`, Next.js docs, `tsconfig.json`, `.env.example` | Mostly (Task 1) | Task 1: also add `.env.example`, clean up `tsconfig.json`, and remove unused imports/empty files so `npm run lint` passes |
| 6. Zero automated tests | Mostly (Tasks 1, 2, 7, 8, 9) | Task 1: add `src/lib/passkeys.test.js` so Vitest runs a real suite immediately |
| 7. Unstyled classes (`dashboard-*`, `textarea`, password toggle, 404, header controls) & dark/high-contrast tokens | Partially (Task 8 covers `dashboard-*` and target sizes) | Task 1/5/8: import `src/styles/accessibility.css` in `src/main.jsx`; style `textarea`/`select`, password toggle, 404, and header controls; use theme tokens |
| 8. `Home.jsx` missing `#main-content`, hero video ignores reduced motion, panel Escape/focus, `getVoices()` | Not explicitly listed | Task 8: add `id="main-content" tabIndex="-1"` to `Home.jsx`, pause hero video on reduced motion, add Escape handler and 44 px minimum on header tools |
| 9. `SiteHeader` always says "Learner sign in" when signed in | Not explicitly listed | Task 8 / Task 10: show `Dashboard` / `Profile` / `Supervisor` links when authenticated |
| 10. Seven 0-byte files and unused `styles/accessibility.css` import | Mentioned in "What exists today" | Task 1 & Task 8: delete unused 0-byte files and import `src/styles/accessibility.css` in `src/main.jsx` |
