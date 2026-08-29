-- Migration: bảng `sims_sync_state` — vân tay (fingerprint) của lần đồng bộ kho
-- SIM gần nhất, cho edge function `sync-sims`.
--
-- VÌ SAO CẦN: `sync-sims` trước đây quyết định có sync hay không bằng cách so SỐ
-- DÒNG (`dbCount === rows.length`) — một điều kiện vừa sai về ý (sửa GIÁ hay bật
-- TRẠNG THÁI = ẨN mà không thêm/bớt dòng thì số dòng không đổi) vừa sai về đo:
-- `dbCount` lấy từ `GET /sims?select=id` không có limit, mà PostgREST cap 1000
-- hàng/response, nên với kho 51.639 hàng thì `1000 === 51639` LUÔN sai và nhánh
-- skip CHƯA BAO GIỜ chạy — job vẫn full-sync mỗi lượt. Nghĩa là đây là bom hẹn
-- giờ (kho tụt dưới 1000 số, hoặc ai nới `db-max-rows`, là nó kích hoạt và giá
-- trong DB đứng yên vô thời hạn), không phải lỗi đang gây hại.
-- Nay job băm SHA-256 tập dữ liệu sẽ ghi rồi so với vân tay lần trước, tức so
-- NỘI DUNG chứ không so số dòng.
--
-- Bảng cố ý tổng quát (`key`) để nguồn đồng bộ khác dùng lại được, nhưng hiện
-- chỉ có đúng một hàng: key = 'sims_sheet'.
--
-- KHÔNG phá huỷ: chỉ CREATE, không sửa/không xoá dữ liệu bảng nào khác. Chạy
-- lại nhiều lần an toàn (create if not exists + drop policy if exists).
-- Nếu migration này CHƯA chạy, `sync-sims` vẫn hoạt động: đọc vân tay thất bại
-- được xử lý fail-open → job upsert toàn bộ như hành vi cũ.

create table if not exists public.sims_sync_state (
  key text primary key,
  fingerprint text not null,
  row_count integer not null default 0,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sims_sync_state is
  'Vân tay SHA-256 của lần sync kho SIM gần nhất (edge function sync-sims). Chỉ service role đọc/ghi.';

-- RLS: bật, và KHÔNG có policy nào cho anon/authenticated → deny mặc định.
-- Vân tay không phải dữ liệu công khai và không có ai ở phía web cần đọc nó;
-- `sims` mới là bảng public read.
alter table public.sims_sync_state enable row level security;

drop policy if exists "sims_sync_state_service_write" on public.sims_sync_state;
create policy "sims_sync_state_service_write" on public.sims_sync_state
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
