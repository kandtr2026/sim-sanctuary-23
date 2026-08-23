alter table public.page_visits
  add column if not exists source text;

-- Allow grouping by source in the admin dashboard.
create index if not exists page_visits_source_idx on public.page_visits (source);
