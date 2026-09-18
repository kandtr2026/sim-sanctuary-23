-- Sim Birthday — đánh dấu số KHÔNG có Zalo (#43).
--
-- A Khoa: nhiều số mở Zalo ra không có tài khoản, Sale mất công mở mà chẳng chat
-- được. Cho gắn cờ "Ko zalo" ngay trên màn để lần sau bỏ qua. Lưu vào bảng riêng
-- (không đụng dữ liệu khách) — chỉ cần biết msisdn nào đã bị đánh dấu.

create table if not exists public.sim_birthday_ko_zalo (
  msisdn      text primary key,
  created_at  timestamptz not null default now(),
  created_by  text
);

alter table public.sim_birthday_ko_zalo enable row level security;

comment on table public.sim_birthday_ko_zalo is
  'Sim Birthday — số đã xác nhận KHÔNG có Zalo (Sale gắn cờ tay). Chỉ service role.';
