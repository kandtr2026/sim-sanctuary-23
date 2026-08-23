-- Conversion-click tracking for the admin panel. A "conversion" is a visitor
-- clicking one of the contact CTAs (Zalo / phone call / Messenger). Each row
-- records one click, which CTA, on which page, and where the visitor came from
-- (the same source classification as page_visits).
--
-- Anon visitors INSERT (no auth needed). Only admins (profiles.is_admin) can
-- SELECT. Append-only: no UPDATE/DELETE policy.

create table if not exists public.conversion_clicks (
  id bigint primary key generated always as identity,
  type text not null, -- 'zalo' | 'call' | 'messenger'
  path text not null,
  source text,
  user_agent text,
  clicked_at timestamptz not null default now()
);

alter table public.conversion_clicks enable row level security;

-- Anyone can log a conversion click.
create policy "conversion_clicks: anon insert"
  on public.conversion_clicks for insert
  with check (true);

-- Only admins can read the log.
create policy "conversion_clicks: admin read"
  on public.conversion_clicks for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create index if not exists conversion_clicks_clicked_at_desc_idx
  on public.conversion_clicks (clicked_at desc);