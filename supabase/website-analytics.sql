-- Anonymous, opt-in website measurements. Run once in Supabase SQL Editor.
-- No IP address, account ID, email address, or full referrer URL is stored.

create table if not exists public.website_analytics_sessions (
  session_id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  page_views integer not null default 0 check (page_views >= 0),
  engaged_seconds integer not null default 0 check (engaged_seconds >= 0),
  pages jsonb not null default '{}'::jsonb,
  referrer_host text,
  device_type text not null default 'desktop' check (device_type in ('mobile', 'tablet', 'desktop'))
);

create table if not exists public.website_analytics_download_clicks (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.website_analytics_sessions(session_id) on delete cascade,
  item text not null check (item in ('zip', 'apk', 'macos', 'windows', 'other')),
  clicked_at timestamptz not null default now()
);

-- Lifetime totals contain no session identifiers; detailed session rows still expire.
create table if not exists public.website_analytics_lifetime (
  singleton boolean primary key default true check (singleton),
  unique_sessions bigint not null default 0,
  page_views bigint not null default 0,
  total_seconds bigint not null default 0,
  pages jsonb not null default '{}'::jsonb,
  downloads jsonb not null default '{}'::jsonb
);

create index if not exists website_analytics_sessions_last_seen_idx
  on public.website_analytics_sessions (last_seen);
create index if not exists website_analytics_download_clicks_clicked_at_idx
  on public.website_analytics_download_clicks (clicked_at);

alter table public.website_analytics_sessions enable row level security;
alter table public.website_analytics_download_clicks enable row level security;
alter table public.website_analytics_lifetime enable row level security;
revoke all on public.website_analytics_sessions from anon, authenticated;
revoke all on public.website_analytics_download_clicks from anon, authenticated;
grant all on public.website_analytics_sessions to service_role;
grant all on public.website_analytics_download_clicks to service_role;
grant all on public.website_analytics_lifetime to service_role;
grant usage, select on sequence public.website_analytics_download_clicks_id_seq to service_role;

-- Seed lifetime totals from the records currently retained; reruns do not reset them.
insert into public.website_analytics_lifetime (singleton, unique_sessions, page_views, total_seconds, pages, downloads)
select
  true,
  (select count(*) from public.website_analytics_sessions),
  (select coalesce(sum(page_views), 0) from public.website_analytics_sessions),
  (select coalesce(sum(engaged_seconds), 0) from public.website_analytics_sessions),
  coalesce((
    select jsonb_object_agg(page_name, page_count)
    from (
      select page_name, sum(page_count::integer)::bigint as page_count
      from public.website_analytics_sessions s
      cross join lateral jsonb_each_text(s.pages) as page_entry(page_name, page_count)
      group by page_name
    ) page_totals
  ), '{}'::jsonb),
  coalesce((
    select jsonb_object_agg(item, click_count)
    from (select item, count(*)::bigint as click_count from public.website_analytics_download_clicks group by item) download_totals
  ), '{}'::jsonb)
on conflict (singleton) do nothing;

create or replace function public.track_website_analytics(
  p_session_id uuid,
  p_event text,
  p_page text,
  p_seconds integer default 0,
  p_item text default null,
  p_referrer text default null,
  p_device text default 'desktop'
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_session boolean := false;
  v_prior_seconds integer := 0;
  v_added_seconds integer := 0;
begin
  if p_session_id is null
    or p_event not in ('page_view', 'engagement', 'download_click')
    or p_page not in ('/', '/play', '/download')
    or coalesce(p_seconds, 0) < 0
    or coalesce(p_seconds, 0) > 60
    or coalesce(p_device, 'desktop') not in ('mobile', 'tablet', 'desktop')
  then
    raise exception 'Invalid website analytics event';
  end if;

  if p_event = 'page_view' then
    insert into public.website_analytics_sessions
      (session_id, first_seen, last_seen, page_views, pages, referrer_host, device_type)
    values
      (p_session_id, now(), now(), 1, jsonb_build_object(p_page, 1), left(p_referrer, 120), coalesce(p_device, 'desktop'))
    on conflict (session_id) do update set
      last_seen = now(),
      page_views = public.website_analytics_sessions.page_views + 1,
      pages = jsonb_set(
        public.website_analytics_sessions.pages,
        array[p_page],
        to_jsonb(coalesce((public.website_analytics_sessions.pages ->> p_page)::integer, 0) + 1),
        true
      ),
      referrer_host = coalesce(public.website_analytics_sessions.referrer_host, excluded.referrer_host),
      device_type = excluded.device_type
    returning (xmax = 0) into v_new_session;

    insert into public.website_analytics_lifetime as lifetime
      (singleton, unique_sessions, page_views, pages)
    values (true, case when v_new_session then 1 else 0 end, 1, jsonb_build_object(p_page, 1))
    on conflict (singleton) do update set
      unique_sessions = lifetime.unique_sessions + excluded.unique_sessions,
      page_views = lifetime.page_views + 1,
      pages = jsonb_set(
        lifetime.pages,
        array[p_page],
        to_jsonb(coalesce((lifetime.pages ->> p_page)::bigint, 0) + 1),
        true
      );
  elsif p_event = 'engagement' then
    select engaged_seconds into v_prior_seconds
      from public.website_analytics_sessions
      where session_id = p_session_id
      for update;
    if found then
      v_added_seconds := least(coalesce(p_seconds, 0), greatest(0, 86400 - v_prior_seconds));
    end if;
    update public.website_analytics_sessions
      set engaged_seconds = least(86400, engaged_seconds + coalesce(p_seconds, 0)), last_seen = now()
      where session_id = p_session_id;
    if found and v_added_seconds > 0 then
      update public.website_analytics_lifetime
        set total_seconds = total_seconds + v_added_seconds
        where singleton = true;
    end if;
  elsif p_event = 'download_click' then
    if p_item not in ('zip', 'apk', 'macos', 'windows', 'other') then
      raise exception 'Invalid download category';
    end if;
    insert into public.website_analytics_sessions (session_id, first_seen, last_seen, device_type)
    values (p_session_id, now(), now(), coalesce(p_device, 'desktop'))
    on conflict (session_id) do update set last_seen = now()
    returning (xmax = 0) into v_new_session;
    insert into public.website_analytics_download_clicks (session_id, item) values (p_session_id, p_item);
    insert into public.website_analytics_lifetime as lifetime
      (singleton, unique_sessions, downloads)
    values (true, case when v_new_session then 1 else 0 end, jsonb_build_object(p_item, 1))
    on conflict (singleton) do update set
      unique_sessions = lifetime.unique_sessions + excluded.unique_sessions,
      downloads = jsonb_set(
        lifetime.downloads,
        array[p_item],
        to_jsonb(coalesce((lifetime.downloads ->> p_item)::bigint, 0) + 1),
        true
      );
  end if;

  -- Keep the anonymous session records and download click records to at most 12 months.
  if random() < 0.01 then
    delete from public.website_analytics_sessions where last_seen < now() - interval '12 months';
    delete from public.website_analytics_download_clicks where clicked_at < now() - interval '12 months';
  end if;
end;
$$;

create or replace function public.get_website_analytics()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'generated_at', now(),
    'unique_sessions', (select count(*) from public.website_analytics_sessions),
    'page_views', (select coalesce(sum(page_views), 0) from public.website_analytics_sessions),
    'active_last_7d', (select count(*) from public.website_analytics_sessions where last_seen >= now() - interval '7 days'),
    'average_seconds', (select coalesce(round(avg(engaged_seconds)), 0) from public.website_analytics_sessions),
    'total_seconds', (select coalesce(sum(engaged_seconds), 0) from public.website_analytics_sessions),
    'pages', (
      select coalesce(jsonb_object_agg(page_name, page_count), '{}'::jsonb)
      from (
        select page_name, sum(page_count::integer)::bigint as page_count
        from public.website_analytics_sessions s
        cross join lateral jsonb_each_text(s.pages) as page_entry(page_name, page_count)
        group by page_name
      ) page_totals
    ),
    'downloads', (
      select coalesce(jsonb_object_agg(item, click_count), '{}'::jsonb)
      from (select item, count(*)::bigint as click_count from public.website_analytics_download_clicks group by item) download_totals
    ),
    'overall', (
      select jsonb_build_object(
        'unique_sessions', unique_sessions,
        'page_views', page_views,
        'average_seconds', case when unique_sessions > 0 then round(total_seconds::numeric / unique_sessions)::bigint else 0 end,
        'total_seconds', total_seconds,
        'pages', pages,
        'downloads', downloads
      )
      from public.website_analytics_lifetime
      where singleton = true
    )
  );
$$;

revoke all on function public.track_website_analytics(uuid, text, text, integer, text, text, text) from public, anon, authenticated;
revoke all on function public.get_website_analytics() from public, anon, authenticated;
grant execute on function public.track_website_analytics(uuid, text, text, integer, text, text, text) to service_role;
grant execute on function public.get_website_analytics() to service_role;
