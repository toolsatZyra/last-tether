-- Apply only to the dedicated game project after inspecting its existing schema.
begin;
create table public.last_tether_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null,
  updated_at timestamptz not null default now(),
  constraint small_checkpoint check (octet_length(progress::text) <= 16384),
  constraint versioned_checkpoint check (
    jsonb_typeof(progress) = 'object' and progress->>'version' = '1'
    and jsonb_typeof(progress->'stage') = 'number'
    and (progress->>'stage')::integer between 0 and 8
  )
);
alter table public.last_tether_saves enable row level security;
revoke all on public.last_tether_saves from anon, authenticated;
grant select, insert, update, delete on public.last_tether_saves to authenticated;
create policy "Read own checkpoint" on public.last_tether_saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Create own checkpoint" on public.last_tether_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own checkpoint" on public.last_tether_saves for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own checkpoint" on public.last_tether_saves for delete to authenticated
  using ((select auth.uid()) = user_id);
create function public.last_tether_touch_save() returns trigger language plpgsql
  set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger last_tether_save_timestamp before insert or update on public.last_tether_saves
  for each row execute function public.last_tether_touch_save();
commit;
