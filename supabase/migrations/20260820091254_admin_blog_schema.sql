-- Admin panel schema: who is allowed into /admin, and the blog posts they manage.
--
-- Design notes:
--  * We deliberately do NOT create a bespoke "admin_users" table with its own
--    password column. Auth stays on Supabase Auth (auth.users) so we get
--    battle-tested password hashing, session/refresh-token handling, and
--    magic-link/reset-password flows for free. `profiles` only adds the one
--    bit of app-specific info Auth doesn't have: "is this account an admin".
--  * There is no self-serve signup path to become an admin. Rows in
--    `profiles` are inserted by hand (Supabase Studio -> Table editor, or SQL
--    editor) after creating the user in Authentication -> Users. That is a
--    deliberate manual gate, not an oversight — this app has no "sign up"
--    button anywhere and shouldn't grow one just for this table.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user may read their own profile row (needed so the client can check
-- is_admin after login without a service-role key).
create policy "profiles: read own row"
  on public.profiles for select
  using (auth.uid() = id);

-- Nobody edits profiles from the client. Promote/demote admins via the
-- Supabase Studio table editor or SQL editor, signed in as the project
-- owner — never by exposing an insert/update policy here.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  meta_title text,
  meta_description text,
  -- HTML the post page renders directly inside an <article>. The existing
  -- TinTucBaiN.tsx pages hand-write JSX; posts created through the admin
  -- panel instead store their body as HTML here so no deploy is needed to
  -- publish. Keep it to the same heading/paragraph shapes those pages use.
  content_html text not null default '',
  cover_image_url text,
  -- Free-text category today (e.g. "Phong thuỷ", "Đầu số", "Tin tức").
  -- Intentionally not an enum yet — the SEO template system (content
  -- generated per birth-year / per-province / per-price-tier, see the
  -- keyword research doc) will likely want a `template_type` +
  -- `template_vars jsonb` pair added in a follow-up migration once the
  -- first template ships. Kept out of this migration to avoid guessing its
  -- shape now.
  category text,
  published boolean not null default false,
  author_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Public site: only published posts, to anyone (including logged-out
-- visitors — this is what powers the public /tin-tuc/:slug page).
create policy "blog_posts: public reads published"
  on public.blog_posts for select
  using (published = true);

-- Admins: full read (including drafts) and full write, gated on the
-- profiles.is_admin flag rather than merely "is logged in".
create policy "blog_posts: admin reads all"
  on public.blog_posts for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "blog_posts: admin inserts"
  on public.blog_posts for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "blog_posts: admin updates"
  on public.blog_posts for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "blog_posts: admin deletes"
  on public.blog_posts for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create index if not exists blog_posts_published_created_idx
  on public.blog_posts (published, created_at desc);

-- Keep updated_at honest on every edit made through the admin UI.
create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row
  execute function public.set_blog_posts_updated_at();
