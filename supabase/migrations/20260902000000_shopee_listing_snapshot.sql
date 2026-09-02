-- Shopee listing snapshot: cache kết quả pull từ Shopee (get_item_list + details)
-- để admin login vào thấy ngay, đỡ chờ mỗi lần fetch từ Shopee (tốn ~n request).
--
-- Một dòng duy nhất, ghi đè mỗi lần bấm "Lấy danh sách từ Shopee".
create table if not exists shopee_listing_snapshot (
  id          integer     primary key default 1 check (id = 1),
  items       jsonb       not null default '[]'::jsonb,
  total       integer     not null default 0,
  pages       integer     not null default 0,
  synced_count integer   not null default 0,
  fetched_at  timestamptz not null default now(),
  created_by  text
);

alter table shopee_listing_snapshot enable row level security;
alter table shopee_listing_snapshot force row level security;