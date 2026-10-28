# EABD learner record: end-to-end implementation plan

Handoff plan from the EAE accelerator (Tonye). Written 28 October 2026 against
`feature/passkey-sign-in` at `0a6eda7`. An agent opened in this repository can work from this file alone.
This is a plan, not finished code: each task names files, interfaces, rules and checks. Write the code
to match. Tonye reviews after each task.

**Goal.** Turn the interactive mockup (the learner record) into the real app on Supabase: sign up as a
learner or a guardian, onboard with an optional document that suggests fields a person confirms, edit the
profile, see a dashboard shaped by the profile, run the Canva pathway, and get a supervisor's mark,
rating and review on each step.

**Architecture.** The existing Vite and React app stays. Supabase provides auth (email and passkeys,
already built), Postgres with row level security, a private storage bucket for documents, and one Edge
Function that reads a document and suggests fields. The pathway definition stays in code
(`src/data/learningPaths.js`); progress and reviews move from localStorage to the database.

**Tech stack.** Vite 7, React 19, react-router-dom 7, @supabase/supabase-js 2.118, lucide-react,
Supabase CLI (via `npx supabase`), Deno for the Edge Function, Vitest for unit tests.

## Global constraints

- Branch: `feature/learner-record`, created from `feature/passkey-sign-in`. Do not commit or push unless Tonye asks. Do not change git config.
- Env vars stay `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (already ignored by `.gitignore`). Never commit keys. The service role key never reaches the browser.
- Development runs against Tonye's test Supabase project `llkbotbnorljexhevysv` (Task 0), not Ayomide's production project. Local testing only until eyk-tonye has collaborator access.
- Health information: collect only what the record needs, store it as reported, never infer a classification level from a diagnosis, and confirm every suggested field with a person before saving.
- Diagnosis alone never changes the screen. Function levels and the learner's own settings do.
- Every interactive element is reachable by keyboard and has a visible focus state. Existing accessibility panel (`src/components/SiteHeader.jsx`, localStorage `eabd-accessibility-settings`) keeps working.
- User-facing copy: plain sentences, no em dashes, no emojis.
- Do not create accounts on the deployed Vercel site or Ayomide's Supabase project. Test accounts go in the test project only.
- Ayomide owns this codebase. Keep files small and named plainly; he will be walked through each task.

## What exists today (read before Task 1)

- Routes in `src/App.jsx`: `/`, `/about`, `/explore`, `/signin`, `/signup`, `/onboarding`, `/learning-journey`, `/dashboard` and `/account` (both inside `ProtectedRoute`).
- `src/context/AuthContext.jsx`: `signUp({ name, email, password, emailRedirectTo })` stores `full_name` in user metadata; passkey functions `signInWithPasskey`, `registerPasskey`, `listPasskeys`, `removePasskey`.
- `src/pages/Onboarding.jsx`: one form (goal, starting point, barriers, support, resources, pace, other details, a local-only file). Nothing is saved; it logs a draft and goes to the dashboard.
- `src/utils/progress.js`: progress in localStorage (`eabd-learning-progress-v1:${userId}:${pathwayId}`) with `completedTasks` and `reviewFlags`; pure helpers `getProgressSummary`, `getWeekStatus`, `updateTaskCompletion`, `flagTaskForReview`, `clearTaskReview`.
- `src/data/learningPaths.js`: one pathway, `canva-design-project`, four weeks, task IDs `w1-t1` to `w4-t3`.
- `src/pages/Dashboard.jsx` uses `dashboard-*` class names that have no CSS yet.
- Empty files: `src/components/AccessibilityControls.jsx`, `src/utils/accessibility.js`, `src/pages/NotFound.jsx`, `src/layouts/*.jsx`, `src/data/navigation.js`, `src/components/SiteFooter.jsx`.
- `eslint.config.mjs` imports Next.js presets that are not installed; `README.md` and `AGENTS.md` describe Next.js.
- The mockup this plan follows: `eae-accelerator/teams/eabd/mockup/learner-record.html` (Person: reported diagnosis, GMFCS, MACS, CFCS, vision, fatigue. Room: device with OS, dimensions, pointer and Canva app, type size, seat, who is in the room. Pathway steps with a score line, this run, the result and an access change).

## File map

```
supabase/
  config.toml                         (from `npx supabase init`)
  migrations/20261028000000_learner_record.sql
  functions/_shared/extraction-schema.ts
  functions/extract-document/index.ts
scripts/rls-check.mjs
src/lib/db/learners.js
src/lib/db/documents.js
src/lib/db/progress.js
src/lib/db/reviews.js
src/lib/db/supervisors.js
src/lib/adaptations.js               (+ adaptations.test.js)
src/lib/extraction.js                (+ extraction.test.js)
src/lib/levels.js                    (GMFCS, MACS, CFCS word pictures)
src/context/LearnerContext.jsx
src/components/fields/PersonFields.jsx
src/components/fields/RoomFields.jsx
src/components/fields/GoalFields.jsx
src/components/SupervisorRoute.jsx
src/pages/onboarding/OnboardingFlow.jsx
src/pages/onboarding/StepWho.jsx
src/pages/onboarding/StepDocument.jsx
src/pages/onboarding/StepConfirm.jsx
src/pages/onboarding/StepPerson.jsx
src/pages/onboarding/StepRoom.jsx
src/pages/onboarding/StepGoals.jsx
src/pages/onboarding/StepDisplay.jsx
src/pages/Profile.jsx
src/pages/supervisor/SupervisorHome.jsx
src/pages/supervisor/SupervisorLearner.jsx
src/utils/progress.js                (rewritten to work on database rows; + progress.test.js)
```

Modify: `src/App.jsx`, `src/context/AuthContext.jsx`, `src/pages/SignUp.jsx`, `src/pages/Dashboard.jsx`,
`src/pages/LearningJourney.jsx`, `src/components/SiteHeader.jsx`, `src/data/learningPaths.js`,
`src/index.css`, `src/styles/accessibility.css`, `package.json`, `eslint.config.mjs`, `README.md`, `AGENTS.md`.
Delete: `src/pages/Onboarding.jsx` (replaced by the flow).

---

### Task 0: Test Supabase project (Tonye)

**Local testing only.** Until Ayomide adds eyk-tonye as a collaborator, nothing is pushed and nothing
touches his Supabase project or the Vercel site. All testing runs on `http://localhost:5174` against
this test project.

State on 28 October, 08:45:

- [x] Project created in the Eykegai org. Project ref `llkbotbnorljexhevysv`, URL `https://llkbotbnorljexhevysv.supabase.co`.
- [x] `.env.local` written with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (git-ignored by `.env*`).
      Restart the dev server so Vite reads it: stop any running `vite --port 5174`, then `npx vite --port 5174 --strictPort`.
- [x] Checked through `GET /auth/v1/settings`: email sign-in on, sign-up open, email confirmation required (`mailer_autoconfirm: false`), passkeys off (`passkeys_enabled: false`).

Still to do in the dashboard (Tonye, or the agent asks Tonye to):

- [ ] Authentication, URL configuration: Site URL `http://localhost:5174`; redirect URLs `http://localhost:5174/**` and `http://localhost:5173/**`.
- [ ] Email confirmation: turn it off for this test project, or accept the built-in mailer's low hourly limit.
- [ ] Enable passkeys (WebAuthn), with `localhost` as the relying party. Check the exact setting names in the dashboard; they are not assumed here. Re-check `passkeys_enabled` afterwards.
- [ ] For Task 2, `npx supabase login` (opens a browser) and `npx supabase link --project-ref llkbotbnorljexhevysv` (asks for the database password Tonye set).
- [ ] Create three test accounts later through the local app: a learner signing up for themself, a guardian, and a supervisor.

### Task 1: Tooling that works

**Files:** modify `package.json`, `eslint.config.mjs`, `README.md`, `AGENTS.md`.

- [ ] Replace `eslint.config.mjs` with a flat config for Vite and React: `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`. Add `"lint": "eslint ."`.
- [ ] Add Vitest with jsdom: `"test": "vitest run"`, `"test:watch": "vitest"`.
- [ ] Add `supabase` as a dev dependency so `npx supabase` is pinned.
- [ ] Rewrite `README.md` and `AGENTS.md` for Vite and Supabase: how to run, the env vars, where the plan lives. Remove the Next.js text.
- [ ] Check: `npm run lint`, `npm test` (no tests yet is fine), `npm run build` all succeed.

### Task 2: Database, row level security, storage

**Files:** create `supabase/config.toml` (`npx supabase init`), `supabase/migrations/20261028000000_learner_record.sql`, `scripts/rls-check.mjs`.

**Produces:** the tables and functions every later task uses. Column names below are the contract.

The migration, in full:

```sql
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  account_type text not null default 'learner' check (account_type in ('learner', 'guardian')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supervisors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.learners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  relationship text not null check (relationship in ('self', 'parent', 'guardian', 'carer', 'other')),
  first_name text not null check (length(trim(first_name)) > 0),
  guardian_consent_at timestamptz,
  reported_diagnosis text,
  gmfcs smallint check (gmfcs between 1 and 5),
  macs smallint check (macs between 1 and 5),
  cfcs smallint check (cfcs between 1 and 5),
  vision text,
  fatigue text,
  device text,
  device_os text,
  screen text,
  pointer text,
  canva_surface text check (canva_surface in ('app', 'browser')),
  seat text,
  who_in_room text,
  goal text,
  starting_point text,
  barriers text,
  support text,
  resources text,
  learning_pace text check (learning_pace in ('guided', 'flexible', 'independent')),
  other_details text,
  ui_settings jsonb not null default '{}'::jsonb,
  onboarding_step text not null default 'who',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guardian_needs_consent check (relationship = 'self' or guardian_consent_at is not null)
);
create unique index learners_one_self_record on public.learners (owner_id) where relationship = 'self';

create table public.learner_supervisors (
  learner_id uuid not null references public.learners(id) on delete cascade,
  supervisor_id uuid not null references public.supervisors(user_id) on delete cascade,
  primary key (learner_id, supervisor_id)
);

create table public.learner_documents (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid not null references auth.users(id),
  processing_consent_at timestamptz not null,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'extracted', 'failed', 'confirmed', 'discarded')),
  extracted jsonb,
  extraction_error text,
  extracted_at timestamptz,
  confirmed_at timestamptz,
  file_deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.task_progress (
  learner_id uuid not null references public.learners(id) on delete cascade,
  pathway_id text not null,
  task_id text not null,
  status text not null default 'started' check (status in ('started', 'submitted', 'reviewed')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  design_link text,
  learner_note text,
  updated_at timestamptz not null default now(),
  primary key (learner_id, pathway_id, task_id)
);

create table public.task_reviews (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  pathway_id text not null,
  task_id text not null,
  reviewer_id uuid not null references auth.users(id),
  marked_done boolean not null,
  rating smallint not null check (rating between 1 and 5),
  review text not null check (length(trim(review)) > 0),
  access_change text,
  created_at timestamptz not null default now()
);
create index task_reviews_lookup on public.task_reviews (learner_id, pathway_id, task_id, created_at desc);

-- Helpers. Security definer so policies do not recurse through learners' own RLS.
create or replace function public.is_supervisor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from supervisors where user_id = auth.uid());
$$;

create or replace function public.owns_learner(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from learners where id = target and owner_id = auth.uid());
$$;

create or replace function public.supervises_learner(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from learner_supervisors where learner_id = target and supervisor_id = auth.uid());
$$;

-- Profile row on sign-up, from user metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, account_type)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'account_type' = 'guardian' then 'guardian' else 'learner' end
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- A review sets the step's status. Marked done: reviewed. Not yet: back to started.
create or replace function public.apply_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into task_progress (learner_id, pathway_id, task_id, status, updated_at)
  values (new.learner_id, new.pathway_id, new.task_id,
          case when new.marked_done then 'reviewed' else 'started' end, now())
  on conflict (learner_id, pathway_id, task_id)
  do update set status = excluded.status, updated_at = now();
  return new;
end;
$$;
create trigger on_task_review after insert on public.task_reviews
  for each row execute function public.apply_review();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger learners_touch before update on public.learners for each row execute function public.touch_updated_at();
create trigger task_progress_touch before update on public.task_progress for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.supervisors enable row level security;
alter table public.learners enable row level security;
alter table public.learner_supervisors enable row level security;
alter table public.learner_documents enable row level security;
alter table public.task_progress enable row level security;
alter table public.task_reviews enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Supervisors are added in the SQL editor only. A user can see whether they are one.
create policy "see own supervisor row" on public.supervisors for select to authenticated using (user_id = auth.uid());

create policy "learner read" on public.learners for select to authenticated
  using (owner_id = auth.uid() or public.supervises_learner(id));
create policy "learner insert" on public.learners for insert to authenticated with check (owner_id = auth.uid());
create policy "learner update" on public.learners for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "learner delete" on public.learners for delete to authenticated using (owner_id = auth.uid());

create policy "assignment read" on public.learner_supervisors for select to authenticated
  using (supervisor_id = auth.uid() or public.owns_learner(learner_id));

-- Documents: the owner only. Supervisors see the confirmed fields on the learner row.
create policy "document read" on public.learner_documents for select to authenticated using (public.owns_learner(learner_id));
create policy "document insert" on public.learner_documents for insert to authenticated
  with check (public.owns_learner(learner_id) and uploaded_by = auth.uid());
create policy "document update" on public.learner_documents for update to authenticated
  using (public.owns_learner(learner_id)) with check (public.owns_learner(learner_id));
create policy "document delete" on public.learner_documents for delete to authenticated using (public.owns_learner(learner_id));

create policy "progress read" on public.task_progress for select to authenticated
  using (public.owns_learner(learner_id) or public.supervises_learner(learner_id));
create policy "progress insert" on public.task_progress for insert to authenticated
  with check (public.owns_learner(learner_id) and status in ('started', 'submitted'));
create policy "progress update" on public.task_progress for update to authenticated
  using (public.owns_learner(learner_id) and status <> 'reviewed')
  with check (public.owns_learner(learner_id) and status in ('started', 'submitted'));

-- Reviews are append-only. The newest review for a step is the current one.
create policy "review read" on public.task_reviews for select to authenticated
  using (public.owns_learner(learner_id) or public.supervises_learner(learner_id));
create policy "review insert" on public.task_reviews for insert to authenticated
  with check (reviewer_id = auth.uid() and public.supervises_learner(learner_id));

-- Storage: private bucket, path `<learner_id>/<uuid>-<file name>`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learner-documents', 'learner-documents', false, 10485760,
        array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "owner reads documents" on storage.objects for select to authenticated
  using (bucket_id = 'learner-documents' and public.owns_learner(((storage.foldername(name))[1])::uuid));
create policy "owner uploads documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'learner-documents' and public.owns_learner(((storage.foldername(name))[1])::uuid));
create policy "owner deletes documents" on storage.objects for delete to authenticated
  using (bucket_id = 'learner-documents' and public.owns_learner(((storage.foldername(name))[1])::uuid));
```

Supervisor setup, run by Tonye in the SQL editor after the supervisor account exists:

```sql
insert into public.supervisors (user_id) select id from auth.users where email = '<supervisor email>';
insert into public.learner_supervisors (learner_id, supervisor_id)
select l.id, s.user_id from public.learners l, public.supervisors s
where l.first_name = '<learner first name>' and s.user_id = (select id from auth.users where email = '<supervisor email>');
```

- [ ] `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`.
- [ ] Write `scripts/rls-check.mjs` (Node, supabase-js, reads `RLS_*` emails and passwords from env). Signs in as learner A, learner B, and the supervisor, and asserts:
  1. A reads A's learner row; B gets zero rows for A's learner.
  2. B cannot insert a `learner_documents` row or upload to `learner-documents/<A's learner id>/...`.
  3. A cannot insert `task_progress` with status `reviewed`, and cannot insert into `task_reviews`.
  4. The supervisor reads A's learner and progress only after the assignment row exists, cannot read A's documents, and can insert a review; the review sets `task_progress.status` to `reviewed`.
  5. Nobody can insert into `supervisors` from the client.
- [ ] Check: `node scripts/rls-check.mjs` prints each assertion as pass. Paste the output into the task report.

### Task 3: Data layer and the learner context

**Files:** create `src/lib/db/*.js`, `src/context/LearnerContext.jsx`; modify `src/App.jsx`, `src/context/AuthContext.jsx`.

**Produces** (all async, all throw `Error` with a message safe to show the user; the raw Supabase error goes to `console.error` only):

- `learners.js`: `getMyLearner(): Learner | null` (the self record, or the guardian's first record); `createLearner({ relationship, firstName, guardianConsent }): Learner`; `updateLearner(id, patch): Learner` (patch keys are column names); `getLearner(id): Learner`; `listSupervisedLearners(): Array<{ id, first_name, awaitingReview: number }>`.
- `documents.js`: `uploadLearnerDocument(learnerId, file): LearnerDocument` (validates type and 10 MB before upload, sets `processing_consent_at`); `requestExtraction(documentId): LearnerDocument`; `confirmExtraction(documentId, acceptedFields, { deleteFile }): void` (writes accepted fields to the learner, sets status `confirmed`, and when `deleteFile` removes the storage object and sets `file_deleted_at`); `discardExtraction(documentId): void`.
- `progress.js`: `listTaskProgress(learnerId, pathwayId): TaskProgress[]`; `startTask(learnerId, pathwayId, taskId): TaskProgress` (upsert, keeps an existing `submitted`); `submitTask(learnerId, pathwayId, taskId, { designLink, note }): TaskProgress`.
- `reviews.js`: `listReviews(learnerId, pathwayId): TaskReview[]` (newest first); `createReview({ learnerId, pathwayId, taskId, markedDone, rating, review, accessChange }): TaskReview`.
- `supervisors.js`: `isSupervisor(): boolean`.
- `LearnerContext.jsx`: `useLearner()` returns `{ learner, loading, error, refresh, save(patch) }`. Loaded once per session after sign-in.
- `AuthContext.signUp` gains `accountType` (`'learner' | 'guardian'`), stored as `account_type` in user metadata next to `full_name`.

- [ ] Check: sign in on the test project, open the console, `getMyLearner()` returns `null` for a new account without errors.

### Task 4: Sign-up for yourself or for someone you support

**Files:** modify `src/pages/SignUp.jsx`.

- [ ] A required radio group before the name field: "Who is this account for?" with "Myself" and "Someone I support (parent, guardian or carer)".
- [ ] For a guardian, the name field label reads "Your name"; the learner's name is asked in onboarding.
- [ ] Pass `accountType` to `signUp`. Redirect to `/onboarding` as today, keeping `?pathway=`.
- [ ] Check: both account types create a `profiles` row with the right `account_type`.

### Task 5: Onboarding, one question group per screen

**Files:** create `src/pages/onboarding/*`, `src/components/fields/*`, `src/lib/levels.js`; delete `src/pages/Onboarding.jsx`; modify `src/App.jsx` (`/onboarding` inside `ProtectedRoute`).

Flow, saved after every step to `learners.onboarding_step` so a refresh or a new device resumes where they stopped:

1. **Who** (`StepWho`). Self: first name prefilled from `full_name`, relationship `self`. Guardian: learner's first name, relationship (parent, guardian, carer, other), and a required checkbox: "I am this person's parent, guardian or carer, and I have their agreement to share this information." Creates the learner row.
2. **Document** (`StepDocument`), optional. Task 7 fills this in; for now a "Skip" button only.
3. **Confirm** (`StepConfirm`). Task 7.
4. **Person** (`StepPerson`, uses `PersonFields`). Reported diagnosis (free text, labelled "As it was told to you"), GMFCS, MACS, CFCS as word-picture choices with "Not sure" (stores null), vision, fatigue.
5. **Room** (`StepRoom`, uses `RoomFields`). Device, OS, screen size, pointer ("How do you point and tap?"), Canva app or browser, seat, who is in the room.
6. **Goals** (`StepGoals`, uses `GoalFields`). The questions from today's onboarding: goal (required), starting point, barriers, support, resources, pace (guided, flexible, independent), anything else.
7. **Display** (`StepDisplay`). Shows the settings Task 8 derives, lets them change any, then "Go to my dashboard" sets `onboarding_completed_at`.

`src/lib/levels.js` exports the word pictures, one line each, used as option labels:

- GMFCS: 1 walks without limitations; 2 walks with limitations; 3 walks using a hand-held mobility device; 4 self-mobility with limitations, may use powered mobility; 5 transported in a manual wheelchair.
- MACS: 1 handles objects easily and successfully; 2 handles most objects, with somewhat reduced quality or speed; 3 handles objects with difficulty, needs help to prepare or modify activities; 4 handles a limited selection of easily managed objects in adapted situations; 5 does not handle objects.
- CFCS: 1 effective sender and receiver with unfamiliar and familiar partners; 2 effective but slower with unfamiliar or familiar partners; 3 effective with familiar partners; 4 inconsistent with familiar partners; 5 seldom effective even with familiar partners.

Rules: one primary button per screen ("Next" or "Save and continue"), "Back" always available, a step counter ("Step 3 of 7"), errors in `role="alert"`, focus moves to the step heading on each step change.

- [ ] Check: a guardian completes onboarding without a document; the learner row has every field entered; refresh mid-flow resumes on the same step.

### Task 6: Profile editing

**Files:** create `src/pages/Profile.jsx`; modify `src/App.jsx` (`/profile` inside `ProtectedRoute`), `src/pages/Dashboard.jsx` (link "Edit profile").

- [ ] Three sections reusing `PersonFields`, `RoomFields`, `GoalFields`, each with its own Save button and a status message after saving.
- [ ] A fourth section, Display, the same controls as onboarding step 7.
- [ ] A guardian sees "Profile for <first name>" in the heading.
- [ ] Check: edit one field per section, reload, values persist.

### Task 7: Upload a document, suggest fields, a person confirms

**Files:** create `supabase/functions/_shared/extraction-schema.ts`, `supabase/functions/extract-document/index.ts`, `src/lib/extraction.js` (+ test); fill in `StepDocument.jsx`, `StepConfirm.jsx`.

Extraction contract (the Edge Function returns and stores this in `learner_documents.extracted`):

```json
{
  "fields": {
    "reported_diagnosis": { "value": "Spastic diplegic cerebral palsy", "evidence": "Diagnosis: spastic diplegic cerebral palsy" },
    "gmfcs": { "value": 3, "evidence": "GMFCS level III" },
    "macs": null,
    "cfcs": null,
    "vision": null,
    "fatigue": { "value": "Tires after about 20 minutes of fine motor work", "evidence": "..." },
    "support": { "value": "Larger touch targets; extra time", "evidence": "Recommendations: ..." }
  }
}
```

Allowed keys: `reported_diagnosis`, `gmfcs`, `macs`, `cfcs`, `vision`, `fatigue`, `support`. Levels are integers 1 to 5. `evidence` is a short quote copied from the document. A field with no explicit statement is `null`.

Edge Function behaviour:

- POST `{ documentId }` with the user's `Authorization` header. Read the row with a client built from that header (RLS proves ownership). Download the file with the service role client.
- `EXTRACTION_PROVIDER` secret: `mock` returns a fixed sample (the Chinedu sample from the mockup: cerebral palsy as reported, GMFCS 3, MACS 3, CFCS 2) so the whole flow works without a paid key. A real provider is added only after Tonye chooses one (open decision below).
- Instructions to the model: use only the document; copy evidence verbatim; return null when a field is not stated; never derive GMFCS, MACS or CFCS from a diagnosis; no other keys.
- Validate the response against the shared schema. Invalid or failed: status `failed` with a short `extraction_error`. Valid: status `extracted`, `extracted_at` set.
- Never log document text or extracted values.

Screens:

- `StepDocument`: what the document is used for, a required checkbox "I agree to send this document to be read so the app can suggest answers. Nothing is saved to the profile until I confirm it.", file input (PDF, PNG, JPG, up to 10 MB), "Upload and read", a status line while reading, and "Skip, I will type the answers".
- `StepConfirm`: one row per suggested field showing the value and the quoted evidence, with Accept, Edit, or Leave out. A checkbox, on by default: "Delete the document after I confirm". "Confirm and continue" calls `confirmExtraction` and moves to Person with the accepted values prefilled.
- `src/lib/extraction.js` exports `EXTRACTABLE_FIELDS` and `validateExtraction(json) -> { ok, fields, errors }`, mirroring the shared schema for display.

Tests (`src/lib/extraction.test.js`): accepts the sample above; rejects an unknown key; rejects `gmfcs: 6`; rejects a field with a value but empty evidence; treats a missing key as null.

- [ ] `npx supabase functions deploy extract-document`, `npx supabase secrets set EXTRACTION_PROVIDER=mock`.
- [ ] Check: upload a PDF, see the mock suggestions with evidence, accept two, leave one out, confirm with delete on; the learner row has the two values; the storage object is gone; `file_deleted_at` is set.

### Task 8: A dashboard shaped by the profile

**Files:** create `src/lib/adaptations.js` (+ test); modify `src/components/SiteHeader.jsx`, `src/styles/accessibility.css`, `src/pages/Dashboard.jsx`, `src/index.css`.

**Produces:**

```js
// Settings the screen uses. Same keys as the accessibility panel, plus three new ones.
// { textSize: 'default'|'large'|'larger', highContrast, extraSpacing, reducedMotion,
//   targetSize: 'standard'|'large'|'extra-large', oneThingAtATime, extraTime }
export function deriveAdaptations(learner) { /* rules below */ }
export function resolveSettings(derived, overrides) { /* overrides win, key by key */ }
```

Rules for `deriveAdaptations` (diagnosis is never read):

| Input | Setting |
| --- | --- |
| MACS 3 | `targetSize: 'large'`, `extraSpacing: true` |
| MACS 4 or 5 | `targetSize: 'extra-large'`, `extraSpacing: true`, `oneThingAtATime: true` |
| `pointer` mentions pinch, drag, tremor or switch (case-insensitive) | at least `targetSize: 'large'` |
| CFCS 3 to 5 | `oneThingAtATime: true` |
| `vision` mentions low vision or glare | `textSize: 'large'`, `highContrast: true` |
| `fatigue` is filled | `extraTime: true` |

Tests (`src/lib/adaptations.test.js`), using the mockup's sample learners:

- Adaeze (MACS 2, pointer "One finger", vision "Glasses for close work", fatigue filled): `targetSize: 'standard'`, `highContrast: false`, `extraTime: true`.
- Chinedu (MACS 3, pointer "Finger. Pinch to select fails."): `targetSize: 'large'`, `extraSpacing: true`.
- Fatima (cerebral palsy as reported, MACS 1): `targetSize: 'standard'`. The diagnosis does not change the screen.
- An override `{ targetSize: 'standard' }` beats a derived `'large'` in `resolveSettings`.

Screen:

- `SiteHeader` applies the resolved settings: existing `a11y-*` classes plus `a11y-targets-large` and `a11y-targets-xl`. Overrides save to both `learners.ui_settings` and the existing localStorage key, so the panel keeps working before sign-in.
- `accessibility.css`: buttons, links styled as buttons, inputs and selects get a minimum target of 64 by 64 px for large and 88 by 88 px for extra-large, with spacing to match.
- `Dashboard.jsx`: with `oneThingAtATime`, one large card "Your next step" with the task, its instruction and "Start in Canva". Otherwise the week overview. Both show the newest supervisor feedback (rating and review) when there is one. Add the missing `dashboard-*` CSS.

- [ ] Check: Chinedu's profile shows large targets; Fatima's shows standard; changing the panel overrides and persists across reloads and devices.

### Task 9: The Canva pathway, with progress in the database

**Files:** modify `src/data/learningPaths.js`, `src/utils/progress.js` (+ test), `src/pages/LearningJourney.jsx`.

- [ ] Each task gains `canvaUrl` (use `https://www.canva.com/` unless Ayomide has a specific template link) and `reviewPrompt` (what the supervisor checks, one sentence, written with Ayomide).
- [ ] Rewrite `progress.js` as pure functions over database rows, no localStorage:
      `getProgressSummary(pathway, rows)`, `getWeekStatus(pathway, rows, weekIndex)`, `getNextTask(pathway, rows)`.
      A week is available when every task in the previous week is `submitted` or `reviewed`. A task sent back by a review returns to `started`.
- [ ] "Start in Canva": `startTask`, then `window.open(task.canvaUrl, '_blank', 'noopener,noreferrer')`.
- [ ] When the page regains focus after a start, show "Back from Canva?" with an optional design link field and "Send for review", which calls `submitTask`.
- [ ] Remove the old localStorage progress code and keys.
- Tests (`src/utils/progress.test.js`): week 1 available with no rows; week 2 locked until all week 1 tasks are submitted; a `started` task after a "not yet" review keeps week 2 locked; summary counts reviewed tasks as complete.
- [ ] Check: start a task, Canva opens in a new tab, come back, submit with a link; the row is `submitted`.

### Task 10: Supervisor marks, rates and reviews

**Files:** create `src/components/SupervisorRoute.jsx`, `src/pages/supervisor/SupervisorHome.jsx`, `src/pages/supervisor/SupervisorLearner.jsx`; modify `src/App.jsx` (`/supervisor`, `/supervisor/learners/:learnerId`).

- [ ] `SupervisorRoute`: signed in and `isSupervisor()`, otherwise a short message and a link home.
- [ ] Home: assigned learners with the number of steps awaiting review.
- [ ] Learner page, laid out like the mockup: Person and Room (read-only), then the pathway by week. Each submitted step shows the learner's design link and note, the `reviewPrompt`, and a form: "Done" or "Not yet" (required), rating 1 to 5 (required, buttons labelled 1 to 5 with a text legend), review (required), access change (optional, "What changed so the step could be done").
- [ ] Submitting calls `createReview`; the step's status updates through the database trigger. Earlier reviews show below the form, newest first.
- [ ] Check: as the supervisor, review one step "Done" with 4 and a sentence; as the learner, the dashboard shows that feedback and the step counts as complete; review another "Not yet"; the learner can resubmit it.

### Task 11: End to end, then production notes

- [ ] Rehearse the test with three accounts: guardian signs up, onboards with the mock document, edits one profile field, the dashboard shows large targets, starts and submits one Canva step; the supervisor reviews it; the learner sees the feedback. Then sign in with a passkey on the same account.
- [ ] Record each step as a screenshot for Ayomide's before and after.
- [ ] Production notes for Tonye and Ayomide (do not apply): apply the migration to Ayomide's project; set Vercel env vars; add the Vercel domain to Supabase redirect URLs and as the passkey relying party; choose and configure the extraction provider; add supervisors by SQL.

## Open decisions (Tonye)

1. **Extraction provider** for real documents, and its data retention terms for health documents. Until then, `mock`.
2. **Supervisors**: who they are for the test (Ayomide, the therapist) and which learners each one sees.
3. **Under-18 learners signing up for themselves**: allowed with a guardian's consent recorded offline, or guardian accounts only for the test. The test with Ayomide's brother needs written parental consent either way.
4. **Pathway week unlock**: on submission (this plan, so a slow review does not block the learner) or only after a "Done" review.

## Self-review

- Every part of the request maps to a task: onboarding with a document (5, 7), profile editing (6), a dashboard shaped by the disability (8), the Canva pathway and redirect (9), the supervisor's manual mark with a rating and a review (10), our own Supabase project for end-to-end testing (0, 2, 11).
- Names used across tasks: `learners`, `learner_documents`, `task_progress`, `task_reviews`, `learner_supervisors`, `supervisors`; `deriveAdaptations`, `resolveSettings`; `startTask`, `submitTask`, `createReview`; `validateExtraction`. Column names in code match the migration.
