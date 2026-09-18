-- Sim Birthday — đánh dấu khách ĐÃ GỬI Zalo (#46).
--
-- A Khoa muốn màn quản lý: khách nào đã gửi, khách nào chưa, tách màu cho dễ xem.
-- Lưu tương tự bảng cờ "Ko Zalo" (#43): chỉ cần biết msisdn nào đã gửi. Vắng mặt
-- = chưa gửi. "Đã gửi" và "Ko Zalo" thực tế loại trừ nhau nhưng để hai bảng độc
-- lập cho đơn giản (route /trang-thai gom chung).

create table if not exists public.sim_birthday_da_gui (
  msisdn      text primary key,
  created_at  timestamptz not null default now(),
  created_by  text
);

alter table public.sim_birthday_da_gui enable row level security;

comment on table public.sim_birthday_da_gui is
  'Sim Birthday — khách đã gửi Zalo (Sale đánh dấu tay). Chỉ service role.';
