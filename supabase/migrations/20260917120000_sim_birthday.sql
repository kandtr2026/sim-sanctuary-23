-- Dự án "Sim Birthday" — ghép khách có ngày sinh với kho sim mang đúng ngày sinh đó.
--
-- ⚠️ DỰ ÁN RIÊNG, CHẠY SONG SONG. Hai bảng dưới đây KHÔNG dính gì tới `public.sims`
-- (kho số đang bán trên web) và KHÔNG được merge vào đó. Khi nào A Khoa lệnh sáp
-- nhập thì mới tính; tới lúc đó đừng tự ý join hay đổ dữ liệu qua lại.
--
-- Cả hai bảng bật RLS mà KHÔNG có policy nào: anon/authenticated bị chặn sạch,
-- chỉ service role (route handler đã qua requireAdmin) đọc được. Bảng khách chứa
-- số thuê bao + ngày sinh của người thật nên không có lý do gì để lộ ra client.

-- ── Kho sim ngày sinh đang có để bán ─────────────────────────────────────────
create table if not exists public.sim_birthday_kho (
  digits      text primary key,              -- 0xxxxxxxxx đã chuẩn hoá
  dau_so      text not null,                 -- 090 / 093 ...
  duoi6       text not null,                 -- 6 chữ số cuối
  duoi4       text not null,                 -- 4 chữ số cuối
  ngay        smallint,                      -- dd rút từ đuôi ddmmyy (null nếu đuôi không phải ngày hợp lệ)
  thang       smallint,                      -- mm
  nam_yy      smallint,                      -- yy (2 chữ số)
  hop_le      boolean not null default false, -- đuôi 6 số là một ngày có thật
  gia         bigint,                        -- A Khoa ráp sau
  created_at  timestamptz not null default now()
);

create index if not exists sim_birthday_kho_duoi6_idx on public.sim_birthday_kho (duoi6);
create index if not exists sim_birthday_kho_duoi4_idx on public.sim_birthday_kho (duoi4);
create index if not exists sim_birthday_kho_hop_le_idx on public.sim_birthday_kho (hop_le);

alter table public.sim_birthday_kho enable row level security;

-- ── Khách có ngày sinh (nguồn: sheet thuê bao kèm ngày sinh) ─────────────────
-- `khoang_cach_lo` = khoảng cách dãy số tới thuê bao gần nhất CÙNG NGÀY SINH.
-- Sim đại lý đăng ký hàng loạt nằm liền dãy nên khoảng cách rất nhỏ; người thật
-- thì rời rạc. Lưu sẵn con số này để đổi ngưỡng lọc ngay trên màn quản trị mà
-- không phải tính lại toàn bộ dữ liệu.
create table if not exists public.sim_birthday_khach (
  msisdn          text primary key,          -- 0xxxxxxxxx (hoặc 11 số với đầu 012x cũ)
  dau_so          text not null,
  dob             date not null,
  ngay            smallint not null,         -- dd
  thang           smallint not null,         -- mm
  nam             smallint not null,         -- yyyy
  nam_yy          smallint not null,         -- yy
  khoang_cach_lo  bigint not null,           -- càng nhỏ càng giống lô đại lý
  created_at      timestamptz not null default now()
);

create index if not exists sim_birthday_khach_ngay_idx on public.sim_birthday_khach (ngay, thang, nam_yy);
create index if not exists sim_birthday_khach_lo_idx on public.sim_birthday_khach (khoang_cach_lo);
create index if not exists sim_birthday_khach_nam_idx on public.sim_birthday_khach (nam);

alter table public.sim_birthday_khach enable row level security;

comment on table public.sim_birthday_kho is
  'Sim Birthday — kho sim có đuôi là ngày sinh. Dự án riêng, KHÔNG merge vào public.sims.';
comment on table public.sim_birthday_khach is
  'Sim Birthday — thuê bao kèm ngày sinh để chào bán. Dữ liệu cá nhân: chỉ service role đọc.';
