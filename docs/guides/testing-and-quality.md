# Testing and quality guide

## The four gates

```bash
npm run lint    # ESLint, flat config for Vite and React
npm test        # Vitest unit and component tests
npm run build   # production bundle
node scripts/rls-check.mjs   # database policies against a real project
```

The first three run without credentials. The fourth needs a linked project and three test
accounts. A fifth step, a browser pass through the running app, is described under
[Browser testing with Cursor](#browser-testing-with-cursor).

## Lint

`eslint.config.mjs` is a flat config, not a Next.js preset. It applies:

| Rule | Why |
| --- | --- |
| `@eslint/js` recommended | Baseline correctness |
| `react-hooks` recommended | Rules of hooks and dependency correctness |
| `react-refresh` vite | Keeps hot reload working, so components and constants live apart |
| `react/jsx-uses-vars` | Stops JSX imports being reported as unused |
| `no-unused-vars` with `_` escape | Catches leftover imports |
| `no-console` allowing only `error` and `warn` | Keeps learner data out of the console |
| `eqeqeq`, `prefer-const` | Small consistency wins |

Two `react-hooks` rules are turned off for `src/**`: `set-state-in-effect` and
`preserve-manual-memoization`. Both flag the ordinary fetch-on-mount and
"seed a form when the record arrives" patterns that this app uses on purpose. The reason is
written in the config next to the override.

`supabase/functions/**` is excluded because those files are Deno with a different global set.

## Unit and component tests

Vitest 4 runs in jsdom. `vitest.config.js` collects `src/**/*.test.{js,jsx}` and
`scripts/**/*.test.js`. A test file sits next to the code it covers, except the commit
message checker, which lives under `scripts/` with the hook it protects.

### How to run them

```bash
npm test
npx vitest run src/utils/progress.test.js
npm run test:watch
```

`npm test` runs the suite once and exits. Pass a path to run one file. Watch mode reruns
the affected file when it changes. The suite needs no Supabase credentials and no browser.

### What belongs in a unit test

Test a rule that can be wrong without the screen showing it. That is a pure function, a
validation contract, a date or error translation, or a structural promise such as "every
theme defines the same tokens".

Add the test in the same change as the function. Name the file after the module:
`progress.js` is covered by `progress.test.js`. Use `describe` for the module and `it`
for one behaviour. The sentence in `it` should say what the caller can rely on.

```js
import { describe, expect, it } from "vitest";
import { getWeekStatus } from "./progress.js";

describe("getWeekStatus", () => {
  it("locks the next week until the previous week is submitted", () => {
    expect(getWeekStatus(pathway, rows, 1)).toBe("locked");
  });
});
```

Mock only at the boundary. A pure function should receive plain objects, not a fake
Supabase client. When a test does need a module mock, use `vi.mock` and return the
smallest shape the page reads.

### Page smoke tests

`src/pages/pages-smoke.test.jsx` renders pages with `react-dom/client` into jsdom and
checks the text and accessible names a person would see. Auth, the learner record, and
the database modules are mocked, so the test proves the page can render. It does not
prove a click writes a row.

Use a smoke test when a page's important copy or structure would be easy to drop: one
`h1`, the account-type choice, a collapsible week, a legal warning. Extract a new pure
function, and test that function, when the page grows a rule of its own.

### The current suite

| File | Covers |
| --- | --- |
| `src/lib/passkeys.test.js` | Error translation and date formatting |
| `src/lib/levels.test.js` | The three function scales, conversion to and from stored values, readable labels |
| `src/lib/adaptations.test.js` | Derived settings for three sample learners, the diagnosis-only case, target size never lowering, override precedence |
| `src/lib/extraction.test.js` | The validation contract: sample, unknown key, level 6, fractional level, missing evidence, malformed payload, flat payload |
| `src/utils/progress.test.js` | Week availability, unlocking on submission, re-locking after a "not yet" review, summary counts, next task |
| `src/styles/themes.test.js` | Every theme defines the same tokens, and colour values stay on those tokens |
| `src/components/ui/auth-components.test.jsx` | `PasswordField` labelling and toggle state, `StatusBanner` roles |
| `src/pages/pages-smoke.test.jsx` | Public, learner, supervisor, and unknown routes render their real content with mocked data |
| `scripts/commit-message.test.js` | The commit message shape enforced by Husky |

### What is deliberately not unit tested

Row level security is checked by `scripts/rls-check.mjs` against a real project, because
a mock would only repeat the policy text. A signed-in journey through onboarding,
submission, and review is the manual rehearsal at the end of this guide, plus the
browser pass. Those two cover the paths a unit test cannot reach without pretending
the database said yes.

## The RLS check

`scripts/rls-check.mjs` proves the security model against a real project. It signs in as three
accounts and asserts eleven behaviours.

Create `scripts/.env` (ignored) with:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key>
RLS_LEARNER_A_EMAIL=
RLS_LEARNER_A_PASSWORD=
RLS_LEARNER_B_EMAIL=
RLS_LEARNER_B_PASSWORD=
RLS_SUPERVISOR_EMAIL=
RLS_SUPERVISOR_PASSWORD=
```

Then:

```bash
node scripts/rls-check.mjs
```

What it asserts:

1. Learner A reads their own learner row.
2. Learner B sees no rows for learner A.
3. Learner B cannot insert a document row for learner A.
4. Learner B cannot upload into learner A's storage folder.
5. Learner A cannot set a step to `reviewed`.
6. Learner A cannot insert a review.
7. A client cannot insert into `supervisors`.
8. The supervisor reads the assigned learner.
9. The supervisor sees no documents.
10. The supervisor inserts a review.
11. The review sets the step to `reviewed`.

Run it after any migration that touches tables, policies, or storage.

## Docker review build

```bash
docker compose --env-file .env.local up --build
```

Then open http://localhost:8080. The image builds the bundle with your environment values baked
in, then serves it from nginx with:

- A try-files fallback so client-side routes work on refresh.
- Immutable caching for fingerprinted assets.
- No caching for `index.html`, so a new build is picked up.
- A `/healthz` endpoint for the container health check, served on both IPv4 and IPv6.

Rebuild after changing environment values, because Vite inlines them at build time.

Check that the container reports healthy, not just that a port answers:

```bash
docker ps --format '{{.Names}}\t{{.Status}}'
```

To stop it:

```bash
docker compose down
```

## Browser testing with Cursor

Cursor has a built-in **Browser** tool. No MCP server or extension needs installing. It is
documented at [cursor.com/docs/agent/tools/browser](https://cursor.com/docs/agent/tools/browser).

What matters for this project:

| Point | Detail |
| --- | --- |
| How to invoke it | Ask in plain language, or mention `@browser` in the prompt |
| Approach | It navigates, clicks, types, scrolls, takes screenshots, and reports console output |
| Approval | Browser tools ask for approval by default; allow-listing is configured in Settings, then Agents, then Auto-Run |
| Sign-in walls | The documented answer is to tell the agent how to sign in; cookies and local storage persist per workspace |
| Origin allowlist | Enterprise only. When enabled, only listed origins can be browsed automatically |

### The practical constraint in this repository

The Browser tool runs in an isolated network context per workspace. A server started by a
short-lived shell command **stops when that command ends**, so the browser then cannot reach
it. That is why a `vite preview` started from a tool call appears to fail.

The reliable pattern is to serve from something that outlives a single command:

```bash
docker compose --env-file .env.local up --build -d
```

Then ask the agent to open `http://localhost:8080` and test the flow. Steps that need a signed-in
account require the database migration to be applied and a confirmed account, because a session
cannot be invented by the browser.

### What the browser pass covers

- Every public page renders, with exactly one `h1` and a working skip link.
- The account type radio changes the name field label.
- The password toggles flip `aria-pressed` and their accessible label.
- A protected route redirects to `/signin` when signed out.
- The display panel opens from the header, and Escape closes it and returns focus to the trigger.
- Form submission shows the in-flight label, then either an alert on failure or a status message
  on success.

Component-level coverage of the same surfaces lives in `src/pages/pages-smoke.test.jsx`, which
renders each page with mocked contexts and data. That suite runs in CI; the browser pass does not.

## Manual rehearsal script


Before handing a build to someone else, run this against the test project:

1. Sign up as a learner. Confirm the dashboard prompts you to finish setup.
2. Complete onboarding, skipping the document. Check that the display step shows suggested
   settings.
3. Refresh mid-onboarding on the Room step. You should land on the Room step.
4. Open the profile and change MACS to 4. The display settings should now suggest extra-large
   targets and one thing at a time.
5. Open the journey. Start a step, let Canva open, come back, and submit with a note.
6. Sign in as the supervisor. Review the step as Done with a rating and a comment.
7. Sign back in as the learner. The dashboard shows the feedback and the step counts as reviewed.
8. Review another step as Not yet. The learner sees it returned, and the following week locks.
9. Sign up as a guardian and complete onboarding with the document step using the mock provider.
   Confirm the accepted fields appear, and that the file is deleted when the box is ticked.
10. Add a passkey on the Account page, sign out, and sign back in with the passkey.
