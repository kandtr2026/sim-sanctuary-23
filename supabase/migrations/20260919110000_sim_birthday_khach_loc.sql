-- Sim Birthday — tách MÀN HÌNH thao tác (#55,#56) + gộp kịch bản (#57) + tối ưu 2,29tr.
--
-- Màn 1 = TẤT CẢ khách CHƯA lọc Zalo (chỉ phân loại) · Màn 2 = có Zalo (nhắn) ·
-- Màn 3 = ko Zalo. p_kich_ban='all' gộp mọi kịch bản (ddmmyy/yymmdd/ddmm).
--
-- ⚠️ HIỆU NĂNG ở quy mô 2,29 triệu khách (sau khi import đủ 3 sheet):
--   Bản SQL cũ (count(*) over() + gom số cho cả tập) chạy ~21s ở Màn 1 → timeout.
--   Nay tách 2 nhánh plpgsql:
--     - 'chua' (Màn 1, ~1tr): KHÔNG gom số, KHÔNG đếm tổng (client lấy tổng ≈
--       khach_sau_loc từ thống kê), sắp theo msisdn (pkey) để cắt trang sớm → ~250ms.
--     - 'co_zalo'/'ko_zalo' (tập nhỏ): giữ đếm tổng + gom số để chào → <100ms.

create or replace function public.sim_birthday_khach_loc(
  p_kich_ban  text,
  p_nguong_lo bigint  default 1000,
  p_nam_tu    int     default 1900,
  p_nam_den   int     default 2100,
  p_bo_0101   boolean default false,
  p_dau_so    text[]  default '{}',
  p_loc_tt    text    default 'chua',   -- 'chua' | 'co_zalo' | 'ko_zalo'
  p_limit     int     default 100,
  p_offset    int     default 0
)
returns table (msisdn text, dob date, dau_so text, so_sim bigint, sim_goi_y text, da_mo boolean, tong bigint)
language plpgsql stable as $$
declare lim int := greatest(1, least(p_limit, 500)); off int := greatest(0, p_offset);
begin
  if p_loc_tt = 'chua' then
    return query
      select k.msisdn, k.dob, k.dau_so, 0::bigint, null::text,
             (mo.msisdn is not null), null::bigint
      from public.sim_birthday_khach k
      left join public.sim_birthday_da_mo mo on mo.msisdn = k.msisdn
      where k.khoang_cach_lo >= p_nguong_lo
        and k.nam between p_nam_tu and p_nam_den
        and (not p_bo_0101 or not (k.ngay = 1 and k.thang = 1))
        and (cardinality(p_dau_so) = 0 or k.dau_so = any(p_dau_so))
        and not exists (select 1 from public.sim_birthday_co_zalo c where c.msisdn = k.msisdn)
        and not exists (select 1 from public.sim_birthday_ko_zalo z where z.msisdn = k.msisdn)
      order by k.msisdn
      limit lim offset off;
  else
    return query
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
                   else false end
          and (p_loc_tt <> 'co_zalo' or exists (
            select 1 from public.sim_birthday_kho_key x
            where x.duoi6 = k.k_ddmmyy or x.duoi6 = k.k_yymmdd or x.duoi4 = k.k_ddmm))
      ),
      page as (select *, count(*) over() as tong from cust order by da_mo desc, msisdn limit lim offset off),
      sims as (
        select p.msisdn, count(distinct kk.digits) as so_sim,
               (array_agg(distinct kk.digits order by kk.digits))[1:5] as goi5
        from page p
        join public.sim_birthday_kho_key kk
          on kk.duoi6 = p.k_ddmmyy or kk.duoi6 = p.k_yymmdd or kk.duoi4 = p.k_ddmm
        group by p.msisdn
      )
      select p.msisdn, p.dob, p.dau_so, coalesce(s.so_sim,0),
             array_to_string(s.goi5, ', '), p.da_mo, p.tong
      from page p left join sims s on s.msisdn = p.msisdn
      order by p.da_mo desc, p.msisdn;
  end if;
end;
$$;

revoke all on function public.sim_birthday_khach_loc(text, bigint, int, int, boolean, text[], text, int, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
