-- Sim Birthday — đổi mô hình trạng thái sang quy trình TIỀN TRẠM check Zalo (#47).
--
-- A Khoa: khởi tạo "Chưa check Zalo"; cho người đi tiền trạm bấm Mở Zalo, có thì
-- đánh "Có Zalo", không có thì "Ko Zalo". Bảng "đã gửi" (#46) đổi nghĩa thành
-- "có Zalo" nên rename cho khỏi hiểu lầm. Dữ liệu (nếu có) giữ nguyên.

alter table if exists public.sim_birthday_da_gui rename to sim_birthday_co_zalo;

comment on table public.sim_birthday_co_zalo is
  'Sim Birthday — số đã xác nhận CÓ Zalo (tiền trạm đánh dấu). Chỉ service role.';
