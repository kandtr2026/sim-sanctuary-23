-- Sim Birthday — nút "Đã gửi Zalo": log thời điểm gửi + user đã bấm (#53).
--
-- A Khoa: cần nút chạm-là-ghi-nhận "đã nhắn lúc mấy giờ phút giây", log theo
-- user bấm luôn. created_at = lúc gửi (route ghi now() khi POST), created_by =
-- email admin bấm. Cờ ĐỘC LẬP với co_zalo/ko_zalo/da_mo.

create table if not exists public.sim_birthday_da_nhan (
  msisdn      text primary key,
  created_at  timestamptz not null default now(),
  created_by  text
);

alter table public.sim_birthday_da_nhan enable row level security;

comment on table public.sim_birthday_da_nhan is
  'Sim Birthday — số đã GỬI tin Zalo: created_at = lúc gửi, created_by = user bấm (#53). Chỉ service role.';
