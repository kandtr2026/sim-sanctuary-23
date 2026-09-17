-- Sim Birthday — khách ĐANG DÙNG số có đuôi là chính ngày sinh của mình (#41).
--
-- A Khoa muốn 1 màn xem "loại khách đang dùng đúng số sinh nhật của khách luôn".
-- Đây là những người đã tự chọn số theo ngày sinh → bằng chứng nhu cầu có thật
-- (dùng làm social proof / nhóm dễ upsell - giới thiệu). So khớp NGAY trên số của
-- chính khách: 6 số cuối = ddmmyy hoặc yymmdd, hoặc 4 số cuối = ddmm.
--
-- `tong` = tổng số khách tự-trùng (count over toàn tập, không đổi theo limit) để
-- frontend biết tổng mà phân trang. View đã loại 0121 (M2M) nên tự-trùng cũng sạch.

create or replace function public.sim_birthday_khach_tu_trung(
  p_limit  int default 100,
  p_offset int default 0
)
returns table (msisdn text, dob date, loai text, tong bigint)
language sql
stable
as $$
  with cap as (
    select
      msisdn, dob,
      case
        when right(msisdn, 6) = k_ddmmyy then 'ddmmyy'
        when right(msisdn, 6) = k_yymmdd then 'yymmdd'
        else 'ddmm'
      end as loai
    from public.sim_birthday_khach_key
    where right(msisdn, 6) = k_ddmmyy
       or right(msisdn, 6) = k_yymmdd
       or right(msisdn, 4) = k_ddmm
  )
  select msisdn, dob, loai, count(*) over() as tong
  from cap
  order by dob, msisdn
  limit greatest(1, least(p_limit, 100000)) offset greatest(0, p_offset);
$$;

revoke all on function public.sim_birthday_khach_tu_trung(int, int) from public, anon, authenticated;
