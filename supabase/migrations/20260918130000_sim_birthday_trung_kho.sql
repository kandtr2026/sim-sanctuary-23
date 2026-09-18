-- Sim sinh nhật — mục "Khách trùng 6 số đuôi với kho chonso".
--
-- Liệt kê khách (trong sim_birthday_khach) mà 6 SỐ ĐUÔI của SĐT đang dùng trùng
-- ĐÚNG với 6 số đuôi của một số trong kho chonso — cả KHO SIM SINH NHẬT
-- (sim_birthday_kho) lẫn KHO WEB đang bán (public.sims, status='available').
-- Để Sale chào "bên em có số đuôi giống hệt số anh/chị đang dùng".
--
-- ⚠️ Dự án riêng: chỉ ĐỌC một chiều từ kho bán sang, KHÔNG trộn dữ liệu dự án
-- sinh nhật ngược vào public.sims.
--
-- Lọc lô đại lý theo `khoang_cach_lo >= p_nguong_lo` (cùng luật với các RPC
-- sim_birthday khác — null bị loại như nhau). count(*) over() cho tổng để phân trang.

create or replace function public.sim_birthday_khach_trung_kho(
  p_nguong_lo bigint default 1000,
  p_limit int default 100,
  p_offset int default 0
)
returns table(
  msisdn text,
  dob date,
  duoi6 text,
  so_web text[],
  so_sn text[],
  tong bigint
)
language sql
stable
as $$
  with kho_web as (
    select distinct right(raw_digits, 6) as d6, raw_digits as so
    from public.sims
    where status = 'available' and effective_price > 0
  ),
  kho_sn as (
    select distinct duoi6 as d6, digits as so
    from public.sim_birthday_kho
    where duoi6 is not null
  ),
  d6_all as (
    select d6 from kho_web union select d6 from kho_sn
  ),
  khach as (
    select k.msisdn, k.dob, right(k.msisdn, 6) as d6,
           count(*) over() as tong
    from public.sim_birthday_khach k
    where k.khoang_cach_lo >= p_nguong_lo
      and right(k.msisdn, 6) in (select d6 from d6_all)
    order by k.msisdn
    limit greatest(1, least(p_limit, 500))
    offset greatest(0, p_offset)
  )
  select
    kh.msisdn, kh.dob, kh.d6,
    coalesce((select array_agg(w.so) from (
      select so from kho_web where d6 = kh.d6 and so <> kh.msisdn order by so limit 5
    ) w), '{}') as so_web,
    coalesce((select array_agg(s.so) from (
      select so from kho_sn where d6 = kh.d6 and so <> kh.msisdn order by so limit 5
    ) s), '{}') as so_sn,
    kh.tong
  from khach kh
  order by kh.msisdn;
$$;

notify pgrst, 'reload schema';
