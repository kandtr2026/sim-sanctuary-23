-- Zalo CRO (T9/T11) — thêm chi tiết cho conversion_clicks để đo ma sát + A/B.
-- Additive, không đụng RLS (anon INSERT `with check (true)` đã cho mọi cột).

alter table public.conversion_clicks
  add column if not exists sim_number text,   -- Số SIM khách hỏi (data-sim-number / /mua-ngay/:simId)
  add column if not exists position text,     -- header | card | floating | sticky-bar | dialog | other
  add column if not exists device text,       -- mobile | desktop | tablet
  add column if not exists variant text;      -- A/B card Zalo: A (control) | B (test); null = chưa gắn

-- Đo ma sát theo vị trí CTA thường xuyên nhất.
create index if not exists conversion_clicks_position_idx
  on public.conversion_clicks (clicked_at desc, position);
