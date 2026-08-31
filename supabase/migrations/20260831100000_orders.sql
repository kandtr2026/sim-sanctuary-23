-- A6: Sổ chốt đơn thủ công (lead → đơn).
--
-- Đóng vòng đo "chiến dịch nào ra ĐƠN, không chỉ ra lead": web biết campaign/gclid
-- mỗi cú bấm Zalo (conversion_clicks) nhưng KHÔNG biết SĐT; AppSheet biết
-- SĐT+đơn nhưng không biết campaign. Campaign đi nhờ tin nhắn Zalo
-- ("Em quan tâm SIM X. [Mã: gg-search-tuquy]"), đơn về qua webhook POST /api/orders.
--
-- KHÁC bảng SIM_SOLD trên Google Sheet (SalesChart đọc từ sheet) — đây là bảng
-- riêng nhận từ webhook, dedup theo external_id (id dòng AppSheet).

create table if not exists public.orders (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  sold_at       timestamptz,
  phone         text        not null,
  sim           text,
  price         integer     not null,          -- VND
  campaign_code text,
  source        text,
  external_id   text unique,                   -- dedup: id dòng AppSheet
  raw           jsonb
);

create index if not exists orders_campaign_code_idx on public.orders (campaign_code);
create index if not exists orders_sold_at_idx       on public.orders (sold_at desc);

-- RLS: chỉ admin SELECT. INSERT/UPDATE/DELETE không có policy → anon & authenticated
-- đều bị chặn; chỉ service role (webhook /api/orders) ghi được (RLS bỏ qua).
alter table public.orders enable row level security;
alter table public.orders force row level security;

create policy "orders: admin read"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
