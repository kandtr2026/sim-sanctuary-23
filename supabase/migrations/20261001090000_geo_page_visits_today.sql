-- Traffic theo tỉnh: thêm view "Hôm nay vs Hôm qua" + khớp mốc ngày với biểu đồ
-- (A Khoa 01/10).
--
-- 1) geo_page_visits đếm lùi đúng p_days × 24 giờ, còn biểu đồ "Lượt truy cập mỗi
--    ngày" cộng theo NGÀY LỊCH giờ VN → cùng "14 ngày" mà ra 525 vs 513 lượt (dính
--    thêm một phần ngày thứ 15). Đổi sang ngày lịch: p_days = hôm nay + (p_days−1)
--    ngày trước, tính từ 00:00 giờ VN.
-- 2) geo_page_visits_today: hôm nay / hôm qua theo vị trí, kèm "hôm qua CÙNG GIỜ"
--    (tới đúng giờ:phút hiện tại) — hôm nay mới chạy một phần ngày, so thẳng với
--    cả ngày hôm qua thì lúc nào cũng ra giảm.
-- Idempotent. Cùng điều kiện "khách thật" với daily_page_visits.

create or replace function public.geo_page_visits(p_days integer default 14, p_all boolean default false)
returns table (country text, region text, city text, luot bigint, khach bigint)
language sql
stable
set search_path = ''
as $$
  select v.country, v.region, v.city,
         count(*)::bigint as luot,
         count(distinct nullif(btrim(v.ip), ''))::bigint as khach
  from public.page_visits v
  where v.visited_at >= (
          ((now() at time zone 'Asia/Ho_Chi_Minh')::date - (greatest(1, least(coalesce(p_days, 14), 400)) - 1))::timestamp
          at time zone 'Asia/Ho_Chi_Minh'
        )
    and (coalesce(p_all, false) or not public.is_internal_visit(v.ip, v.user_agent, v.visited_at))
  group by 1, 2, 3
$$;

create or replace function public.geo_page_visits_today(p_all boolean default false)
returns table (
  country text, region text, city text,
  hn_luot bigint, hn_khach bigint,        -- hôm nay (tới hiện tại)
  hq_cg_luot bigint, hq_cg_khach bigint,  -- hôm qua, tới cùng giờ:phút
  hq_luot bigint, hq_khach bigint         -- hôm qua cả ngày
)
language sql
stable
set search_path = ''
as $$
  with moc as (
    select (now() at time zone 'Asia/Ho_Chi_Minh')::date as hom_nay,
           (now() at time zone 'Asia/Ho_Chi_Minh')::time as gio
  ),
  v as (
    select pv.country, pv.region, pv.city,
           nullif(btrim(pv.ip), '') as ip,
           (pv.visited_at at time zone 'Asia/Ho_Chi_Minh')::date as d,
           (pv.visited_at at time zone 'Asia/Ho_Chi_Minh')::time as t
    from public.page_visits pv, moc m
    where pv.visited_at >= ((m.hom_nay - 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')
      and (coalesce(p_all, false) or not public.is_internal_visit(pv.ip, pv.user_agent, pv.visited_at))
  )
  select v.country, v.region, v.city,
         count(*) filter (where v.d = m.hom_nay)::bigint,
         count(distinct v.ip) filter (where v.d = m.hom_nay)::bigint,
         count(*) filter (where v.d = m.hom_nay - 1 and v.t <= m.gio)::bigint,
         count(distinct v.ip) filter (where v.d = m.hom_nay - 1 and v.t <= m.gio)::bigint,
         count(*) filter (where v.d = m.hom_nay - 1)::bigint,
         count(distinct v.ip) filter (where v.d = m.hom_nay - 1)::bigint
  from v, moc m
  group by 1, 2, 3
$$;

revoke execute on function public.geo_page_visits_today(boolean) from public, anon;
grant execute on function public.geo_page_visits_today(boolean) to authenticated, service_role;

notify pgrst, 'reload schema';
