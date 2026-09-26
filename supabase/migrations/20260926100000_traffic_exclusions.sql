-- Loại traffic NỘI BỘ (người nhà / nhân viên / máy admin / VPS) và BOT khỏi thống
-- kê /admin/dashboard?tab=traffic (A Khoa 26/09).
--
-- Số đo thật trước khi làm: 14 ngày có ~7,6k lượt page_visits nhưng ~4,2k là bot
-- (Googlebot, meta-externalagent…) và ~2,1k từ 1 IP văn phòng (1.53.114.105) —
-- khách thật chỉ là phần nhỏ còn lại. Không lọc thì biểu đồ "Lượt truy cập mỗi
-- ngày" nói sai hoàn toàn.
--
-- Thiết kế (đã chốt):
--   * Chỉ loại IP CHÍNH XÁC, KHÔNG loại theo dải /24 — văn phòng NAT ra 1 IP công
--     cộng; IP 4G (103.199.x…) là CGNAT dùng chung với khách thật.
--   * IP admin chỉ bị loại TRONG KHUNG THỜI GIAN phiên đăng nhập: từ
--     min(created_at) − 1 ngày đến max(lần refresh) + 1 ngày; phiên còn hoạt động
--     (refresh trong 1 ngày qua) thì valid_to = NULL (mở).
--   * Luật "dáng nhân viên" (30 ngày gần nhất, đã bỏ bot): ≥4 ngày khác nhau VÀ
--     ≥6 giờ-trong-ngày khác nhau → 'staff'; có ngày ≥150 lượt từ 1 IP → 'heavy'.
--   * A Khoa sửa tay được: tắt 1 dòng (active=false, auto=false) — refresh KHÔNG
--     bao giờ đụng lại dòng auto=false; hoặc thêm IP tay (reason 'manual').
--   * Bot: regex user-agent + dải IP crawler Google (66.249.64.0/19) và Meta
--     (57.141.0.0/16).
--
-- Mọi thống kê "khách thật" đọc qua view *_khach hoặc RPC daily_page_visits
-- (p_all=false). Idempotent — chạy lại nhiều lần an toàn.

-- ─── 1. Bảng danh sách IP bị loại ────────────────────────────────────────────
create table if not exists public.traffic_exclusions (
  id bigint generated always as identity primary key,
  ip text not null,
  reason text not null check (reason in ('admin', 'staff', 'heavy', 'server', 'manual')),
  note text,
  valid_from timestamptz,   -- NULL = từ trước tới giờ
  valid_to timestamptz,     -- NULL = còn mở (vẫn đang loại)
  active boolean not null default true,
  -- auto=true: do hệ thống quản (refresh_traffic_exclusions được sửa khung giờ).
  -- auto=false: A Khoa đã sửa tay / thêm tay → hệ thống không bao giờ đụng lại.
  auto boolean not null default true,
  created_at timestamptz default now(),
  -- Dòng admin tự động: updated_at = lần cuối THẤY máy admin dùng IP này (phiên
  -- auth hoặc gọi API admin) — dùng để chốt valid_to khi IP rời phiên.
  updated_at timestamptz default now(),
  unique (ip, reason)
);

comment on table public.traffic_exclusions is
  'IP nội bộ/máy chủ bị loại khỏi thống kê khách (dashboard traffic). Xem migration 20260926100000.';

alter table public.traffic_exclusions enable row level security;

revoke all on table public.traffic_exclusions from anon;

drop policy if exists "traffic_exclusions: admin all" on public.traffic_exclusions;
create policy "traffic_exclusions: admin all"
  on public.traffic_exclusions for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- ─── 2. IP cho conversion_clicks (server ghi qua POST /api/track/click) ──────
alter table public.conversion_clicks add column if not exists ip text;

create index if not exists conversion_clicks_ip_idx on public.conversion_clicks (ip);

-- ─── 3. Hàm nhận diện ────────────────────────────────────────────────────────

-- text → inet, NULL nếu rỗng/sai. IPv4 hợp lệ đi đường regex; chuỗi có dáng
-- IPv6 thì kiểm bằng pg_input_is_valid (PG16+, prod đang 17) — KHÔNG dùng khối
-- EXCEPTION: nó mở sub-transaction, hàm như vậy không được khai PARALLEL SAFE
-- (query song song gặp IP v6 sẽ lỗi "cannot start subtransactions during a
-- parallel operation" khi page_visits vượt 8MB và planner chọn parallel scan).
create or replace function public.safe_inet(p text)
returns inet
language plpgsql
immutable
parallel safe
set search_path = ''
as $$
declare
  t text := btrim(p);
begin
  if t is null or t = '' then
    return null;
  end if;
  if t ~ '^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$' then
    return t::inet;
  end if;
  if position(':' in t) > 0
     and t ~ '^[0-9A-Fa-f:.]{2,45}$'
     and pg_catalog.pg_input_is_valid(t, 'inet') then
    return t::inet;
  end if;
  return null;
end;
$$;

-- Lưu IP ở dạng chuẩn host(inet) dù ghi từ đâu (API, SQL editor) — is_internal_visit
-- so khớp bằng dạng chuẩn này. BEFORE trigger chạy trước khi xét ON CONFLICT.
create or replace function public.traffic_exclusions_normalize_ip()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.ip := coalesce(host(public.safe_inet(new.ip)), btrim(new.ip));
  return new;
end;
$$;

drop trigger if exists traffic_exclusions_normalize_ip on public.traffic_exclusions;
create trigger traffic_exclusions_normalize_ip
  before insert or update of ip on public.traffic_exclusions
  for each row execute function public.traffic_exclusions_normalize_ip();

-- Bot = user-agent khớp regex crawler/công cụ HOẶC IP thuộc dải crawler
-- Google (66.249.64.0/19) / Meta (57.141.0.0/16).
-- Ngoài danh sách gốc có thêm: googleother / google-safety / mediapartners-google
-- / feedfetcher / apis-google (crawler Google không có chữ "bot", đo thật thấy
-- ~99 lượt GoogleOther/14 ngày từ 192.178.x) và "claude" (trình duyệt nhúng của
-- Claude Desktop dùng để kiểm web — chỉ máy nội bộ có).
create or replace function public.is_bot_visit(p_ua text, p_ip text)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select
    coalesce(p_ua, '') ~* '(bot|crawl|spider|slurp|googlebot|google-inspectiontool|googleother|google-safety|mediapartners-google|feedfetcher|apis-google|adsbot|bingbot|yandex|baiduspider|petalbot|bytespider|ahrefs|semrush|mj12|dotbot|facebookexternalhit|meta-externalagent|headlesschrome|lighthouse|pagespeed|python|curl|wget|axios|^node$|go-http-client|java/|claude)'
    or coalesce(
      public.safe_inet(p_ip) <<= any (array['66.249.64.0/19', '57.141.0.0/16']::inet[]),
      false
    )
$$;

-- Nội bộ = bot HOẶC IP có dòng traffic_exclusions đang bật mà thời điểm lượt
-- xem nằm trong [valid_from, valid_to] (NULL = không chặn đầu đó).
-- SECURITY DEFINER để view security_invoker / client admin gọi được mà không cần
-- quyền đọc trực tiếp bảng traffic_exclusions.
create or replace function public.is_internal_visit(p_ip text, p_ua text, p_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_bot_visit(p_ua, p_ip)
    or (
      nullif(btrim(p_ip), '') is not null
      and exists (
        select 1
        from public.traffic_exclusions e
        where e.active
          and e.ip = coalesce(host(public.safe_inet(p_ip)), btrim(p_ip))
          and (e.valid_from is null or p_at >= e.valid_from)
          and (e.valid_to is null or p_at <= e.valid_to)
      )
    )
$$;

revoke execute on function public.is_internal_visit(text, text, timestamptz) from public, anon;
grant execute on function public.is_internal_visit(text, text, timestamptz) to authenticated, service_role;

-- ─── 4. View "khách thật" (cùng cột bảng gốc, đã bỏ nội bộ + bot) ────────────
-- security_invoker = on → RLS của bảng gốc vẫn áp (chỉ admin/service role đọc).
create or replace view public.page_visits_khach
with (security_invoker = on) as
select v.*
from public.page_visits v
where not public.is_internal_visit(v.ip, v.user_agent, v.visited_at);

create or replace view public.conversion_clicks_khach
with (security_invoker = on) as
select c.*
from public.conversion_clicks c
where not public.is_internal_visit(c.ip, c.user_agent, c.clicked_at);

revoke all on table public.page_visits_khach from anon, authenticated;
revoke all on table public.conversion_clicks_khach from anon, authenticated;
grant select on table public.page_visits_khach to authenticated, service_role;
grant select on table public.conversion_clicks_khach to authenticated, service_role;

-- ─── 5. RPC lượt truy cập theo ngày (giờ VN) ─────────────────────────────────
-- Bản cũ chỉ có (p_days). Bỏ nó để không trùng overload; gọi cũ chỉ với p_days
-- vẫn chạy nhờ p_all có mặc định false (= đã bỏ nội bộ/bot).
drop function if exists public.daily_page_visits(integer);

create or replace function public.daily_page_visits(p_days integer default 60, p_all boolean default false)
returns table (d date, n bigint)
language sql
stable
set search_path = ''
as $$
  select (v.visited_at at time zone 'Asia/Ho_Chi_Minh')::date as d, count(*)::bigint as n
  from public.page_visits v
  where v.visited_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 60), 400)))
    and (coalesce(p_all, false) or not public.is_internal_visit(v.ip, v.user_agent, v.visited_at))
  group by 1
  order by 1
$$;

revoke execute on function public.daily_page_visits(integer, boolean) from public, anon;
grant execute on function public.daily_page_visits(integer, boolean) to authenticated, service_role;

-- ─── 6. Đồng bộ danh sách tự động ────────────────────────────────────────────
-- Gọi từ /api/admin/visit-stats (≤1 lần/10 phút/instance). Trả số dòng thực sự
-- đổi (thêm mới / đổi khung giờ). KHÔNG đụng dòng auto=false.
create or replace function public.refresh_traffic_exclusions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- ── Ngưỡng luật — chỉnh ở đây ──
  c_window      constant interval := interval '30 days'; -- cửa sổ xét staff/heavy
  c_staff_days  constant integer  := 4;    -- staff: ≥ N ngày khác nhau…
  c_staff_hours constant integer  := 6;    -- …VÀ ≥ N giờ-trong-ngày khác nhau
  c_heavy_day   constant integer  := 150;  -- heavy: có 1 ngày ≥ N lượt từ 1 IP
  c_margin      constant interval := interval '1 day';   -- nới 2 đầu khung admin
  c_live        constant interval := interval '1 day';   -- refresh trong khoảng này = phiên còn sống
  -- IP admin quay lại sau khoảng trống dài hơn → MỞ KHUNG MỚI thay vì kéo giãn khung
  -- cũ qua khoảng trống (IP 4G là CGNAT: giữa 2 lần admin dùng, khách lạ có thể
  -- được cấp đúng IP đó — kéo giãn sẽ loại oan họ).
  c_gap         constant interval := interval '2 days';
  v_changed integer := 0;
  v_n integer;
  v_admin text[];
  v_staff text[];
  v_heavy text[];
begin
  -- 2 tab dashboard mở cùng lúc thì chạy lần lượt, không giẫm nhau.
  perform pg_advisory_xact_lock(hashtext('public.refresh_traffic_exclusions'));

  -- (1) IP admin từ auth.sessions (user is_admin, bỏ tài khoản bot "+bot@").
  --     auth.sessions.ip là IP lần refresh gần nhất của phiên.
  with s as (
    select host(se.ip) as ip,
           min(se.created_at) as first_at,
           max(greatest(se.created_at, se.updated_at, se.refreshed_at at time zone 'UTC')) as last_at
    from auth.sessions se
    join auth.users u on u.id = se.user_id
    join public.profiles p on p.id = se.user_id and p.is_admin = true
    where se.ip is not null
      and coalesce(u.email, '') not ilike '%+bot@%'
    group by host(se.ip)
  ),
  src as (
    select ip,
           first_at - c_margin as vf,
           case when last_at > now() - c_live then null else last_at + c_margin end as vt,
           last_at
    from s
  ),
  before as (
    select t.ip, t.valid_from, t.valid_to
    from public.traffic_exclusions t
    where t.reason = 'admin'
  ),
  up as (
    insert into public.traffic_exclusions as t (ip, reason, note, valid_from, valid_to, updated_at)
    select ip, 'admin', 'Máy đăng nhập admin', vf, vt, last_at
    from src
    on conflict (ip, reason) do update
      set valid_from = case
                         when t.valid_to is not null and excluded.valid_from > t.valid_to + c_gap
                           then excluded.valid_from -- khung mới sau khoảng trống
                         when t.valid_from is null then null
                         else least(t.valid_from, excluded.valid_from) end,
          valid_to = case
                       when t.valid_to is not null and excluded.valid_from > t.valid_to + c_gap
                         then excluded.valid_to
                       when excluded.valid_to is null then null
                       -- đang mở mà phiên đã nguội → chốt theo lần cuối thấy (phiên / API)
                       when t.valid_to is null then greatest(excluded.valid_to, t.updated_at + c_margin)
                       else greatest(t.valid_to, excluded.valid_to)
                     end,
          updated_at = greatest(t.updated_at, excluded.updated_at)
      where t.auto
        and (
          (t.valid_from is not null and excluded.valid_from < t.valid_from)
          or (excluded.valid_to is null and t.valid_to is not null)
          or (excluded.valid_to is not null and (t.valid_to is null or excluded.valid_to > t.valid_to))
          or excluded.updated_at > t.updated_at
        )
    returning t.ip, t.valid_from, t.valid_to
  )
  select count(*) into v_n
  from up
  left join before b on b.ip = up.ip
  where b.ip is null
     or b.valid_from is distinct from up.valid_from
     or b.valid_to is distinct from up.valid_to;
  v_changed := v_changed + v_n;

  select coalesce(array_agg(distinct host(se.ip)), '{}')
    into v_admin
  from auth.sessions se
  join auth.users u on u.id = se.user_id
  join public.profiles p on p.id = se.user_id and p.is_admin = true
  where se.ip is not null
    and coalesce(u.email, '') not ilike '%+bot@%';

  -- IP admin đang mở nhưng không còn phiên nào mang nó (phiên đổi IP khi refresh,
  -- đăng xuất) → chốt valid_to = lần cuối thấy + 1 ngày. Không để mở mãi: IP 4G
  -- là CGNAT, về sau khách thật có thể được cấp đúng IP đó.
  update public.traffic_exclusions t
     set valid_to = t.updated_at + c_margin
   where t.reason = 'admin'
     and t.auto
     and t.valid_to is null
     and not (t.ip = any (v_admin));
  get diagnostics v_n = row_count;
  v_changed := v_changed + v_n;

  -- (2) Luật dáng nhân viên / lướt dày trên 30 ngày gần nhất, đã bỏ bot.
  select coalesce(array_agg(ip) filter (where n_days >= c_staff_days and n_hours >= c_staff_hours), '{}'),
         coalesce(array_agg(ip) filter (where max_day >= c_heavy_day), '{}')
    into v_staff, v_heavy
  from (
    select ip,
           count(distinct d) as n_days,
           count(distinct h) as n_hours,
           max(n_in_day) as max_day
    from (
      select ip, d, h, count(*) over (partition by ip, d) as n_in_day
      from (
        select coalesce(host(public.safe_inet(v.ip)), btrim(v.ip)) as ip,
               (v.visited_at at time zone 'Asia/Ho_Chi_Minh')::date as d,
               extract(hour from v.visited_at at time zone 'Asia/Ho_Chi_Minh') as h
        from public.page_visits v
        where v.visited_at >= now() - c_window
          and nullif(btrim(v.ip), '') is not null
          and not public.is_bot_visit(v.user_agent, v.ip)
      ) a
    ) b
    group by ip
  ) x;

  -- Khớp luật → loại cả lịch sử của IP (valid_from/valid_to NULL); dòng đã chốt
  -- mà khớp lại thì mở lại.
  with r as (
    select unnest(v_staff) as ip, 'staff'::text as reason,
           format('Tự nhận: vào ≥%s ngày, ≥%s khung giờ trong 30 ngày', c_staff_days, c_staff_hours) as note
    union all
    select unnest(v_heavy), 'heavy',
           format('Tự nhận: có ngày ≥%s lượt từ 1 IP (nghi nội bộ/đại lý)', c_heavy_day)
  ),
  up as (
    insert into public.traffic_exclusions as t (ip, reason, note, valid_from, valid_to)
    select ip, reason, note, null, null from r
    on conflict (ip, reason) do update
      set valid_from = null,
          valid_to = null,
          updated_at = now()
      where t.auto
        and (t.valid_from is not null or t.valid_to is not null)
    returning 1
  )
  select count(*) into v_n from up;
  v_changed := v_changed + v_n;

  -- Hết khớp luật (dáng đã nhạt trong 30 ngày) → chốt ở lượt cuối + 1 ngày;
  -- lịch sử trước đó vẫn bị loại.
  update public.traffic_exclusions t
     set valid_to = coalesce(
           (select max(v.visited_at) from public.page_visits v where v.ip = t.ip),
           now()
         ) + c_margin,
         updated_at = now()
   where t.auto
     and t.valid_to is null
     and (
       (t.reason = 'staff' and not (t.ip = any (v_staff)))
       or (t.reason = 'heavy' and not (t.ip = any (v_heavy)))
     );
  get diagnostics v_n = row_count;
  v_changed := v_changed + v_n;

  return v_changed;
end;
$$;

revoke execute on function public.refresh_traffic_exclusions() from public, anon, authenticated;
grant execute on function public.refresh_traffic_exclusions() to service_role;

-- ─── 7. Ghi IP máy admin khi gọi API admin (requireAdmin, best-effort) ───────
-- Mới thấy → khung [now−1d, now+1d]; đã có → nới valid_to tới now+1d (đang mở thì
-- giữ mở) và ghi nhận "lần cuối thấy" (updated_at). Không đụng dòng auto=false.
create or replace function public.note_admin_ip(p_ip text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := host(public.safe_inet(p_ip));
begin
  if v_ip is null then
    return;
  end if;
  insert into public.traffic_exclusions as t (ip, reason, note, valid_from, valid_to, updated_at)
  values (v_ip, 'admin', 'Máy gọi API admin', now() - interval '1 day', now() + interval '1 day', now())
  on conflict (ip, reason) do update
    -- Khung cũ đã đóng cách đây > 2 ngày → mở khung mới (xem c_gap ở refresh).
    set valid_from = case
                       when t.valid_to is not null and excluded.valid_from > t.valid_to + interval '2 days'
                         then excluded.valid_from
                       when t.valid_from is null then null
                       else least(t.valid_from, excluded.valid_from) end,
        valid_to = case
                     when t.valid_to is null then null
                     when excluded.valid_from > t.valid_to + interval '2 days' then excluded.valid_to
                     else greatest(t.valid_to, excluded.valid_to) end,
        updated_at = now()
    where t.auto;
end;
$$;

revoke execute on function public.note_admin_ip(text) from public, anon, authenticated;
grant execute on function public.note_admin_ip(text) to service_role;

-- ─── 8. Báo cáo cho /api/admin/traffic-exclusions (gom ở SQL, nhẹ egress) ────
-- items: mọi dòng traffic_exclusions + số lượt 14 ngày của IP (kể cả bot) + lượt
-- cuối từ IP. totals: phân loại lượt p_days ngày thành bot / nội bộ / khách.
-- Chỉ service role gọi (route đã requireAdmin) nên để security invoker.
create or replace function public.traffic_exclusions_report(p_days integer default 14)
returns jsonb
language sql
stable
set search_path = ''
as $$
  -- materialized: is_internal_visit chỉ tính 1 lần/dòng; regex bot (đắt, ~30µs/dòng)
  -- chỉ chạy lại cho dòng đã là nội bộ (dòng khách thật không tính lại).
  with v0 as materialized (
    select pv.ip, pv.user_agent,
           public.is_internal_visit(pv.ip, pv.user_agent, pv.visited_at) as internal
    from public.page_visits pv
    where pv.visited_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 14), 400)))
  ),
  v as (
    select coalesce(host(public.safe_inet(v0.ip)), nullif(btrim(v0.ip), '')) as ip,
           v0.internal,
           case when v0.internal then public.is_bot_visit(v0.user_agent, v0.ip) else false end as bot
    from v0
  ),
  per_ip as (
    select ip, count(*) as n from v where ip is not null group by ip
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'bot', count(*) filter (where bot),
        'internal', count(*) filter (where internal and not bot),
        'customer', count(*) filter (where not internal)
      )
      from v
    ),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'ip', e.ip,
          'reason', e.reason,
          'note', e.note,
          'active', e.active,
          'auto', e.auto,
          'valid_from', e.valid_from,
          'valid_to', e.valid_to,
          'visits', coalesce(p.n, 0),
          'last_visit', (select max(pv.visited_at) from public.page_visits pv where pv.ip = e.ip)
        )
        order by e.active desc, coalesce(p.n, 0) desc, e.id
      )
      from public.traffic_exclusions e
      left join per_ip p on p.ip = e.ip
    ), '[]'::jsonb)
  )
$$;

revoke execute on function public.traffic_exclusions_report(integer) from public, anon, authenticated;
grant execute on function public.traffic_exclusions_report(integer) to service_role;

-- ─── 9. Seed: VPS nhà (Hermes/9router, chạy HeadlessChrome) ─────────────────
insert into public.traffic_exclusions (ip, reason, note, valid_from, valid_to, active, auto)
values ('103.142.26.210', 'server', 'VPS nhà (Hermes Agent / 9router)', null, null, true, false)
on conflict (ip, reason) do nothing;

-- ─── 10. Nạp lần đầu (admin từ phiên auth + luật staff/heavy) ────────────────
select public.refresh_traffic_exclusions();

-- PostgREST nạp lại schema ngay (view *_khach + chữ ký RPC daily_page_visits mới).
notify pgrst, 'reload schema';
