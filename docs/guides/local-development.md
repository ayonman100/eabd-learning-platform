# Local development guide

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- Access to the Supabase project, or your own project

## First run

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only the publishable key belongs in a Vite environment file. Vite inlines these values into the
browser bundle, so a service role key in this file would be published to every visitor.

```bash
npm run dev
```

The development server prints its URL, normally http://localhost:5173.

## What happens without configuration

If the environment values are missing, `src/lib/supabase.js` exports a null client and
`isSupabaseConfigured` is false. The public pages still work. Sign-in shows "Account services are
unavailable because Supabase is not configured." This is intentional: a missing environment
should be visible, not a crash.

## Database

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`supabase/config.toml` sets the local ports and the development site URL. The files in
`supabase/migrations/` are the source of truth for the schema.

To apply them to a fresh project, `db push` is enough. It creates the tables, the
policies, the triggers, and the private storage bucket.

A live deploy uses a new Supabase project and the public site, not this machine's
`.env.local`. Follow [the live release runbook](../operations/production-rollout.md).

## Edge Function

```bash
npx supabase functions deploy extract-document
npx supabase secrets set EXTRACTION_PROVIDER=mock
```

Add `OPENAI_API_KEY` only when you are deliberately testing the real provider. See
[../reference/edge-functions-api.md](../reference/edge-functions-api.md).

## Test accounts

Create three accounts through the app:

1. A learner signing up for themself.
2. A guardian signing up for someone they support.
3. A supervisor. Sign up normally, then run the supervisor SQL in the dashboard so the account
   holds the role and is assigned to a learner.

Do not create test accounts on the production project.

## Common tasks

| Task | Where |
| --- | --- |
| Add a pathway task | `src/data/learningPaths.js` |
| Change the unlock rule | `src/utils/progress.js`, with `src/utils/progress.test.js` |
| Change a question | The matching file in `src/components/fields/` |
| Add a page | `src/pages/`, then the route table in `src/App.jsx` |
| Change a colour | All four theme blocks in `src/index.css` |
| Change a limit | `src/lib/db/documents.js` and the database constraint together |

## Checks before you push

```bash
npm run lint
npm test
npm run build
```

All three must pass. See [testing-and-quality.md](testing-and-quality.md) for what each covers.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Account services are unavailable" | The bundle was built without `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` | For `npm run dev`, fill in `.env.local` and restart. For Docker, rebuild with `docker compose --env-file .env.local up --build` |
| Sign-in works but pages stay on the loading text | The learner record query failed | Check the browser console for a safe message and confirm the migration was pushed |
| "This area is for supervisors" | The account has no `supervisors` row | Run the supervisor SQL |
| "This area is for the EABD team" | The account has no `platform_admins` row | Run the admin grant SQL |
| Upload fails with a policy error | The learner id in the path is not one you own | Sign in as the owning account |
| Document reading says the result was not reliable | The provider returned output that broke the contract | Use the mock provider, or check the function logs |
| Styles look wrong in dark mode | A hardcoded colour slipped in | Use a token from `src/index.css` |
