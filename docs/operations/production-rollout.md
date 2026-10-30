# Live release runbook

Follow this when deploying EABD to a public URL. The person deploying uses a Supabase
project they own. The schema comes from this repository. The test database is not the
live database.

Nothing here should be run against a project that already holds real learner records
unless the project owner is present and a backup has been taken.

## Do not use the test project

Local testing used Supabase project `llkbotbnorljexhevysv`. That database holds test
accounts and test learners. Leave it alone.

The live site needs a new, empty project in the deploying person's own Supabase
account.

- Do not copy `.env.local` from the test machine.
- Do not put the test project URL or publishable key in Vercel.
- Do not dump the test database and restore it into production. `db push` creates the
  same tables, policies, triggers, and private bucket. It does not copy users,
  learners, reviews, documents, or the test admin account.

`supabase/config.toml` is the local development config. Its site URL is
`http://localhost:8080`, email confirmation is off, and the passkey relying party is
`localhost`. Do not run `npx supabase config push` against the live project. Set the
live auth values in the dashboard, as below.

## Before you start

Have ready:

- This branch, `feature/learner-record`, until it is merged. That branch contains all
  three files in `supabase/migrations/`. An older checkout stops after the first seven
  tables.
- A new empty Supabase project: its project reference, API URL, publishable key, and
  the database password chosen when the project was created.
- Access to the Vercel project that serves the site.
- The live domain, with HTTPS, for example `https://eabd.example.org`.
- The decision on the extraction provider, including its data processing terms.
- The email address of the first administrator, and the list of supervisors.
- Written consent arrangements for any under-18 learner.

## 1. Put the schema on your project

```bash
git checkout feature/learner-record
git pull
npm install
npx supabase login
npx supabase link --project-ref <your production ref>
```

`login` opens a browser for the Supabase account that owns the new project. `link`
asks for that project's database password.

Before the next command, open the dashboard for `<your production ref>` and confirm
the project name is the new empty one. The test reference `llkbotbnorljexhevysv` must
not be the linked project.

```bash
npx supabase db push
```

That applies these files, in this order:

1. `supabase/migrations/20261028000000_learner_record.sql`
2. `supabase/migrations/20261029100000_platform_admin.sql`
3. `supabase/migrations/20261029120000_supervisors_profile_fk.sql`

A later `db push` skips files that are already recorded. It does not rebuild tables
or copy rows.

Confirm in the dashboard:

- These nine tables exist, and row level security is enabled on each one:
  `profiles`, `supervisors`, `learners`, `learner_supervisors`, `learner_documents`,
  `task_progress`, `task_reviews`, `platform_admins`, `admin_audit`.
- The view `admin_approval_queue` exists.
- The bucket `learner-documents` exists, is private, and allows only PDF, PNG, and
  JPEG up to 10 MB.
- The trigger `on_auth_user_created` exists on `auth.users`.

If a table from that list is missing, stop. Do not create it by hand in the SQL
editor. Fix the migration and push again.

## 2. Authentication for the live domain

In the new project's dashboard, under Authentication:

| Setting | Live value |
| --- | --- |
| Site URL | `https://<your domain>` |
| Redirect URLs | `https://<your domain>/**` |
| Email confirmation | On |
| Password minimum | 8 characters or more |

Passkeys stay off until they are set on this project. Use the live domain, not
`localhost`. The relying party id is the bare host, for example `eabd.example.org`,
with no scheme and no port. The origin is `https://<your domain>`. Set this before
anyone enrols a device. Changing it later invalidates every passkey.

The dashboard path and the exact fields are in
[the passkey guide](../guides/enabling-passkeys.md). `db push` cannot turn passkeys on.

## 3. Point the live site at your project

The production host is Vercel. `vercel.json` sends every path to `index.html`, so a
refresh on `/admin` or `/glossary` still loads the app.

In the Vercel project, for the production environment, set:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<your production ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The publishable key from that same project |

Never add a service role key. Vite writes these values into the browser bundle.

Deploy the branch that contains the three migrations. Redeploy after changing either
variable. A build made with the test project's values will keep talking to the test
database even after the live schema exists.

## 4. Edge Function

```bash
npx supabase functions deploy extract-document --project-ref <your production ref>
npx supabase secrets set EXTRACTION_PROVIDER=<mock or the chosen provider> --project-ref <your production ref>
```

Use `mock` until the extraction provider and its retention terms are agreed in
writing. If a real provider is chosen, also set `OPENAI_API_KEY` before any health
document is uploaded.

## 5. First administrator

Sign up on the live site with the administrator's email and confirm the message.
Then, in that project's SQL editor:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = '<admin email>';
```

Sign in on the live site, open `/admin`, and confirm the approval queue, the learner
list, and the activity tab. The queue is empty until a learner sends a step.

If the page says the area is for the EABD team, the signed-in email has no row in
`platform_admins`.

There is no client control that grants this role. Details are in
[administration](../reference/administration.md).

## 6. Supervisors

Each supervisor signs up on the live site and confirms their email. Then run the
supervisor inserts from
[the schema reference](../reference/database-schema.md#supervisor-provisioning).

An administrator can assign an existing supervisor from the Learners tab. Granting
the supervisor role itself is still the SQL insert. Check that the supervisor can
open `/supervisor` and cannot open another learner's record.

## 7. Check the policies

Create three temporary accounts on the live project through the site: two learners
and one supervisor. Put their details in `scripts/.env` (that file stays
uncommitted):

```
SUPABASE_URL=https://<your production ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key>
RLS_LEARNER_A_EMAIL=
RLS_LEARNER_A_PASSWORD=
RLS_LEARNER_B_EMAIL=
RLS_LEARNER_B_PASSWORD=
RLS_SUPERVISOR_EMAIL=
RLS_SUPERVISOR_PASSWORD=
```

Assign the supervisor to learner A with the SQL in the schema reference, then:

```bash
node scripts/rls-check.mjs
```

The eleven assertions are listed in
[the testing guide](../guides/testing-and-quality.md#the-rls-check). If any assertion
fails, stop and do not invite a real learner.

Delete the three temporary accounts from Authentication in the dashboard after the
check passes.

## 8. Smoke test on the live URL

1. Sign up as a learner and complete onboarding.
2. Open a pathway step and submit it.
3. Sign in as the administrator. The step appears in `/admin`.
4. Sign in as the supervisor and review it.
5. Sign back in as the learner and confirm the feedback is visible.
6. Add a passkey and sign in with it.
7. Turn on high contrast and the largest target size, and confirm every control is usable.

## What the live project does not receive

| Stays on the test project | Created again on the live project |
| --- | --- |
| Test users and their passwords | People sign up on the live site |
| Learner rows, progress, and reviews | Empty tables until someone uses the site |
| The test admin `eabd.admin.test@gmail.com` | The insert in section 5, using the live email |
| Uploaded documents | The private bucket, with no files in it |
| Passkeys enrolled against `localhost` | A new enrolment after the live relying party is set |

## Rollback

| Situation | Action |
| --- | --- |
| The migration is wrong | Restore the database from the backup taken before the push, then fix forward with a new migration |
| The Edge Function is misbehaving | `npx supabase functions delete extract-document --project-ref <your production ref>`. Onboarding then falls back to typing answers |
| A policy is too permissive | Revert the policy in a new migration, push it, and re-run the RLS check |
| The site still calls the test project | Replace the two Vercel variables with the live project values and redeploy |
| The bundle is broken | Redeploy the previous Vercel build |

Deleting a document from storage is irreversible. The browser only does that after a
person confirms their suggestions.

## Privacy checks before inviting a real learner

- [ ] The live Vercel build uses the new project URL, not `llkbotbnorljexhevysv`.
- [ ] Email confirmation is on, and the site URL is the live HTTPS domain.
- [ ] The extraction provider decision is recorded, with retention terms attached.
- [ ] Consent arrangements for the learner are recorded offline.
- [ ] The administrator and supervisor list is confirmed, and each assignment is deliberate.
- [ ] The RLS check passed, and the temporary accounts were deleted.
- [ ] Document deletion on confirm has been observed working at least once on the live site.

## Ongoing checks

| Cadence | Check |
| --- | --- |
| After every deploy | Run the smoke test above |
| After every schema change | `npx supabase db push` against the live project, then the RLS check |
| Monthly | Review `platform_admins`, `supervisors`, and `learner_supervisors` for anyone who should no longer have access |
| Monthly | Confirm no document has been retained past its confirmation without a reason |
| Per change | `npm run lint`, `npm test`, `npm run build`, and the RLS check |
