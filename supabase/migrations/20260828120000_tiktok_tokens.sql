-- Token store cho TikTok Shop Partner API. Lưu access_token / refresh_token của
-- shop "Viễn thông Nam Khang HCM" để API route có thể tự động refresh khi token
-- hết hạn mà không cần sửa file .env.tiktok-shop (file đó chỉ dùng seed lần đầu).
--
-- Single-row (id = 1) — một shop, một bộ token.
-- Truy cập qua RLS: chỉ admin mới đọc/ghi được.
create table if not exists public.tiktok_tokens (
  id integer primary key default 1,
  access_token text not null,
  refresh_token text not null,
  access_token_expire_at bigint not null,
  refresh_token_expire_at bigint not null,
  updated_at timestamptz not null default now(),
  constraint tiktok_tokens_single_row check (id = 1)
);

alter table public.tiktok_tokens enable row level security;

-- Admin: full quyền (read + update) — dùng cho API route server-side.
create policy "tiktok_tokens: admin all"
  on public.tiktok_tokens for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );