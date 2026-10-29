# EABD Learning Platform

Web application for Empowering Ability Beyond Disability (EABD): a learner record where a young
person, or the adult who supports them, records what helps them learn, follows a practical pathway,
and receives a supervisor's review on each step.

The app is a single-page React application built with Vite, using Supabase for authentication,
Postgres, private file storage, and one Edge Function.

## Documentation

Start at [docs/README.md](docs/README.md). It indexes the documentation by kind:

- Architecture in `docs/architecture/`
- Reference material such as the database schema and component catalogue in `docs/reference/`
- Feature descriptions in `docs/features/`
- How-to guides in `docs/guides/`
- Operations and deployment in `docs/operations/`

Programme records for the current build live in `docs/eae/`.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- A Supabase project (the test project is provided by the project owner)

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with the project values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only the publishable key belongs in the browser bundle. The service role key is used only by the
Edge Function runtime and must never be added to a Vite environment file.

## Run the app

```bash
npm run dev
```

The development server prints its URL, normally http://localhost:5173.

## Checks

```bash
npm run lint    # ESLint, flat config for Vite and React
npm test        # Vitest unit tests
npm run build   # production bundle in dist/
```

Database security checks run against a linked project:

```bash
node scripts/rls-check.mjs
```

## Database and Edge Functions

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy extract-document
```

See [docs/guides/local-development.md](docs/guides/local-development.md) for the full walkthrough.

## Docker

A container image is provided for local review:

```bash
docker compose --env-file .env.local up --build
```

Then open http://localhost:8080. Vite inlines `VITE_*` values at build time, so the flag passes
your `.env.local` values into the image build. Rebuild after changing them.

To stop it:

```bash
docker compose down
```

## Project records

- Change log from 28 October 2026: [CHANGELOG.md](CHANGELOG.md)
- Current implementation plan: [docs/eae/2026-10-28-learner-record-plan.md](docs/eae/2026-10-28-learner-record-plan.md)
- Code review and gap analysis: [docs/eae/2026-10-28-code-review.md](docs/eae/2026-10-28-code-review.md)

## Conventions

- Plain sentences in user-facing copy. No em dashes and no emojis.
- Every interactive control is keyboard reachable, has a visible focus state, and meets the
  minimum target size set by the accessibility settings.
- Diagnosis is recorded as reported. It never drives the interface; function levels and the
  person's own settings do.
- Learner and document data is never written to the browser console.
