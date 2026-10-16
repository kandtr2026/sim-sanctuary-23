-- Migration: bảng `sims_bang_so` — BẢNG SỐ CHUẨN nhà cung cấp gửi hằng tháng
-- (file Excel "BANG SO THÁNG xx_yyyy.xlsx"), là NGUỒN DUY NHẤT quyết định kho web.
--
-- Luật chủ shop chốt 16/10/2026:
--   1. Giá bán trên web = cột GIÁ BÁN của file Excel, không cộng/trừ gì.
--   2. Số KHÔNG có trong Excel = số không còn tồn tại → gỡ khỏi web.
--   3. Số có trong Excel nhưng ĐÃ TỪNG nằm trong tab SIM_SOLD (so theo SỐ ĐIỆN
--      THOẠI, không chỉ SimID) → gỡ, vì một số chỉ bán một lần; file Excel có thể
--      chốt trước thời điểm bán.
--   4. Có trong Excel (và không vướng luật 3) thì BẮT BUỘC lên web.
--
-- Trước đây `sync-sims` lấy kho + giá từ tab chính của Google Sheet, nơi giá đã
-- bị cộng ~10% và còn 9.362 số đã rời bảng số. Nay `sync-sims` đọc bảng này.
--
-- Nạp file mới: `node scripts/bang-so/import.mjs "<file.xlsx>" --sync`.
--
-- Chỉ lưu những cột web cần. Cột GIÁ THU VỀ (giá vốn đại lý) cố ý KHÔNG lưu.
-- RLS bật và KHÔNG có policy nào → chỉ service role đọc/ghi.

create table if not exists public.sims_bang_so (
  raw_digits text primary key,          -- số chuẩn hoá 10 chữ số, vd 0938868868
  display_number text not null,         -- số hiển thị theo file, vd 0938.868.868
  gia_ban bigint not null,              -- cột GIÁ BÁN (VND)
  tinh_trang text,                      -- cột TÌNH TRẠNG, vd "SIM TTNK"
  nguon text,                           -- tên file Excel đã nạp
  imported_at timestamptz not null default now()
);

create index if not exists idx_sims_bang_so_imported_at on public.sims_bang_so(imported_at);

comment on table public.sims_bang_so is
  'Bảng số chuẩn từ file Excel nhà cung cấp. Nguồn kho + giá cho edge function sync-sims. Chỉ service role.';

alter table public.sims_bang_so enable row level security;
