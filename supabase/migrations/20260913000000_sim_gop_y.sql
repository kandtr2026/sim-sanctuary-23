-- Bảng nhận "Góp ý cho Claude" từ ô nổi trên khu /admin của chonsomobifone.
--
-- Cùng lối với public.koi_gop_y bên KOI: A Khoa gõ nhận xét ngay trên màn đang
-- xem, Claude đọc bảng này (tools qua `supabase db query --linked`) rồi sửa mã.
--
-- Idempotent: chạy lại nhiều lần an toàn (create if not exists + drop policy if
-- exists) — vì migration history của project này từng lệch, mọi migration phải
-- tự bảo vệ.
create table if not exists public.sim_gop_y (
  id         bigint generated always as identity primary key,
  luc        timestamptz not null default now(),
  nguoi      text        not null default 'A Khoa',
  duong_dan  text        not null default '',   -- URL/route đang xem lúc góp ý
  tieu_de    text        not null default '',   -- document.title lúc góp ý
  phien_ban  text        not null default '',   -- short git SHA của bản đang chạy
  noi_dung   text        not null,
  da_xu      boolean     not null default false,
  xu_luc     timestamptz
);

create index if not exists sim_gop_y_chua_xu_idx on public.sim_gop_y (da_xu, id);

-- RLS: bật, KHÔNG policy nào → anon & authenticated (khoá lộ ra trình duyệt) bị
-- chặn hoàn toàn. Chỉ service_role — dùng trong route /api/admin/gop-y SAU khi
-- requireAdmin đã xác thực token admin — mới ghi được; đọc chỉ từ phía máy chủ.
alter table public.sim_gop_y enable row level security;
