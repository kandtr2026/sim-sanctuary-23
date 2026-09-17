-- Sim Birthday — viết lại phép ghép theo lối GOM NHÓM THEO KHOÁ.
--
-- Bản đầu join thẳng khách × kho rồi count(distinct ...). Kịch bản loãng như
-- "trùng tháng + năm" sinh 1,34 triệu cặp, chạy quá 8 giây là PostgREST cắt
-- (statement timeout) → API trả 500.
--
-- Nhận xét gỡ được nút thắt: với một kịch bản, mỗi khách chỉ có ĐÚNG MỘT khoá
-- ghép, và mỗi sim cũng vậy. Nên chỉ cần gom hai bên về (khoá → số lượng) rồi
-- join hai bảng bé tí đó:
--     số khách = tổng khách của những khoá có trong kho
--     số sim   = tổng sim của những khoá có khách
--     số cặp   = tổng (khách_của_khoá × sim_của_khoá)
-- Khoá ddmmyy chỉ có ~9.800 giá trị, kho ~6.500 — join xong trong mili giây,
-- không đụng tới cả triệu cặp nào.

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
  select k_ddmmyy, k_yymmdd, k_ddmm, k_mmyy, k_yyyy, nam
  from public.sim_birthday_khach_key
  where khoang_cach_lo >= p_nguong_lo
    and nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (ngay = 1 and thang = 1))
    and (cardinality(p_dau_so) = 0 or dau_so = any(p_dau_so))
),
-- Khoá bên kho (gom 1 lần, dùng cho cả 6 kịch bản)
ko6 as (select duoi6 k, count(*) c from public.sim_birthday_kho group by 1),
kog as (select substr(digits, 4, 6) k, count(*) c from public.sim_birthday_kho group by 1),
ko4 as (select duoi4 k, count(*) c from public.sim_birthday_kho group by 1),
-- Khoá bên khách
kh_ddmmyy as (select k_ddmmyy k, count(*) c from khach group by 1),
kh_yymmdd as (select k_yymmdd k, count(*) c from khach group by 1),
kh_ddmm   as (select k_ddmm   k, count(*) c from khach group by 1),
kh_mmyy   as (select k_mmyy   k, count(*) c from khach group by 1),
kh_yyyy   as (select k_yyyy   k, count(*) c from khach group by 1),
gom as (
  select 'ddmmyy' as ma, coalesce(sum(a.c),0) so_khach, coalesce(sum(b.c),0) so_sim, coalesce(sum(a.c*b.c),0) so_cap
  from kh_ddmmyy a join ko6 b on b.k = a.k
  union all
  select 'yymmdd', coalesce(sum(a.c),0), coalesce(sum(b.c),0), coalesce(sum(a.c*b.c),0)
  from kh_yymmdd a join ko6 b on b.k = a.k
  union all
  select 'giua6', coalesce(sum(a.c),0), coalesce(sum(b.c),0), coalesce(sum(a.c*b.c),0)
  from kh_ddmmyy a join kog b on b.k = a.k
  union all
  select 'ddmm', coalesce(sum(a.c),0), coalesce(sum(b.c),0), coalesce(sum(a.c*b.c),0)
  from kh_ddmm a join ko4 b on b.k = a.k
  union all
  select 'mmyy', coalesce(sum(a.c),0), coalesce(sum(b.c),0), coalesce(sum(a.c*b.c),0)
  from kh_mmyy a join ko4 b on b.k = a.k
  union all
  select 'yyyy', coalesce(sum(a.c),0), coalesce(sum(b.c),0), coalesce(sum(a.c*b.c),0)
  from kh_yyyy a join ko4 b on b.k = a.k
),
-- Khách khớp NHIỀU kịch bản thì không được cộng dồn. Nhưng cũng không cần soi
-- từng người: mọi khoá của một khách đều suy ra từ ngày sinh, nên gom khách
-- theo bộ khoá (chỉ ~9.800 tổ hợp cho cả trăm nghìn người) rồi cộng số lượng.
tap6 as (select distinct k from ko6),
tapg as (select distinct k from kog),
tap4 as (select distinct k from ko4),
nhom as (
  select k_ddmmyy a, k_yymmdd b, k_ddmm c, k_mmyy d, k_yyyy e, count(*) n
  from khach group by 1, 2, 3, 4, 5
),
danh_dau as (
  select
    n,
    (a in (select k from tap6) or b in (select k from tap6)) as tron_ngay,
    (a in (select k from tap6) or b in (select k from tap6)
     or a in (select k from tapg)
     or c in (select k from tap4) or d in (select k from tap4)
     or e in (select k from tap4)) as bat_ky
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
        ('giua6',  'Ngày sinh nằm giữa dãy',      'Đủ ngày sinh nhưng không ở đuôi: 09-150701-x',                      3, 'kha'),
        ('ddmm',   'Trùng ngày + tháng',          'Đúng sinh nhật nhưng khác năm: sinh 15/07 → …1507',                 4, 'kha'),
        ('yyyy',   'Trùng năm sinh (4 số)',       'Đuôi là năm sinh đủ bốn số: …2001',                                 5, 'kha'),
        ('mmyy',   'Trùng tháng + năm',           'Đúng tháng và năm sinh: sinh 07/2001 → …0701',                      6, 'loang')
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

-- Kho gom theo khoá của MỘT kịch bản, kèm sẵn 5 số đầu để hiện "sim gợi ý".
create or replace function public.sim_birthday_kho_gom(p_kich_ban text)
returns table (k text, so_sim bigint, top5 text[])
language sql
stable
as $$
  select
    case p_kich_ban
      when 'giua6'  then substr(digits, 4, 6)
      when 'ddmmyy' then duoi6
      when 'yymmdd' then duoi6
      else duoi4
    end as k,
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
      when 'giua6'  then k_ddmmyy
      when 'ddmm'   then k_ddmm
      when 'mmyy'   then k_mmyy
      else k_yyyy
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
join kh on kh.k = case p_kich_ban
                    when 'giua6'  then substr(s.digits, 4, 6)
                    when 'ddmmyy' then s.duoi6
                    when 'yymmdd' then s.duoi6
                    else s.duoi4
                  end
order by kh.c desc, s.digits
limit greatest(1, least(p_limit, 500));
$$;

create or replace function public.sim_birthday_khach_theo_kich_ban(
  p_kich_ban  text,
  p_nguong_lo bigint  default 1000,
  p_nam_tu    int     default 1950,
  p_nam_den   int     default 2015,
  p_bo_0101   boolean default false,
  p_dau_so    text[]  default '{}',
  p_limit     int     default 100,
  p_offset    int     default 0
)
returns table (msisdn text, dob date, dau_so text, so_sim bigint, sim_goi_y text)
language sql
stable
as $$
with ko as (select * from public.sim_birthday_kho_gom(p_kich_ban))
select
  kh.msisdn, kh.dob, kh.dau_so, ko.so_sim,
  array_to_string(ko.top5, ', ')
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
limit greatest(1, least(p_limit, 100000)) offset greatest(0, p_offset);
$$;

revoke all on function public.sim_birthday_thong_ke(bigint, int, int, boolean, text[]) from public, anon, authenticated;
revoke all on function public.sim_birthday_kho_gom(text) from public, anon, authenticated;
revoke all on function public.sim_birthday_top_sim(text, bigint, int, int, boolean, text[], int) from public, anon, authenticated;
revoke all on function public.sim_birthday_khach_theo_kich_ban(text, bigint, int, int, boolean, text[], int, int) from public, anon, authenticated;
