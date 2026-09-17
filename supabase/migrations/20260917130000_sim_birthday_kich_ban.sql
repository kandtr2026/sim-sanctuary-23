-- Sim Birthday — các KỊCH BẢN ghép khách ↔ số, tính hết trong SQL.
--
-- Mỗi kịch bản là một cách "số mang ngày sinh của khách". Xếp từ mạnh (khách
-- nhìn phát nhận ra ngay ngày sinh mình) xuống loãng (chỉ trùng một phần):
--
--   ddmmyy  0938 15 07 01  ← sinh 15/07/2001, cách người Việt đọc ngày. Mạnh nhất.
--   yymmdd  0938 01 07 15  ← cùng ngày đó nhưng đọc ngược, dân kỹ thuật hay dùng.
--   ddmm    0938 xx 15 07  ← đúng ngày + tháng, khác năm. Vẫn là "sinh nhật của anh".
--   mmyy    0938 xx 07 01  ← đúng tháng + năm sinh.
--   yyyy    0938 xx 2001   ← đuôi là năm sinh đủ 4 số.
--   giua6   09 150701 xx   ← ngày sinh nằm giữa dãy chứ không ở đuôi.
--
-- Bộ lọc chất lượng khách (dùng chung cho mọi kịch bản):
--   p_nguong_lo  khoảng cách dãy số tối thiểu tới thuê bao cùng ngày sinh. Sim
--                đại lý đăng ký hàng loạt nằm liền dãy nên khoảng cách bé tí;
--                đặt 1000 là loại sạch nhóm đó. Đặt 0 = lấy tất, kể cả lô.
--   p_nam_tu / p_nam_den   dải năm sinh muốn nhắm.
--   p_bo_0101    bỏ người khai sinh 01/01 (ngày mặc định khi đăng ký cho có).
--   p_dau_so     chỉ lấy khách đang dùng các đầu số này (rỗng = lấy hết).

-- View gắn sẵn khoá ghép cho từng khách, khỏi lặp lpad ở mọi chỗ.
create or replace view public.sim_birthday_khach_key as
select
  k.*,
  lpad(k.ngay::text, 2, '0') || lpad(k.thang::text, 2, '0') || lpad(k.nam_yy::text, 2, '0') as k_ddmmyy,
  lpad(k.nam_yy::text, 2, '0') || lpad(k.thang::text, 2, '0') || lpad(k.ngay::text, 2, '0') as k_yymmdd,
  lpad(k.ngay::text, 2, '0') || lpad(k.thang::text, 2, '0')                                 as k_ddmm,
  lpad(k.thang::text, 2, '0') || lpad(k.nam_yy::text, 2, '0')                               as k_mmyy,
  k.nam::text                                                                               as k_yyyy
from public.sim_birthday_khach k;

-- Cột "6 số giữa" của mỗi sim: bỏ 3 số đầu (đầu số nhà mạng) rồi lấy 6 số kế.
-- Nhờ vậy kịch bản `giua6` cũng so bằng dấu bằng, không phải quét LIKE '%...%'.
create or replace view public.sim_birthday_kho_key as
select k.*, substr(k.digits, 4, 6) as giua6
from public.sim_birthday_kho k;

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
  select *
  from public.sim_birthday_khach_key
  where khoang_cach_lo >= p_nguong_lo
    and nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (ngay = 1 and thang = 1))
    and (cardinality(p_dau_so) = 0 or dau_so = any(p_dau_so))
),
kho as (select * from public.sim_birthday_kho_key),
kb as (
  select 'ddmmyy' as ma, kh.msisdn, k.digits
  from khach kh join kho k on k.duoi6 = kh.k_ddmmyy
  union all
  select 'yymmdd', kh.msisdn, k.digits
  from khach kh join kho k on k.duoi6 = kh.k_yymmdd
  union all
  select 'ddmm', kh.msisdn, k.digits
  from khach kh join kho k on k.duoi4 = kh.k_ddmm
  union all
  select 'mmyy', kh.msisdn, k.digits
  from khach kh join kho k on k.duoi4 = kh.k_mmyy
  union all
  select 'yyyy', kh.msisdn, k.digits
  from khach kh join kho k on k.duoi4 = kh.k_yyyy
  union all
  select 'giua6', kh.msisdn, k.digits
  from khach kh join kho k on k.giua6 = kh.k_ddmmyy
),
gom as (
  select ma,
         count(distinct msisdn) as so_khach,
         count(distinct digits) as so_sim,
         count(*)               as so_cap
  from kb group by ma
),
-- Khách nào có ÍT NHẤT một số trùng trọn ngày sinh (ddmmyy hoặc yymmdd) —
-- đây mới là danh sách đáng gọi trước.
tron_ngay as (
  select count(distinct msisdn) as so_khach
  from kb where ma in ('ddmmyy', 'yymmdd')
),
bat_ky as (select count(distinct msisdn) as so_khach from kb)
select jsonb_build_object(
  'tong', jsonb_build_object(
    'kho',            (select count(*) from kho),
    'kho_hop_le',     (select count(*) from kho where hop_le),
    'kho_co_gia',     (select count(*) from kho where gia is not null),
    'khach_tat_ca',   (select count(*) from public.sim_birthday_khach),
    'khach_sau_loc',  (select count(*) from khach),
    'khach_tron_ngay',(select so_khach from tron_ngay),
    'khach_bat_ky',   (select so_khach from bat_ky)
  ),
  'kich_ban', (
    select coalesce(jsonb_agg(x order by x.thu_tu), '[]'::jsonb)
    from (
      select
        d.ma, d.ten, d.mo_ta, d.thu_tu, d.suc_manh,
        coalesce(g.so_khach, 0) as so_khach,
        coalesce(g.so_sim, 0)   as so_sim,
        coalesce(g.so_cap, 0)   as so_cap
      from (values
        ('ddmmyy', 'Trùng trọn ngày sinh',        'Bốn số cuối trở đi là ngày sinh đọc kiểu Việt: sinh 15/07/2001 → …150701', 1, 'manh'),
        ('yymmdd', 'Trùng trọn ngày sinh (ngược)','Cùng ngày đó đọc kiểu năm-tháng-ngày: …010715',                          2, 'manh'),
        ('giua6',  'Ngày sinh nằm giữa dãy',      'Đủ ngày sinh nhưng không ở đuôi: 09-150701-xx',                          3, 'kha'),
        ('ddmm',   'Trùng ngày + tháng',          'Đúng sinh nhật nhưng khác năm: sinh 15/07 → …1507',                      4, 'kha'),
        ('yyyy',   'Trùng năm sinh (4 số)',       'Đuôi là năm sinh đủ bốn số: …2001',                                      5, 'kha'),
        ('mmyy',   'Trùng tháng + năm',           'Đúng tháng và năm sinh: sinh 07/2001 → …0701',                           6, 'loang')
      ) as d(ma, ten, mo_ta, thu_tu, suc_manh)
      left join gom g on g.ma = d.ma
    ) x
  ),
  'phan_bo_nam', (
    select coalesce(jsonb_agg(jsonb_build_object('nam', nam, 'so_khach', c) order by nam), '[]'::jsonb)
    from (select nam, count(*) c from khach group by nam) t
  ),
  -- Đầu số khách đang dùng: 090/093 là thuê bao gắn bó lâu năm, 012x là số 11
  -- chữ số kiểu cũ. Vừa để xem, vừa là nguồn cho ô lọc đầu số trên màn quản trị
  -- (lọc trên toàn bảng, không phụ thuộc bộ lọc đang đặt).
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

-- Chi tiết một kịch bản: số nào trong kho đang "đắt khách" nhất.
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
with khach as (
  select *
  from public.sim_birthday_khach_key
  where khoang_cach_lo >= p_nguong_lo
    and nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (ngay = 1 and thang = 1))
    and (cardinality(p_dau_so) = 0 or dau_so = any(p_dau_so))
),
cap as (
  select k.digits, kh.msisdn
  from khach kh
  join public.sim_birthday_kho_key k
    on (p_kich_ban = 'ddmmyy' and k.duoi6 = kh.k_ddmmyy)
    or (p_kich_ban = 'yymmdd' and k.duoi6 = kh.k_yymmdd)
    or (p_kich_ban = 'giua6'  and k.giua6 = kh.k_ddmmyy)
    or (p_kich_ban = 'ddmm'   and k.duoi4 = kh.k_ddmm)
    or (p_kich_ban = 'mmyy'   and k.duoi4 = kh.k_mmyy)
    or (p_kich_ban = 'yyyy'   and k.duoi4 = kh.k_yyyy)
)
select k.digits, k.dau_so, k.duoi6,
       case when k.hop_le
            then lpad(k.ngay::text,2,'0') || '/' || lpad(k.thang::text,2,'0') || '/' || lpad(k.nam_yy::text,2,'0')
            else '—' end as ngay_dai_dien,
       k.gia,
       count(distinct c.msisdn) as so_khach
from cap c
join public.sim_birthday_kho k on k.digits = c.digits
group by k.digits, k.dau_so, k.duoi6, k.hop_le, k.ngay, k.thang, k.nam_yy, k.gia
order by count(distinct c.msisdn) desc, k.digits
limit greatest(1, least(p_limit, 500));
$$;

-- Danh sách khách để chào theo một kịch bản (dùng cho xem trước + xuất CSV).
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
with khach as (
  select *
  from public.sim_birthday_khach_key
  where khoang_cach_lo >= p_nguong_lo
    and nam between p_nam_tu and p_nam_den
    and (not p_bo_0101 or not (ngay = 1 and thang = 1))
    and (cardinality(p_dau_so) = 0 or dau_so = any(p_dau_so))
),
cap as (
  select kh.msisdn, kh.dob, kh.dau_so, k.digits
  from khach kh
  join public.sim_birthday_kho_key k
    on (p_kich_ban = 'ddmmyy' and k.duoi6 = kh.k_ddmmyy)
    or (p_kich_ban = 'yymmdd' and k.duoi6 = kh.k_yymmdd)
    or (p_kich_ban = 'giua6'  and k.giua6 = kh.k_ddmmyy)
    or (p_kich_ban = 'ddmm'   and k.duoi4 = kh.k_ddmm)
    or (p_kich_ban = 'mmyy'   and k.duoi4 = kh.k_mmyy)
    or (p_kich_ban = 'yyyy'   and k.duoi4 = kh.k_yyyy)
)
select msisdn, dob, dau_so,
       count(*) as so_sim,
       string_agg(digits, ', ' order by digits) filter (where rn <= 5) as sim_goi_y
from (
  select *, row_number() over (partition by msisdn order by digits) as rn
  from cap
) t
group by msisdn, dob, dau_so
order by count(*) desc, msisdn
limit greatest(1, least(p_limit, 100000)) offset greatest(0, p_offset);
$$;

-- Chỉ service role được gọi: dữ liệu khách là thông tin cá nhân.
revoke all on function public.sim_birthday_thong_ke(bigint, int, int, boolean, text[]) from public, anon, authenticated;
revoke all on function public.sim_birthday_top_sim(text, bigint, int, int, boolean, text[], int) from public, anon, authenticated;
revoke all on function public.sim_birthday_khach_theo_kich_ban(text, bigint, int, int, boolean, text[], int, int) from public, anon, authenticated;
revoke all on public.sim_birthday_khach_key from public, anon, authenticated;
revoke all on public.sim_birthday_kho_key from public, anon, authenticated;
