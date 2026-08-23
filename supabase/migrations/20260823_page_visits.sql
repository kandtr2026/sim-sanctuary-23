-- Page-visit tracking for the admin panel. Each row records a page a visitor
-- navigated to, so the dashboard can show "which pages are people actually
-- looking at" sorted by newest first.
--
-- Anon visitors INSERT (no auth needed — the storefront is public). Only
-- admin users (via profiles.is_admin) can SELECT. The table is append-only:
-- there is no UPDATE or DELETE policy.
--
-- The hook (usePageVisitTracker) throttles inserts so the same path is not
-- logged more than once every 5 seconds per tab, but the table itself has no
-- uniqueness constraint — a page seen by 10 visitors = 10 rows.

create table if not exists public.page_visits (
  id bigint primary key generated always as identity,
  path text not null,
  referrer text,
  user_agent text,
  visited_at timestamptz not null default now()
);

alter table public.page_visits enable row level security;

-- Anyone (including logged-out visitors) can log a page visit.
create policy "page_visits: anon insert"
  on public.page_visits for insert
  with check (true);

-- Only admins can read the logs.
create policy "page_visits: admin read"
  on public.page_visits for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Speed up the admin dashboard query: "most recent visits, newest first".
create index if not exists page_visits_visited_at_desc_idx
  on public.page_visits (visited_at desc);