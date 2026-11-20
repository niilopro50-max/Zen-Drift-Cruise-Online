-- Run once in Supabase SQL Editor to enable both public mode leaderboards.
-- Signed-in players share names and scores by default; they can opt out in game Settings.
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
grant select on table public.time_attack_leaderboard to authenticated;
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

-- Endless records rank players by total active playtime. Names and scores are
-- public only when the player enables leaderboard sharing in game Settings.
create table if not exists public.endless_leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  driver_name text not null check (char_length(driver_name) between 1 and 16),
  play_time_ms bigint not null check (play_time_ms > 0),
  updated_at timestamptz not null default now()
);

create index if not exists endless_leaderboard_play_time_idx
  on public.endless_leaderboard (play_time_ms desc, updated_at asc);

alter table public.endless_leaderboard enable row level security;
revoke all on table public.endless_leaderboard from anon, authenticated;
grant select (driver_name, play_time_ms) on table public.endless_leaderboard to anon;
grant select (user_id, driver_name, play_time_ms) on table public.endless_leaderboard to authenticated;
grant insert, update, delete on table public.endless_leaderboard to authenticated;

drop policy if exists "Anyone can read shared Endless playtime" on public.endless_leaderboard;
create policy "Anyone can read shared Endless playtime"
  on public.endless_leaderboard for select to anon, authenticated
  using (true);

drop policy if exists "Players can submit their own Endless playtime" on public.endless_leaderboard;
create policy "Players can submit their own Endless playtime"
  on public.endless_leaderboard for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own Endless playtime" on public.endless_leaderboard;
create policy "Players can update their own Endless playtime"
  on public.endless_leaderboard for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can remove their own Endless playtime" on public.endless_leaderboard;
create policy "Players can remove their own Endless playtime"
  on public.endless_leaderboard for delete to authenticated
  using ((select auth.uid()) = user_id);
