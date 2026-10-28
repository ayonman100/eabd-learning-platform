-- EABD learner record: schema, triggers, row level security, and private storage.
--
-- Design notes:
--   * A learner row belongs to an auth user (the owner). The owner is either the
--     learner themself (relationship 'self') or the adult who supports them.
--   * Supervisors are created in the SQL editor only. They read learner records
--     they are assigned to and they write reviews. They never see documents.
--   * Reviews are append-only. A trigger copies the outcome onto task_progress so
--     the learner-facing progress table stays cheap to read.
--   * Every policy helper is SECURITY DEFINER so policies do not recurse through
--     the row level security of the tables they inspect.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  account_type text not null default 'learner'
    check (account_type in ('learner', 'guardian')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supervisors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.learners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  relationship text not null
    check (relationship in ('self', 'parent', 'guardian', 'carer', 'other')),
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
  learning_pace text
    check (learning_pace in ('guided', 'flexible', 'independent')),
  other_details text,
  ui_settings jsonb not null default '{}'::jsonb,
  onboarding_step text not null default 'who',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guardian_needs_consent
    check (relationship = 'self' or guardian_consent_at is not null)
);

-- One self record per owner. Guardians may hold more than one learner.
create unique index learners_one_self_record
  on public.learners (owner_id)
  where relationship = 'self';

create index learners_owner_idx on public.learners (owner_id);

create table public.learner_supervisors (
  learner_id uuid not null references public.learners (id) on delete cascade,
  supervisor_id uuid not null references public.supervisors (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (learner_id, supervisor_id)
);

create index learner_supervisors_supervisor_idx
  on public.learner_supervisors (supervisor_id);

create table public.learner_documents (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null
    check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  size_bytes integer not null
    check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid not null references auth.users (id),
  processing_consent_at timestamptz not null,
  extraction_status text not null default 'pending'
    check (extraction_status in
      ('pending', 'extracted', 'failed', 'confirmed', 'discarded')),
  extracted jsonb,
  extraction_error text,
  extracted_at timestamptz,
  confirmed_at timestamptz,
  file_deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index learner_documents_learner_idx
  on public.learner_documents (learner_id);

create table public.task_progress (
  learner_id uuid not null references public.learners (id) on delete cascade,
  pathway_id text not null,
  task_id text not null,
  status text not null default 'started'
    check (status in ('started', 'submitted', 'reviewed')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  design_link text,
  learner_note text check (learner_note is null or char_length(learner_note) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (learner_id, pathway_id, task_id)
);

create table public.task_reviews (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  pathway_id text not null,
  task_id text not null,
  reviewer_id uuid not null references auth.users (id),
  marked_done boolean not null,
  rating smallint not null check (rating between 1 and 5),
  review text not null check (length(trim(review)) > 0),
  access_change text,
  created_at timestamptz not null default now()
);

create index task_reviews_lookup
  on public.task_reviews (learner_id, pathway_id, task_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Policy helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from supervisors where user_id = auth.uid()
  );
$$;

create or replace function public.owns_learner(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from learners where id = target and owner_id = auth.uid()
  );
$$;

create or replace function public.supervises_learner(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from learner_supervisors
    where learner_id = target and supervisor_id = auth.uid()
  );
$$;

-- Storage paths are "<learner_id>/<file>". Compare as text so a malformed
-- folder name denies access instead of raising a cast error.
create or replace function public.owns_learner_path(target text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from learners
    where id::text = target and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Every auth user gets a profile row. The account type is chosen at sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, account_type)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case
      when new.raw_user_meta_data ->> 'account_type' = 'guardian' then 'guardian'
      else 'learner'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A review sets the step status. Marked done: reviewed. Not yet: back to started.
create or replace function public.apply_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into task_progress (learner_id, pathway_id, task_id, status, updated_at)
  values (
    new.learner_id,
    new.pathway_id,
    new.task_id,
    case when new.marked_done then 'reviewed' else 'started' end,
    now()
  )
  on conflict (learner_id, pathway_id, task_id)
    do update set status = excluded.status, updated_at = now();
  return new;
end;
$$;

create trigger on_task_review
  after insert on public.task_reviews
  for each row execute function public.apply_review();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger learners_touch
  before update on public.learners
  for each row execute function public.touch_updated_at();

create trigger task_progress_touch
  before update on public.task_progress
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.supervisors enable row level security;
alter table public.learners enable row level security;
alter table public.learner_supervisors enable row level security;
alter table public.learner_documents enable row level security;
alter table public.task_progress enable row level security;
alter table public.task_reviews enable row level security;

create policy "own profile read"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "own profile update"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Supervisors are added in the SQL editor only. A user can see whether they are one.
create policy "see own supervisor row"
  on public.supervisors for select to authenticated
  using (user_id = auth.uid());

create policy "learner read"
  on public.learners for select to authenticated
  using (owner_id = auth.uid() or public.supervises_learner(id));

create policy "learner insert"
  on public.learners for insert to authenticated
  with check (owner_id = auth.uid());

create policy "learner update"
  on public.learners for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "learner delete"
  on public.learners for delete to authenticated
  using (owner_id = auth.uid());

create policy "assignment read"
  on public.learner_supervisors for select to authenticated
  using (supervisor_id = auth.uid() or public.owns_learner(learner_id));

-- Documents: the owner only. Supervisors see the confirmed fields on the learner row.
create policy "document read"
  on public.learner_documents for select to authenticated
  using (public.owns_learner(learner_id));

create policy "document insert"
  on public.learner_documents for insert to authenticated
  with check (public.owns_learner(learner_id) and uploaded_by = auth.uid());

create policy "document update"
  on public.learner_documents for update to authenticated
  using (public.owns_learner(learner_id))
  with check (public.owns_learner(learner_id));

create policy "document delete"
  on public.learner_documents for delete to authenticated
  using (public.owns_learner(learner_id));

create policy "progress read"
  on public.task_progress for select to authenticated
  using (public.owns_learner(learner_id) or public.supervises_learner(learner_id));

create policy "progress insert"
  on public.task_progress for insert to authenticated
  with check (public.owns_learner(learner_id) and status in ('started', 'submitted'));

create policy "progress update"
  on public.task_progress for update to authenticated
  using (public.owns_learner(learner_id) and status <> 'reviewed')
  with check (public.owns_learner(learner_id) and status in ('started', 'submitted'));

-- Reviews are append-only. The newest review for a step is the current one.
create policy "review read"
  on public.task_reviews for select to authenticated
  using (public.owns_learner(learner_id) or public.supervises_learner(learner_id));

create policy "review insert"
  on public.task_reviews for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and public.supervises_learner(learner_id)
  );

-- ---------------------------------------------------------------------------
-- Storage: private bucket, path "<learner_id>/<uuid>-<file name>"
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'learner-documents',
  'learner-documents',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do nothing;

-- storage.foldername returns the path segments; the first is the learner id.
create policy "owner reads documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'learner-documents'
    and public.owns_learner_path((storage.foldername(name))[1])
  );

create policy "owner uploads documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'learner-documents'
    and public.owns_learner_path((storage.foldername(name))[1])
  );

create policy "owner deletes documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'learner-documents'
    and public.owns_learner_path((storage.foldername(name))[1])
  );
