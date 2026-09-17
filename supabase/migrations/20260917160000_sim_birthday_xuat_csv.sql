-- Sim Birthday — xuất danh sách chào bán không bị trần 1000 hàng của PostgREST.
--
-- Route export gọi RPC trả về NHIỀU HÀNG nên bị `max-rows = 1000` cắt: kịch bản
-- "trùng trọn ngày sinh" có 30.572 khách mà file tải về chỉ 1.000 dòng, im lặng
-- mất 97% — đúng cái bẫy đã gặp khi đọc bảng sims.
--
-- Cách vòng qua: gom cả bảng thành MỘT giá trị text (string_agg) rồi trả về một
-- hàng duy nhất. Một request, không phân trang, không sót dòng nào.

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
  select
    kh.msisdn, kh.so_lien_he, kh.so_lien_he <> kh.msisdn as doi_so,
    kh.dob, ko.so_sim, array_to_string(ko.top5, ', ') as sim_goi_y
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
  so_lien_he || ',' || msisdn || ',' || (case when doi_so then 'x' else '' end) || ',' ||
  to_char(dob, 'DD/MM/YYYY') || ',' || so_sim::text || ',"' ||
  replace(coalesce(sim_goi_y, ''), '"', '""') || '"',
  E'\n' order by so_sim desc, msisdn
)
from cap;
$$;

revoke all on function public.sim_birthday_xuat_csv(text, bigint, int, int, boolean, text[], int) from public, anon, authenticated;
