-- Sim Birthday — đánh dấu số đã bấm "Mở Zalo" (đã tiếp xúc / đã kiểm tra) (#52).
--
-- A Khoa: nút đã bấm rồi thì phải đổi màu để phân biệt số chưa từng tiếp xúc —
-- bấm Mở Zalo (đi tiền trạm) xong, lần sau quay lại vẫn biết mình đã mở số nào.
-- Cờ ĐỘC LẬP với co_zalo/ko_zalo (mở rồi vẫn có thể đánh Zalo OK / Ko Zalo).
-- Lưu bảng riêng, chỉ msisdn.

create table if not exists public.sim_birthday_da_mo (
  msisdn      text primary key,
  created_at  timestamptz not null default now(),
  created_by  text
);

alter table public.sim_birthday_da_mo enable row level security;

comment on table public.sim_birthday_da_mo is
  'Sim Birthday — số đã bấm Mở Zalo (đã tiếp xúc/kiểm tra) (#52). Chỉ service role.';
