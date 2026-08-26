-- Migration: bảng sims — lưu toàn bộ kho SIM từ Google Sheet vào Supabase
-- để page không phải tải cả CSV 5.5MB mỗi lần load. Daily sync (edge function)
-- sẽ upsert vào bảng này và đánh dấu sold từ tab SIM_SOLD.

create table if not exists public.sims (
  id text primary key,                -- SimID từ sheet (vd SIM128989)
  raw_digits text not null,           -- số chuẩn hóa, chỉ chữ số (vd 0799977799)
  display_number text not null,       -- số hiển thị (giữ nguyên từ sheet)
  original_price bigint not null default 0,
  final_price bigint,
  effective_price bigint not null default 0, -- finalPrice ?? originalPrice
  discount_type text,
  discount_value bigint,
  kho text,
  tinh_trang text,
  status text not null default 'available', -- available | sold | reserved | an
  network text,
  tags jsonb not null default '[]'::jsonb,
  beauty_score integer not null default 0,
  is_vip boolean not null default false,
  prefix3 text,
  prefix4 text,
  last2 text,
  last4 text,
  last6 text,
  source_updated_at timestamptz,      -- thời điểm admin sửa file (nếu có)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sims_status on public.sims(status);
create index if not exists idx_sims_network on public.sims(network);
create index if not exists idx_sims_price on public.sims(effective_price);
create index if not exists idx_sims_raw_digits on public.sims(raw_digits);
create index if not exists idx_sims_last4 on public.sims(last4);

-- bảng sold log — ghi nhận từng lần SIM bị bán (từ SIM_SOLD tab)
create table if not exists public.sold_sims (
  id text primary key,                -- SimID
  sold_at timestamptz not null default now(),
  phone_digits text,
  raw_digits text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sold_sims_created on public.sold_sims(created_at desc);

-- RLS: cho phép anon đọc sims (public catalogue), ghi chỉ qua edge function (service role)
alter table public.sims enable row level security;
alter table public.sold_sims enable row level security;

drop policy if exists "sims_public_read" on public.sims;
create policy "sims_public_read" on public.sims
  for select using (true);

drop policy if exists "sims_service_write" on public.sims;
create policy "sims_service_write" on public.sims
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sold_sims_public_read" on public.sold_sims;
create policy "sold_sims_public_read" on public.sold_sims
  for select using (true);

drop policy if exists "sold_sims_service_write" on public.sold_sims;
create policy "sold_sims_service_write" on public.sold_sims
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
