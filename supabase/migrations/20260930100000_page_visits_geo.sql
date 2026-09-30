-- Vị trí (theo IP) cho page_visits → thống kê traffic theo tỉnh trên
-- /admin/dashboard?tab=traffic (A Khoa 30/09).
--
-- country/region/city do POST /api/track/visit ghi từ header geo của Vercel
-- (x-vercel-ip-country, x-vercel-ip-country-region = mã ISO 3166-2 bỏ "VN-" như
-- SG/HN/57, x-vercel-ip-city). Dòng cũ điền bù một lần bằng GeoIP offline (không
-- gửi IP khách ra dịch vụ ngoài). Quy về 34 tỉnh mới làm ở app (src/lib/vnProvince.ts).
-- Idempotent — chạy lại an toàn.

alter table public.page_visits add column if not exists country text;
alter table public.page_visits add column if not exists region text;
alter table public.page_visits add column if not exists city text;

-- View khách thật dùng `select v.*` — Postgres chốt danh sách cột lúc tạo view,
-- nên phải tạo lại thì view mới có 3 cột vừa thêm (cột mới nối cuối nên
-- CREATE OR REPLACE hợp lệ; quyền đã cấp giữ nguyên).
create or replace view public.page_visits_khach
with (security_invoker = on) as
select v.*
from public.page_visits v
where not public.is_internal_visit(v.ip, v.user_agent, v.visited_at);

-- Gom theo vị trí ngay trong DB (vài chục dòng thay vì kéo cả bảng — Supabase
-- chonso đang sát quota egress). p_all=false = chỉ khách thật (bỏ nội bộ + bot),
-- cùng điều kiện với daily_page_visits.
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
  where v.visited_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 14), 400)))
    and (coalesce(p_all, false) or not public.is_internal_visit(v.ip, v.user_agent, v.visited_at))
  group by 1, 2, 3
$$;

revoke execute on function public.geo_page_visits(integer, boolean) from public, anon;
grant execute on function public.geo_page_visits(integer, boolean) to authenticated, service_role;

notify pgrst, 'reload schema';
