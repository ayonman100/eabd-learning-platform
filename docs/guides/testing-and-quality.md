# Testing and quality guide

## The four gates

```bash
npm run lint    # ESLint, flat config for Vite and React
npm test        # Vitest unit and component tests
npm run build   # production bundle
node scripts/rls-check.mjs   # database policies against a real project
```

The first three run without credentials. The fourth needs a linked project and three test
accounts.

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

Vitest with a jsdom environment. Test files sit beside the code as `*.test.js` or `*.test.jsx`.

| File | Covers |
| --- | --- |
| `src/lib/passkeys.test.js` | Error translation and date formatting |
| `src/lib/levels.test.js` | The three function scales, conversion to and from stored values, readable labels |
| `src/lib/adaptations.test.js` | Derived settings for three sample learners, the diagnosis-only case, target size never lowering, override precedence |
| `src/lib/extraction.test.js` | The validation contract: sample, unknown key, level 6, fractional level, missing evidence, malformed payload, flat payload |
| `src/utils/progress.test.js` | Week availability, unlocking on submission, re-locking after a "not yet" review, summary counts, next task |
| `src/components/ui/auth-components.test.jsx` | `PasswordField` labelling and toggle state, `StatusBanner` roles |

Run one file:

```bash
npx vitest run src/utils/progress.test.js
```

Watch mode:

```bash
npm run test:watch
```

### What is deliberately not unit tested

Pages are covered by the gates above and by manual rehearsal, not by component tests, because
their behaviour is mostly orchestration of the data layer. The valuable tests are the pure rules:
week locking, adaptation derivation, and the extraction contract. If a page grows a rule of its
own, extract the rule and test it.

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
- A `/healthz` endpoint for container health.

Rebuild after changing environment values, because Vite inlines them at build time.

To stop it:

```bash
docker compose down
```

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
