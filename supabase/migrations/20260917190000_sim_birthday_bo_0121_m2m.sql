-- Sim Birthday — BỎ khách đầu số 0121 (M2M) khỏi mọi phép ghép.
--
-- A Khoa (góp ý #40, 17/09): thuê bao đầu 0121 là loại M2M (machine-to-machine),
-- KHÔNG có chức năng nghe gọi / nhắn tin nên không chat Zalo được → phải loại
-- khỏi danh sách chào bán. Lọc ngay ở view `sim_birthday_khach_key` để mọi RPC
-- (danh sách khách, thống kê kịch bản, top sim, xuất CSV) đều hết 0121 một lượt,
-- part 100 khách và số đếm luôn khớp.

drop view if exists public.sim_birthday_khach_key;

create view public.sim_birthday_khach_key as
select
  k.*,
  lpad(k.ngay::text, 2, '0') || lpad(k.thang::text, 2, '0') || lpad(k.nam_yy::text, 2, '0') as k_ddmmyy,
  lpad(k.nam_yy::text, 2, '0') || lpad(k.thang::text, 2, '0') || lpad(k.ngay::text, 2, '0') as k_yymmdd,
  lpad(k.ngay::text, 2, '0') || lpad(k.thang::text, 2, '0')                                 as k_ddmm,
  lpad(k.thang::text, 2, '0') || lpad(k.nam_yy::text, 2, '0')                               as k_mmyy,
  k.nam::text                                                                               as k_yyyy
from public.sim_birthday_khach k
where k.msisdn not like '0121%';

revoke all on public.sim_birthday_khach_key from public, anon, authenticated;
