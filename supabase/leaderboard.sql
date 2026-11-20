-- Run once in Supabase SQL Editor to enable the public Time Attack leaderboard.
-- Player names and times are public only for players who opt in in game Settings.
create table if not exists public.time_attack_leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  driver_name text not null check (char_length(driver_name) between 1 and 16),
  best_time_ms integer not null check (best_time_ms between 1 and 3600000),
  updated_at timestamptz not null default now()
);

create index if not exists time_attack_leaderboard_best_time_idx
  on public.time_attack_leaderboard (best_time_ms asc, updated_at asc);

alter table public.time_attack_leaderboard enable row level security;
revoke all on table public.time_attack_leaderboard from anon, authenticated;
grant select (driver_name, best_time_ms) on table public.time_attack_leaderboard to anon;
grant select (user_id, driver_name, best_time_ms) on table public.time_attack_leaderboard to authenticated;
grant insert, update, delete on table public.time_attack_leaderboard to authenticated;

drop policy if exists "Anyone can read shared leaderboard times" on public.time_attack_leaderboard;
create policy "Anyone can read shared leaderboard times"
  on public.time_attack_leaderboard for select to anon, authenticated
  using (true);

drop policy if exists "Players can submit their own leaderboard time" on public.time_attack_leaderboard;
create policy "Players can submit their own leaderboard time"
  on public.time_attack_leaderboard for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own leaderboard time" on public.time_attack_leaderboard;
create policy "Players can update their own leaderboard time"
  on public.time_attack_leaderboard for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can remove their own leaderboard time" on public.time_attack_leaderboard;
create policy "Players can remove their own leaderboard time"
  on public.time_attack_leaderboard for delete to authenticated
  using ((select auth.uid()) = user_id);
