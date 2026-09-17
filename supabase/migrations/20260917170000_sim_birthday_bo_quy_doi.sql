-- Sim Birthday — BỎ phần tự quy đổi đầu số 012x sang 07x.
--
-- Migration 20260917150000 thêm cột `so_lien_he` đổi 0121… thành 079… theo đợt
-- chuyển đổi 11 số → 10 số năm 2018. A Khoa đã chỉ rõ: 0121 là đầu số đang dùng,
-- chạy song song với 079, hai thứ KHÔNG liên quan nhau. Nên số thuê bao giữ
-- nguyên như trong file nguồn, không suy diễn gì thêm.

drop view if exists public.sim_birthday_khach_key;

alter table public.sim_birthday_khach drop column if exists so_lien_he;

create view public.sim_birthday_khach_key as
select
  k.*,
  lpad(k.ngay::text, 2, '0') || lpad(k.thang::text, 2, '0') || lpad(k.nam_yy::text, 2, '0') as k_ddmmyy,
  lpad(k.nam_yy::text, 2, '0') || lpad(k.thang::text, 2, '0') || lpad(k.ngay::text, 2, '0') as k_yymmdd,
  lpad(k.ngay::text, 2, '0') || lpad(k.thang::text, 2, '0')                                 as k_ddmm,
  lpad(k.thang::text, 2, '0') || lpad(k.nam_yy::text, 2, '0')                               as k_mmyy,
  k.nam::text                                                                               as k_yyyy
from public.sim_birthday_khach k;

revoke all on public.sim_birthday_khach_key from public, anon, authenticated;

drop function if exists public.sim_birthday_khach_theo_kich_ban(text, bigint, int, int, boolean, text[], int, int, boolean);

create function public.sim_birthday_khach_theo_kich_ban(
  p_kich_ban           text,
  p_nguong_lo          bigint  default 1000,
  p_nam_tu             int     default 1950,
  p_nam_den            int     default 2015,
  p_bo_0101            boolean default false,
  p_dau_so             text[]  default '{}',
  p_limit              int     default 100,
  p_offset             int     default 0,
  p_moi_ngay_mot_khach boolean default false
)
returns table (
  msisdn     text,
  dob        date,
  dau_so     text,
  so_sim     bigint,
  sim_goi_y  text
)
language sql
stable
as $$
with ko as (select * from public.sim_birthday_kho_gom(p_kich_ban)),
cap as (
  select
    kh.msisdn, kh.dob, kh.dau_so, ko.so_sim, array_to_string(ko.top5, ', ') as sim_goi_y,
    row_number() over (partition by kh.dob order by ko.so_sim desc, kh.msisdn) as hang_trong_ngay
  from public.sim_birthday_khach_key kh
  join ko on ko.k = case p_kich_ban
                      when 'ddmmyy' then kh.k_ddmmyy
                      when 'yymmdd' then kh.k_yymmdd
                      when 'giua6'  then kh.k_ddmmyy
                      when 'ddmm'   then kh.k_ddmm
                      when 'mmyy'   then kh.k_mmyy
                      else kh.k_yyyy
                    end
  where kh.khoang_cach_lo >= p_nguong_lo
    and kh.nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (kh.ngay = 1 and kh.thang = 1))
    and (cardinality(p_dau_so) = 0 or kh.dau_so = any(p_dau_so))
)
select msisdn, dob, dau_so, so_sim, sim_goi_y
from cap
where not p_moi_ngay_mot_khach or hang_trong_ngay = 1
order by so_sim desc, msisdn
limit greatest(1, least(p_limit, 100000)) offset greatest(0, p_offset);
$$;

create or replace function public.sim_birthday_xuat_csv(
  p_kich_ban  text,
  p_nguong_lo bigint  default 1000,
  p_nam_tu    int     default 1950,
  p_nam_den   int     default 2015,
  p_bo_0101   boolean default false,
  p_dau_so    text[]  default '{}',
  p_limit     int     default 200000
)
returns text
language sql
stable
as $$
with ko as (select * from public.sim_birthday_kho_gom(p_kich_ban)),
cap as (
  select kh.msisdn, kh.dob, ko.so_sim, array_to_string(ko.top5, ', ') as sim_goi_y
  from public.sim_birthday_khach_key kh
  join ko on ko.k = case p_kich_ban
                      when 'ddmmyy' then kh.k_ddmmyy
                      when 'yymmdd' then kh.k_yymmdd
                      when 'giua6'  then kh.k_ddmmyy
                      when 'ddmm'   then kh.k_ddmm
                      when 'mmyy'   then kh.k_mmyy
                      else kh.k_yyyy
                    end
  where kh.khoang_cach_lo >= p_nguong_lo
    and kh.nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (kh.ngay = 1 and kh.thang = 1))
    and (cardinality(p_dau_so) = 0 or kh.dau_so = any(p_dau_so))
  order by ko.so_sim desc, kh.msisdn
  limit greatest(1, least(p_limit, 200000))
)
select string_agg(
  msisdn || ',' || to_char(dob, 'DD/MM/YYYY') || ',' || so_sim::text || ',"' ||
  replace(coalesce(sim_goi_y, ''), '"', '""') || '"',
  E'\n' order by so_sim desc, msisdn
)
from cap;
$$;

revoke all on function public.sim_birthday_khach_theo_kich_ban(text, bigint, int, int, boolean, text[], int, int, boolean) from public, anon, authenticated;
revoke all on function public.sim_birthday_xuat_csv(text, bigint, int, int, boolean, text[], int) from public, anon, authenticated;
