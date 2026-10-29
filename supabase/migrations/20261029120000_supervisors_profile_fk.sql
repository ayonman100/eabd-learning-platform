-- PostgREST can embed profiles on supervisors only when a foreign key exists.
-- Both already belong to the same auth user; this makes that relationship explicit.

alter table public.supervisors
  add constraint supervisors_profile_fk
  foreign key (user_id) references public.profiles (id) on delete cascade;
