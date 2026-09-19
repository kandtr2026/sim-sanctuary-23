-- Sim Birthday — CACHE thống kê để thong_ke chạy tức thì ở quy mô 2,29 triệu.
--
-- Bối cảnh: file gốc có 2.291.209 thuê bao, 100% có ngày sinh (trước tưởng 2 sheet
-- đầu không có NS là NHẦM). Đã import đủ cả 3 sheet vào sim_birthday_khach
-- (script E:\Claude A Khoa Processing\_sim_birthday\gen_sql.py → upsert theo lô).
--
-- ⚠️ sim_birthday_thong_ke bản cũ ghép khách×kho + count(distinct) → ~41s ở 2,29tr
-- (timeout). Vì dữ liệu nay TĨNH, ta tính sẵn các con số theo từng NGƯỠNG LÔ vào
-- bảng cache; thong_ke chỉ đọc cache (~50ms). Bỏ phần kịch bản/phân bố (đang ẩn
-- HIEN_GHEP=false) để nhẹ. Khi import thêm dữ liệu → nạp lại cache (xem cuối file).

create table if not exists public.sim_birthday_tk_cache (
  nguong          bigint primary key,
  khach_tat_ca    bigint,
  khach_sau_loc   bigint,
  khach_bat_ky    bigint,
  khach_tron_ngay bigint,
  updated_at      timestamptz not null default now()
);
alter table public.sim_birthday_tk_cache enable row level security;

create or replace function public.sim_birthday_thong_ke(
  p_nguong_lo bigint default 1000, p_nam_tu int default 1950, p_nam_den int default 2015,
  p_bo_0101 boolean default false, p_dau_so text[] default '{}'
) returns jsonb language sql stable as $$
  with c as (
    select * from public.sim_birthday_tk_cache
    order by (nguong = p_nguong_lo) desc, abs(nguong - p_nguong_lo) asc
    limit 1
  )
  select jsonb_build_object(
    'tong', jsonb_build_object(
      'kho', (select count(*) from public.sim_birthday_kho),
      'kho_hop_le', (select count(*) from public.sim_birthday_kho where hop_le),
      'kho_co_gia', (select count(*) from public.sim_birthday_kho where gia is not null),
      'khach_tat_ca', (select khach_tat_ca from c),
      'khach_sau_loc', (select khach_sau_loc from c),
      'khach_tron_ngay', (select khach_tron_ngay from c),
      'khach_bat_ky', (select khach_bat_ky from c)
    ),
    'kich_ban', '[]'::jsonb,       -- phần chi tiết kịch bản đang ẩn (HIEN_GHEP=false)
    'phan_bo_nam', '[]'::jsonb,
    'phan_bo_dau_so', '[]'::jsonb,
    'bo_loc', jsonb_build_object('nguong_lo', p_nguong_lo, 'nam_tu', p_nam_tu, 'nam_den', p_nam_den, 'bo_0101', p_bo_0101, 'dau_so', p_dau_so)
  );
$$;

revoke all on function public.sim_birthday_thong_ke(bigint, int, int, boolean, text[]) from public, anon, authenticated;

-- Nạp/refresh cache cho các ngưỡng lô UI dùng (0/100/1000/10000). Chạy lại câu này
-- mỗi khi dữ liệu khách thay đổi (import thêm). ~80s ở 2,29tr.
truncate public.sim_birthday_tk_cache;
insert into public.sim_birthday_tk_cache (nguong, khach_tat_ca, khach_sau_loc, khach_bat_ky, khach_tron_ngay)
with m as (
  select k.khoang_cach_lo as kc,
    exists(select 1 from public.sim_birthday_kho_key x where x.duoi6=k.k_ddmmyy or x.duoi6=k.k_yymmdd or x.duoi4=k.k_ddmm) as bk,
    exists(select 1 from public.sim_birthday_kho_key x where x.duoi6=k.k_ddmmyy or x.duoi6=k.k_yymmdd) as tron
  from public.sim_birthday_khach_key k
  where k.nam between 1950 and 2015
),
tot as (select count(*) as tc from public.sim_birthday_khach)
select t.N, (select tc from tot),
       count(*) filter (where m.kc >= t.N),
       count(*) filter (where m.kc >= t.N and m.bk),
       count(*) filter (where m.kc >= t.N and m.tron)
from m cross join (values (0),(100),(1000),(10000)) t(N)
group by t.N;

notify pgrst, 'reload schema';
