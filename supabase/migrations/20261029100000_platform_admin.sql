-- Platform administration: an admin role, an audit trail, and the ability to
-- progress approvals across all learners.
--
-- Design notes:
--   * A supervisor may only review learners assigned to them. An admin may review
--     any learner, and may also reassign or provision supervisors.
--   * Every administrative action is written to admin_audit so the history of who
--     changed what is answerable. Approval decisions already live in task_reviews
--     and are append-only; this table covers the surrounding actions.
--   * The admin role is granted in the SQL editor, never from the client.

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from platform_admins where user_id = auth.uid()
  );
$$;

-- An admin can see whether they hold the role. Nobody can grant it from a client.
create policy "see own admin row"
  on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Audit trail
-- ---------------------------------------------------------------------------

create table public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete cascade,
  action text not null
    check (action in (
      'review_created',
      'learner_assigned',
      'learner_unassigned',
      'supervisor_granted',
      'supervisor_revoked',
      'document_deleted'
    )),
  learner_id uuid references public.learners (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_lookup
  on public.admin_audit (created_at desc);

alter table public.admin_audit enable row level security;

create policy "admin reads audit"
  on public.admin_audit for select to authenticated
  using (public.is_platform_admin());

create policy "actor writes own audit row"
  on public.admin_audit for insert to authenticated
  with check (actor_id = auth.uid() and public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Widen the existing policies so an admin can act across learners.
-- The supervisor rules stay exactly as they were; these are additive.
-- ---------------------------------------------------------------------------

create policy "admin reads all learners"
  on public.learners for select to authenticated
  using (public.is_platform_admin());

create policy "admin reads all progress"
  on public.task_progress for select to authenticated
  using (public.is_platform_admin());

create policy "admin reads all reviews"
  on public.task_reviews for select to authenticated
  using (public.is_platform_admin());

create policy "admin inserts reviews"
  on public.task_reviews for insert to authenticated
  with check (reviewer_id = auth.uid() and public.is_platform_admin());

create policy "admin reads all documents"
  on public.learner_documents for select to authenticated
  using (public.is_platform_admin());

create policy "admin reads assignments"
  on public.learner_supervisors for select to authenticated
  using (public.is_platform_admin());

create policy "admin assigns learners"
  on public.learner_supervisors for insert to authenticated
  with check (public.is_platform_admin());

create policy "admin unassigns learners"
  on public.learner_supervisors for delete to authenticated
  using (public.is_platform_admin());

create policy "admin reads profiles"
  on public.profiles for select to authenticated
  using (public.is_platform_admin());

create policy "admin reads supervisors"
  on public.supervisors for select to authenticated
  using (public.is_platform_admin());

create policy "admin grants supervisor"
  on public.supervisors for insert to authenticated
  with check (public.is_platform_admin());

create policy "admin revokes supervisor"
  on public.supervisors for delete to authenticated
  using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- An overview view for the admin queue.
--
-- Security invoker so the caller's own policies apply; the admin policies above
-- are what make the rows visible. This keeps one definition of "awaiting review"
-- instead of repeating the join in the browser.
-- ---------------------------------------------------------------------------

create or replace view public.admin_approval_queue
with (security_invoker = true)
as
select
  r.id                as review_id,
  r.learner_id,
  l.first_name        as learner_first_name,
  l.owner_id          as learner_owner_id,
  r.pathway_id,
  r.task_id,
  r.reviewer_id,
  r.marked_done,
  r.rating,
  r.review,
  r.created_at
from public.task_reviews r
join public.learners l on l.id = r.learner_id;
