-- Sim Birthday — tách MÀN HÌNH thao tác (#55, #56).
--
-- A Khoa: để tất cả khách trên 1 màn rất khó thao tác. Tách:
--   Màn 1 = TẤT CẢ khách CHƯA lọc Zalo (chưa đánh Có/Ko) → chỉ để phân loại.
--   Màn 2 = chỉ khách ĐÃ CÓ Zalo → để nhắn tin.
-- RPC này lọc theo trạng thái (`p_loc_tt`) và trả `tong` để phân trang đúng tập
-- đã lọc (khác sim_birthday_khach_theo_kich_ban trả cả tập). da_mo để Màn 1 xếp
-- khách đang làm dở (đã mở) lên trước.

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
with khach as (
  select * from public.sim_birthday_khach_key
  where khoang_cach_lo >= p_nguong_lo
    and nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (ngay = 1 and thang = 1))
    and (cardinality(p_dau_so) = 0 or dau_so = any(p_dau_so))
),
cap as (
  select kh.msisdn, kh.dob, kh.dau_so, k.digits
  from khach kh
  join public.sim_birthday_kho_key k
    -- 'all' (#57): gộp mọi kịch bản còn dùng (ddmmyy/yymmdd/ddmm) — khách hiện 1 lần.
    on (p_kich_ban = 'all'    and (k.duoi6 = kh.k_ddmmyy or k.duoi6 = kh.k_yymmdd or k.duoi4 = kh.k_ddmm))
    or (p_kich_ban = 'ddmmyy' and k.duoi6 = kh.k_ddmmyy)
    or (p_kich_ban = 'yymmdd' and k.duoi6 = kh.k_yymmdd)
    or (p_kich_ban = 'giua6'  and k.giua6 = kh.k_ddmmyy)
    or (p_kich_ban = 'ddmm'   and k.duoi4 = kh.k_ddmm)
    or (p_kich_ban = 'mmyy'   and k.duoi4 = kh.k_mmyy)
    or (p_kich_ban = 'yyyy'   and k.duoi4 = kh.k_yyyy)
),
gom as (
  -- distinct digits: gộp 'all' có thể trùng số qua nhiều kịch bản.
  select msisdn, dob, dau_so,
         count(*) as so_sim,
         string_agg(digits, ', ' order by digits) filter (where rn <= 5) as sim_goi_y
  from (
    select msisdn, dob, dau_so, digits,
           row_number() over (partition by msisdn order by digits) as rn
    from (select distinct msisdn, dob, dau_so, digits from cap) d
  ) t
  group by msisdn, dob, dau_so
),
loc as (
  select g.*, (mo.msisdn is not null) as da_mo
  from gom g
  left join public.sim_birthday_co_zalo cz on cz.msisdn = g.msisdn
  left join public.sim_birthday_ko_zalo kz on kz.msisdn = g.msisdn
  left join public.sim_birthday_da_mo   mo on mo.msisdn = g.msisdn
  where case when p_loc_tt = 'co_zalo' then cz.msisdn is not null
             else cz.msisdn is null and kz.msisdn is null end
),
final as (select *, count(*) over() as tong from loc)
select msisdn, dob, dau_so, so_sim, sim_goi_y, da_mo, tong
from final
order by case when p_loc_tt = 'chua' then da_mo::int else 0 end desc, so_sim desc, msisdn
limit greatest(1, least(p_limit, 500)) offset greatest(0, p_offset);
$$;

revoke all on function public.sim_birthday_khach_loc(text, bigint, int, int, boolean, text[], text, int, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
