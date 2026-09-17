-- Sim Birthday — bỏ ba kịch bản loãng, chỉ giữ cái chào bán được.
--
-- A Khoa chốt 17/09: bỏ `mmyy` (trùng tháng + năm), `yyyy` (trùng năm sinh 4 số)
-- và `giua6` (ngày sinh nằm giữa dãy). Lý do thấy rõ ngay trên số liệu: `mmyy`
-- phủ 96% khách nên chào kiểu đó khách chẳng thấy gì đặc biệt; `yyyy` không ghép
-- được số nào vì kho toàn đuôi ddmmyy; `giua6` chỉ với tới 556 người.
--
-- Còn lại ba kịch bản, đều là "khách nhìn phát nhận ra ngày sinh mình":
--   ddmmyy  0938 150701   sinh 15/07/2001, cách đọc của người Việt
--   yymmdd  0938 010715   cùng ngày đó, đọc năm - tháng - ngày
--   ddmm    0938 xx 1507  đúng sinh nhật, khác năm

create or replace function public.sim_birthday_thong_ke(
  p_nguong_lo bigint   default 1000,
  p_nam_tu    int      default 1950,
  p_nam_den   int      default 2015,
  p_bo_0101   boolean  default false,
  p_dau_so    text[]   default '{}'
)
returns jsonb
language sql
stable
as $$
with khach as (
  select k_ddmmyy, k_yymmdd, k_ddmm, nam
  from public.sim_birthday_khach_key
  where khoang_cach_lo >= p_nguong_lo
    and nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (ngay = 1 and thang = 1))
    and (cardinality(p_dau_so) = 0 or dau_so = any(p_dau_so))
),
ko6 as (select duoi6 k, count(*) c from public.sim_birthday_kho group by 1),
ko4 as (select duoi4 k, count(*) c from public.sim_birthday_kho group by 1),
kh_ddmmyy as (select k_ddmmyy k, count(*) c from khach group by 1),
kh_yymmdd as (select k_yymmdd k, count(*) c from khach group by 1),
kh_ddmm   as (select k_ddmm   k, count(*) c from khach group by 1),
gom as (
  select 'ddmmyy' as ma, coalesce(sum(a.c),0) so_khach, coalesce(sum(b.c),0) so_sim, coalesce(sum(a.c*b.c),0) so_cap
  from kh_ddmmyy a join ko6 b on b.k = a.k
  union all
  select 'yymmdd', coalesce(sum(a.c),0), coalesce(sum(b.c),0), coalesce(sum(a.c*b.c),0)
  from kh_yymmdd a join ko6 b on b.k = a.k
  union all
  select 'ddmm', coalesce(sum(a.c),0), coalesce(sum(b.c),0), coalesce(sum(a.c*b.c),0)
  from kh_ddmm a join ko4 b on b.k = a.k
),
-- Một khách có thể khớp nhiều kịch bản nên không cộng dồn được. Gom khách theo
-- bộ khoá (chỉ ~9.800 tổ hợp) rồi cộng số lượng.
tap6 as (select distinct k from ko6),
tap4 as (select distinct k from ko4),
nhom as (
  select k_ddmmyy a, k_yymmdd b, k_ddmm c, count(*) n
  from khach group by 1, 2, 3
),
danh_dau as (
  select
    n,
    (a in (select k from tap6) or b in (select k from tap6)) as tron_ngay,
    (a in (select k from tap6) or b in (select k from tap6) or c in (select k from tap4)) as bat_ky
  from nhom
)
select jsonb_build_object(
  'tong', jsonb_build_object(
    'kho',            (select count(*) from public.sim_birthday_kho),
    'kho_hop_le',     (select count(*) from public.sim_birthday_kho where hop_le),
    'kho_co_gia',     (select count(*) from public.sim_birthday_kho where gia is not null),
    'khach_tat_ca',   (select count(*) from public.sim_birthday_khach),
    'khach_sau_loc',  (select count(*) from khach),
    'khach_tron_ngay',(select coalesce(sum(n) filter (where tron_ngay), 0) from danh_dau),
    'khach_bat_ky',   (select coalesce(sum(n) filter (where bat_ky), 0) from danh_dau)
  ),
  'kich_ban', (
    select coalesce(jsonb_agg(x order by x.thu_tu), '[]'::jsonb)
    from (
      select d.ma, d.ten, d.mo_ta, d.thu_tu, d.suc_manh,
             coalesce(g.so_khach, 0) as so_khach,
             coalesce(g.so_sim, 0)   as so_sim,
             coalesce(g.so_cap, 0)   as so_cap
      from (values
        ('ddmmyy', 'Trùng trọn ngày sinh',        'Sáu số cuối là ngày sinh đọc kiểu Việt: sinh 15/07/2001 → …150701', 1, 'manh'),
        ('yymmdd', 'Trùng trọn ngày sinh (ngược)','Cùng ngày đó đọc kiểu năm-tháng-ngày: …010715',                     2, 'manh'),
        ('ddmm',   'Trùng ngày + tháng',          'Đúng sinh nhật nhưng khác năm: sinh 15/07 → …1507',                 3, 'kha')
      ) as d(ma, ten, mo_ta, thu_tu, suc_manh)
      left join gom g on g.ma = d.ma
    ) x
  ),
  'phan_bo_nam', (
    select coalesce(jsonb_agg(jsonb_build_object('nam', nam, 'so_khach', c) order by nam), '[]'::jsonb)
    from (select nam, count(*) c from khach group by nam) t
  ),
  'phan_bo_dau_so', (
    select coalesce(jsonb_agg(jsonb_build_object('dau_so', dau_so, 'so_khach', c) order by c desc), '[]'::jsonb)
    from (select dau_so, count(*) c from public.sim_birthday_khach group by dau_so) t
  ),
  'bo_loc', jsonb_build_object(
    'nguong_lo', p_nguong_lo, 'nam_tu', p_nam_tu, 'nam_den', p_nam_den,
    'bo_0101', p_bo_0101, 'dau_so', p_dau_so
  )
);
$$;

-- Ba hàm còn lại chỉ cần biết lấy khoá nào: 6 số cuối cho hai kịch bản trọn
-- ngày, 4 số cuối cho ngày+tháng. Bỏ luôn nhánh của các kịch bản đã gỡ để
-- không ai gọi nhầm bằng tay.
create or replace function public.sim_birthday_kho_gom(p_kich_ban text)
returns table (k text, so_sim bigint, top5 text[])
language sql
stable
as $$
  select
    case when p_kich_ban in ('ddmmyy', 'yymmdd') then duoi6 else duoi4 end as k,
    count(*),
    (array_agg(digits order by digits))[1:5]
  from public.sim_birthday_kho
  group by 1;
$$;

create or replace function public.sim_birthday_top_sim(
  p_kich_ban  text,
  p_nguong_lo bigint  default 1000,
  p_nam_tu    int     default 1950,
  p_nam_den   int     default 2015,
  p_bo_0101   boolean default false,
  p_dau_so    text[]  default '{}',
  p_limit     int     default 50
)
returns table (digits text, dau_so text, duoi6 text, ngay_dai_dien text, gia bigint, so_khach bigint)
language sql
stable
as $$
with kh as (
  select
    case p_kich_ban
      when 'ddmmyy' then k_ddmmyy
      when 'yymmdd' then k_yymmdd
      else k_ddmm
    end as k,
    count(*) as c
  from public.sim_birthday_khach_key
  where khoang_cach_lo >= p_nguong_lo
    and nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (ngay = 1 and thang = 1))
    and (cardinality(p_dau_so) = 0 or dau_so = any(p_dau_so))
  group by 1
)
select
  s.digits, s.dau_so, s.duoi6,
  case when s.hop_le
       then lpad(s.ngay::text,2,'0') || '/' || lpad(s.thang::text,2,'0') || '/' || lpad(s.nam_yy::text,2,'0')
       else '—' end,
  s.gia,
  kh.c
from public.sim_birthday_kho s
join kh on kh.k = case when p_kich_ban in ('ddmmyy', 'yymmdd') then s.duoi6 else s.duoi4 end
order by kh.c desc, s.digits
limit greatest(1, least(p_limit, 500));
$$;

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
returns table (msisdn text, dob date, dau_so text, so_sim bigint, sim_goi_y text)
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
                      else kh.k_ddmm
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
                      else kh.k_ddmm
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

revoke all on function public.sim_birthday_thong_ke(bigint, int, int, boolean, text[]) from public, anon, authenticated;
revoke all on function public.sim_birthday_kho_gom(text) from public, anon, authenticated;
revoke all on function public.sim_birthday_top_sim(text, bigint, int, int, boolean, text[], int) from public, anon, authenticated;
revoke all on function public.sim_birthday_khach_theo_kich_ban(text, bigint, int, int, boolean, text[], int, int, boolean) from public, anon, authenticated;
revoke all on function public.sim_birthday_xuat_csv(text, bigint, int, int, boolean, text[], int) from public, anon, authenticated;
