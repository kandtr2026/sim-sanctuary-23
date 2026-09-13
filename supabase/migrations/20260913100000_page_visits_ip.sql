-- Thêm IP khách vào page_visits để gom "mỗi IP = 1 khách" trên dashboard
-- (góp ý A Khoa 13/09): thấy 1 khách xem nhiều màn thì biết mà tư vấn.
--
-- IP KHÔNG do trình duyệt tự khai (client không biết IP công cộng của mình) —
-- route POST /api/track/visit đọc từ header x-forwarded-for phía server rồi ghi.
-- Idempotent.
alter table public.page_visits add column if not exists ip text;

create index if not exists page_visits_ip_idx on public.page_visits (ip);
