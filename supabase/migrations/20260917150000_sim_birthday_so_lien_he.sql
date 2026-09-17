-- Sim Birthday — số liên hệ thật của khách + xem trước đỡ trùng lặp.
--
-- 1) Hơn nửa danh sách khách mang số 11 chữ số đầu 0121 — dạng số đã bị khai tử
--    từ đợt chuyển đổi 11 số → 10 số tháng 9/2018. Gọi thẳng vào đó là không ai
--    nghe máy. Cột `so_lien_he` quy đổi theo bảng chính thức của MobiFone:
--       0120→070  0121→079  0122→077  0126→076  0128→078
--    Số vốn đã 10 chữ số thì giữ nguyên.
--
-- 2) Hàm liệt kê khách trước đây xếp theo "số sim khớp giảm dần", nên hai chục
--    dòng đầu toàn người sinh CÙNG một ngày (ngày nào kho có nhiều số thì người
--    sinh ngày đó chiếm hết bảng). Thêm cờ `p_moi_ngay_mot_khach` để ô xem trước
--    trên màn quản trị lấy mỗi ngày sinh một người, nhìn ra được độ phủ; còn
--    bản xuất CSV vẫn lấy đủ danh sách.

alter table public.sim_birthday_khach
  add column if not exists so_lien_he text
  generated always as (
    case
      when msisdn like '0120%' then '070' || substr(msisdn, 5)
      when msisdn like '0121%' then '079' || substr(msisdn, 5)
      when msisdn like '0122%' then '077' || substr(msisdn, 5)
      when msisdn like '0126%' then '076' || substr(msisdn, 5)
      when msisdn like '0128%' then '078' || substr(msisdn, 5)
      else msisdn
    end
  ) stored;

comment on column public.sim_birthday_khach.so_lien_he is
  'Số gọi được: 11 số đầu 012x đã quy đổi sang 07x theo đợt chuyển đổi 9/2018.';

-- View phải dựng lại thì mới thấy cột mới (select * được cố định lúc tạo view).
drop view if exists public.sim_birthday_khach_key;
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

drop function if exists public.sim_birthday_khach_theo_kich_ban(text, bigint, int, int, boolean, text[], int, int);

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
  msisdn      text,
  so_lien_he  text,
  doi_so      boolean,
  dob         date,
  dau_so      text,
  so_sim      bigint,
  sim_goi_y   text
)
language sql
stable
as $$
with ko as (select * from public.sim_birthday_kho_gom(p_kich_ban)),
cap as (
  select
    kh.msisdn, kh.so_lien_he, kh.so_lien_he <> kh.msisdn as doi_so,
    kh.dob, kh.dau_so, ko.so_sim, array_to_string(ko.top5, ', ') as sim_goi_y,
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
select msisdn, so_lien_he, doi_so, dob, dau_so, so_sim, sim_goi_y
from cap
where not p_moi_ngay_mot_khach or hang_trong_ngay = 1
order by so_sim desc, msisdn
limit greatest(1, least(p_limit, 100000)) offset greatest(0, p_offset);
$$;

revoke all on function public.sim_birthday_khach_theo_kich_ban(text, bigint, int, int, boolean, text[], int, int, boolean) from public, anon, authenticated;
