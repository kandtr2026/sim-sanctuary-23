-- On-site sales campaigns driven from the admin panel: promo banner / flash
-- sale (with a real countdown to `ends_at`) / featured deal. `slug` doubles as
-- the utm_campaign key so campaign performance can be measured in the admin
-- (see src/lib/campaignAnalytics.ts).
--
-- Anon/public may SELECT only currently-active, in-window rows (storefront
-- reads these to render the banner). Only admins (profiles.is_admin) may write.

create table if not exists public.site_campaigns (
  id bigint primary key generated always as identity,
  name text not null,
  slug text not null unique,
  type text not null default 'promo_banner', -- 'flash_sale' | 'promo_banner' | 'featured_deal'
  active boolean not null default false,
  headline text,
  subline text,
  cta_label text,
  cta_url text,
  discount_note text,
  target_tags text[],
  starts_at timestamptz,
  ends_at timestamptz,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_campaigns enable row level security;

-- Storefront (anon) can read only active, in-window campaigns.
create policy "site_campaigns: public read active"
  on public.site_campaigns for select
  using (active = true and (ends_at is null or ends_at > now()));

-- Admins can do everything (incl. read inactive drafts).
create policy "site_campaigns: admin all"
  on public.site_campaigns for all
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.is_admin = true)
  );

create index if not exists site_campaigns_active_sort_idx
  on public.site_campaigns (active, sort);

-- Keep updated_at fresh on UPDATE (uniquely-named to avoid clobbering others).
create or replace function public.site_campaigns_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists site_campaigns_set_updated_at on public.site_campaigns;
create trigger site_campaigns_set_updated_at
  before update on public.site_campaigns
  for each row execute function public.site_campaigns_touch_updated_at();
