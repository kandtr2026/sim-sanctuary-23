-- Sim Birthday — bảng Kanban theo dõi khách (#54).
--
-- A Khoa: bố trí khách theo style kanban 3 cấp:
--   L1 = đã check Zalo (co_zalo / ko_zalo)
--   L2 = đã nhắn (da_nhan) — note ai nhắn (created_by)
--   L3 = kết quả (bảng ket_qua dưới đây)
-- Mỗi khách xem được log tác động + "nhắn cái gì" = text tin lúc copy (lưu vào
-- cột noi_dung của sim_birthday_da_nhan).

-- 1) Lưu text tin đã nhắn.
alter table public.sim_birthday_da_nhan add column if not exists noi_dung text;

-- 2) Kết quả (level 3): mỗi khách 1 kết quả hiện tại + ai/lúc nào.
create table if not exists public.sim_birthday_ket_qua (
  msisdn      text primary key,
  ket_qua     text not null,
  created_at  timestamptz not null default now(),
  created_by  text
);
alter table public.sim_birthday_ket_qua enable row level security;
comment on table public.sim_birthday_ket_qua is
  'Sim Birthday — kết quả chăm khách (level 3 kanban). Chỉ service role.';

-- 3) Gom khách ĐÃ có tác động (union 5 bảng cờ) + mọi mốc thời gian/user, xếp
--    theo lần tác động gần nhất — nguồn cho bảng kanban.
create or replace function public.sim_birthday_kanban(
  p_limit int default 200,
  p_offset int default 0
)
returns table(
  msisdn text, dob date,
  mo_at timestamptz,
  co_zalo boolean, ko_zalo boolean, check_at timestamptz,
  nhan_at timestamptz, nhan_by text, nhan_text text,
  ket_qua text, kq_at timestamptz, kq_by text,
  tong bigint
)
language sql stable as $$
  with ids as (
    select msisdn from public.sim_birthday_da_mo
    union select msisdn from public.sim_birthday_co_zalo
    union select msisdn from public.sim_birthday_ko_zalo
    union select msisdn from public.sim_birthday_da_nhan
    union select msisdn from public.sim_birthday_ket_qua
  ),
  agg as (
    select
      i.msisdn, k.dob,
      mo.created_at as mo_at,
      (cz.msisdn is not null) as co_zalo,
      (kz.msisdn is not null) as ko_zalo,
      coalesce(cz.created_at, kz.created_at) as check_at,
      dn.created_at as nhan_at, dn.created_by as nhan_by, dn.noi_dung as nhan_text,
      kq.ket_qua, kq.created_at as kq_at, kq.created_by as kq_by,
      greatest(mo.created_at, cz.created_at, kz.created_at, dn.created_at, kq.created_at) as last_at,
      count(*) over() as tong
    from ids i
    left join public.sim_birthday_khach k on k.msisdn = i.msisdn
    left join public.sim_birthday_da_mo mo on mo.msisdn = i.msisdn
    left join public.sim_birthday_co_zalo cz on cz.msisdn = i.msisdn
    left join public.sim_birthday_ko_zalo kz on kz.msisdn = i.msisdn
    left join public.sim_birthday_da_nhan dn on dn.msisdn = i.msisdn
    left join public.sim_birthday_ket_qua kq on kq.msisdn = i.msisdn
  )
  select msisdn, dob, mo_at, co_zalo, ko_zalo, check_at,
         nhan_at, nhan_by, nhan_text, ket_qua, kq_at, kq_by, tong
  from agg
  order by last_at desc nulls last, msisdn
  limit greatest(1, least(p_limit, 500)) offset greatest(0, p_offset);
$$;

notify pgrst, 'reload schema';
