-- Sim Birthday — tách MÀN HÌNH thao tác (#55,#56) + gộp tất cả kịch bản (#57).
--
-- A Khoa: để tất cả khách trên 1 màn rất khó thao tác. Tách:
--   Màn 1 = TẤT CẢ khách CHƯA lọc Zalo (chưa đánh Có/Ko) → chỉ để phân loại.
--   Màn 2 = chỉ khách ĐÃ CÓ Zalo → để nhắn tin.
-- p_kich_ban='all' gộp mọi kịch bản còn dùng (ddmmyy/yymmdd/ddmm) thành 1 danh sách.
--
-- ⚠️ HIỆU NĂNG: bản đầu gom số cho CẢ tập rồi mới cắt trang → nổ 721k cặp, ~3.9s,
-- timeout không load được. Nay: lọc + phân trang khách TRƯỚC (nhẹ), chỉ gom số cho
-- ~100 khách của trang. Màn 1 KHÔNG đòi có số khớp (đúng "All khách"); chỉ Màn 2
-- đòi exists ≥1 số để chào (tập co_zalo nhỏ nên rẻ). Đo: Màn 1 ~250ms, Màn 2 ~40ms.

create or replace function public.sim_birthday_khach_loc(
  p_kich_ban  text,
  p_nguong_lo bigint  default 1000,
  p_nam_tu    int     default 1900,
  p_nam_den   int     default 2100,
  p_bo_0101   boolean default false,
  p_dau_so    text[]  default '{}',
  p_loc_tt    text    default 'chua',   -- 'chua' | 'co_zalo'
  p_limit     int     default 100,
  p_offset    int     default 0
)
returns table (msisdn text, dob date, dau_so text, so_sim bigint, sim_goi_y text, da_mo boolean, tong bigint)
language sql stable as $$
with cust as (
  select k.msisdn, k.dob, k.dau_so, k.k_ddmmyy, k.k_yymmdd, k.k_ddmm,
         (mo.msisdn is not null) as da_mo
  from public.sim_birthday_khach_key k
  left join public.sim_birthday_co_zalo cz on cz.msisdn = k.msisdn
  left join public.sim_birthday_ko_zalo kz on kz.msisdn = k.msisdn
  left join public.sim_birthday_da_mo   mo on mo.msisdn = k.msisdn
  where k.khoang_cach_lo >= p_nguong_lo
    and k.nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (k.ngay = 1 and k.thang = 1))
    and (cardinality(p_dau_so) = 0 or k.dau_so = any(p_dau_so))
    and case when p_loc_tt = 'co_zalo' then cz.msisdn is not null
             when p_loc_tt = 'ko_zalo' then kz.msisdn is not null
             else cz.msisdn is null and kz.msisdn is null end
    -- Chỉ Màn 2 (co_zalo) đòi có số để chào; Màn 1/3 lấy đủ khách theo trạng thái.
    and (p_loc_tt <> 'co_zalo' or exists (
      select 1 from public.sim_birthday_kho_key x
      where (p_kich_ban = 'all'    and (x.duoi6 = k.k_ddmmyy or x.duoi6 = k.k_yymmdd or x.duoi4 = k.k_ddmm))
         or (p_kich_ban = 'ddmmyy' and x.duoi6 = k.k_ddmmyy)
         or (p_kich_ban = 'yymmdd' and x.duoi6 = k.k_yymmdd)
         or (p_kich_ban = 'ddmm'   and x.duoi4 = k.k_ddmm)
    ))
),
page as (
  select *, count(*) over() as tong
  from cust
  order by da_mo desc, msisdn
  limit greatest(1, least(p_limit, 500)) offset greatest(0, p_offset)
),
sims as (
  -- Gom số CHỈ cho ~100 khách của trang (rẻ). Distinct vì 'all' có thể trùng.
  select p.msisdn,
         count(distinct k.digits) as so_sim,
         (array_agg(distinct k.digits order by k.digits))[1:5] as goi5
  from page p
  join public.sim_birthday_kho_key k
    on (p_kich_ban = 'all'    and (k.duoi6 = p.k_ddmmyy or k.duoi6 = p.k_yymmdd or k.duoi4 = p.k_ddmm))
    or (p_kich_ban = 'ddmmyy' and k.duoi6 = p.k_ddmmyy)
    or (p_kich_ban = 'yymmdd' and k.duoi6 = p.k_yymmdd)
    or (p_kich_ban = 'ddmm'   and k.duoi4 = p.k_ddmm)
  group by p.msisdn
)
select p.msisdn, p.dob, p.dau_so,
       coalesce(s.so_sim, 0) as so_sim,
       array_to_string(s.goi5, ', ') as sim_goi_y,
       p.da_mo, p.tong
from page p
left join sims s on s.msisdn = p.msisdn
order by p.da_mo desc, p.msisdn;
$$;

revoke all on function public.sim_birthday_khach_loc(text, bigint, int, int, boolean, text[], text, int, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
