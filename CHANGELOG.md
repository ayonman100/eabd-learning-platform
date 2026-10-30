# Changelog

Work by Tonye A. on `feature/learner-record`, from 28 October 2026. The first entry
is `bc7f2cc`. History before that commit is the earlier platform build.

Entries are grouped by commit date, newest first. There is no version number yet.

## 30 October 2026

### Documentation

- The live release runbook tells the deploying developer to create their own Supabase
  project, apply the three migrations, and point the Vercel build at that project.
  The test project is not the live database. `config.toml` stays a localhost file
  and is not pushed to production.

## 29 October 2026

### Added

- Administration at `/admin` for a member of `public.platform_admins`: an oldest-first
  approval queue, every learner, assignment of an existing supervisor, and an
  append-only `public.admin_audit` trail (`9402394`). A supervisor still sees only
  learners assigned to them.
- A public footer, a glossary, terms of use, and a privacy page, with photographs on
  the public pages (`9402394`).
- A Husky check that requires a scoped subject and at least one bullet sentence
  (`fda3246`).
- A guide for enabling passkeys, with the relying party values stored in config
  (`dde293c`).
- A Docker image build that stops when the Supabase URL or publishable key is missing
  (`e7e3b01`).

### Changed

- Public pages use the shared design system. The per-page stylesheets are removed
  (`ee92e19`).
- The palette is derived from the logo. Readable shades carry text, and the brighter
  Canva hues are decoration. High contrast uses hero tokens and hides the homepage
  film. The display panel closes on an outside click (`2893246`, `6242248`, `9d45f86`).
- Profile editing is a wizard (`2893246`).

### Fixed

- High contrast text drawn over the homepage photograph (`6242248`).

### Documentation

- The testing guide covers the theme guard and the page smoke suites, and states that
  a new pure function needs a test beside it (`6de4dc5`).
- The documentation index lists administration and the passkey guide. The architecture
  overview, the security notes, and the pathway notes include the platform admin role
  and the public pages.

## 28 October 2026

### Added

- A Vercel rewrite so a direct link or a refresh on any route is served from
  `index.html` (`bc7f2cc`).
- Passkey sign-in. A signed-in person registers a device on Account, then signs in
  with face or fingerprint. The device checks the credential. Account lists devices,
  removes them, and signs out (`0a6eda7`).
- The learner record schema, row level security, a private document bucket, and
  `scripts/rls-check.mjs` (`5569edf`).
- The Supabase data layer, `LearnerContext`, and shared database helpers (`17d21fd`).
- Shared password and status components, an account type choice, and theme-aware
  banners (`24391f4`).
- The seven-step onboarding flow, profile editing, an adaptive dashboard, the Canva
  journey, and supervisor review (`271ac32`).
- The `extract-document` Edge Function, theme tokens, and display settings that follow
  the account across devices (`b2bf345`).
- Classified documentation for architecture, reference, features, guides, and
  operations (`d7038d9`).
- Page render smoke tests (`dddcda2`).
- A lint and test gate, and a Docker runtime for local review (`74e64fd`).

### Changed

- The local test project autoconfirms email. The document step offers each action once
  (`6440fcf`).

### Fixed

- The container health check on IPv6 (`1d06412`).
- `matchMedia` in environments that do not provide it (`dddcda2`).

### Documentation

- Code review findings and the learner-record gap analysis (`652a247`).
- The local development guide records the Cursor browser testing approach (`1d06412`).

### Tooling

- Supabase CLI temporary state is ignored (`a26a337`).
