-- Bible Secrets — Supabase schema
-- Paste this into the Supabase SQL editor (Dashboard → SQL → New query).
--
-- Access model it encodes:
--   • series / books marked `is_public` are the free ~40%;
--   • anything else needs a signed-in member with an active entitlement;
--   • the first 90 days after signup are a free trial (see `entitlements`);
--   • a Paystack payment writes an entitlement row and extends access.

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------- roles
do $$ begin
  create type public.user_role as enum ('reader', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_kind as enum ('pdf', 'comic', 'audio', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'success', 'failed', 'abandoned');
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text,
  role public.user_role not null default 'reader',
  access_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'editor')
  );
$$;

-- ---------------------------------------------------------------- series
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  tagline text,
  synopsis text,
  genre text[] default '{}',
  rating numeric(3,1) default 8.5,
  year int,
  poster_url text,
  backdrop_url text,
  accent text default '#d4b45a',
  badge text,
  sort int default 100,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- books
-- One row per volume / part / comic issue.
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.series on delete cascade,
  slug text unique not null,
  title text not null,
  synopsis text,
  part_number int not null default 1,
  kind public.media_kind not null default 'pdf',
  -- Storage object path in the `books` bucket (preferred), or a Drive id.
  storage_path text,
  drive_id text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  page_count int,
  duration text,
  is_public boolean not null default false,   -- the free ~40%
  is_published boolean not null default true,
  published_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create index if not exists books_series_idx on public.books (series_id, part_number);
create index if not exists books_public_idx on public.books (is_public) where is_public;

-- ---------------------------------------------------------------- assets
-- Extra posters, stills, clips and later podcast audio for a book.
create table if not exists public.book_assets (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books on delete cascade,
  kind text not null,                -- 'poster' | 'still' | 'clip' | 'audio' | 'backdrop'
  storage_path text not null,
  position int default 0,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- sessions
-- Tuesday 8PM WhatsApp sessions: poster + schedule + link.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  poster_url text,
  starts_at timestamptz not null,
  whatsapp_url text,
  series_id uuid references public.series on delete set null,
  host text default 'Tinotenda Gwiriri',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists sessions_starts_idx on public.sessions (starts_at desc);

-- --------------------------------------------------------- entitlements
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  source text not null default 'trial',   -- 'trial' | 'paid' | 'admin'
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists entitlements_user_idx on public.entitlements (user_id, active);

-- --------------------------------------------------------------- payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  email text not null,
  reference text unique not null,
  provider text not null default 'paystack',
  amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  status public.payment_status not null default 'pending',
  raw jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- trial window: 90 days from signup
create or replace function public.has_full_access(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.profiles p where p.id = check_user and p.role in ('admin','editor'))
    or exists (
      select 1 from public.entitlements e
      where e.user_id = check_user and e.active
        and (e.expires_at is null or e.expires_at > now())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = check_user and p.access_started_at > now() - interval '90 days'
    );
$$;

-- ------------------------------------------------------------ reading UX
create table if not exists public.progress (
  user_id uuid references public.profiles on delete cascade,
  book_id uuid references public.books on delete cascade,
  page int not null default 1,
  page_count int,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  book_id uuid references public.books on delete cascade,
  page int not null,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  book_id uuid references public.books on delete cascade,
  page int not null,
  text text,
  note text,
  color text default 'gold',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  book_id uuid references public.books on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ RLS
alter table public.profiles     enable row level security;
alter table public.series       enable row level security;
alter table public.books        enable row level security;
alter table public.book_assets  enable row level security;
alter table public.sessions     enable row level security;
alter table public.entitlements enable row level security;
alter table public.payments     enable row level security;
alter table public.progress     enable row level security;
alter table public.bookmarks    enable row level security;
alter table public.highlights   enable row level security;
alter table public.comments     enable row level security;

-- profiles: read your own, staff read all, you may edit your display name
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_staff());

-- catalog: published rows are world-readable; only staff write
drop policy if exists series_read on public.series;
create policy series_read on public.series for select
  using (is_published or public.is_staff());

drop policy if exists series_write on public.series;
create policy series_write on public.series for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists books_read on public.books;
create policy books_read on public.books for select
  using ((is_published and is_public) or public.has_full_access() or public.is_staff());

drop policy if exists books_write on public.books;
create policy books_write on public.books for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists assets_read on public.book_assets;
create policy assets_read on public.book_assets for select
  using (
    exists (select 1 from public.books b where b.id = book_assets.book_id
            and ((b.is_published and b.is_public) or public.has_full_access() or public.is_staff()))
  );

drop policy if exists assets_write on public.book_assets;
create policy assets_write on public.book_assets for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists sessions_read on public.sessions;
create policy sessions_read on public.sessions for select
  using (is_published or public.is_staff());

drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions for all
  using (public.is_staff()) with check (public.is_staff());

-- entitlements & payments: your own rows only, staff see everything
drop policy if exists entitlements_read on public.entitlements;
create policy entitlements_read on public.entitlements for select
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists entitlements_write on public.entitlements;
create policy entitlements_write on public.entitlements for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select
  using (user_id = auth.uid() or public.is_staff());

-- reader data: strictly your own
drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists bookmarks_own on public.bookmarks;
create policy bookmarks_own on public.bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists highlights_own on public.highlights;
create policy highlights_own on public.highlights for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select
  using (public.has_full_access() or public.is_staff());

drop policy if exists comments_write on public.comments;
create policy comments_write on public.comments for insert
  with check (user_id = auth.uid() and public.has_full_access());

-- -------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Books are private: the app streams them through a signed URL after the
-- entitlement check in /api/read/[slug].
insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do nothing;

drop policy if exists covers_read on storage.objects;
create policy covers_read on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists covers_write on storage.objects;
create policy covers_write on storage.objects for all
  using (bucket_id = 'covers' and public.is_staff())
  with check (bucket_id = 'covers' and public.is_staff());

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects for all
  using (bucket_id = 'media' and public.is_staff())
  with check (bucket_id = 'media' and public.is_staff());

drop policy if exists books_read_storage on storage.objects;
create policy books_read_storage on storage.objects for select
  using (bucket_id = 'books' and (public.has_full_access() or public.is_staff()));

drop policy if exists books_write_storage on storage.objects;
create policy books_write_storage on storage.objects for all
  using (bucket_id = 'books' and public.is_staff())
  with check (bucket_id = 'books' and public.is_staff());

-- --------------------------------------------------------------- seed
insert into public.series (slug, title, tagline, synopsis, genre, rating, year, poster_url, backdrop_url, accent, badge, sort)
values
  ('the-return-of-melchizedek', 'The Return of Melchizedek', 'The priest-king who never left the page.',
   'From Genesis 14 through Psalm 110, Hebrews 7 and the courts of heaven — and on to the Kruptos Protocol.',
   array['Bible Study','Priesthood'], 9.4, 2024, '/posters/poster-melchizedek.jpg', '/posters/backdrop-melchizedek.jpg', '#d9b45a', 'Flagship series', 1),
  ('the-days-of-noah', 'The Days of Noah', 'As it was, so it is.',
   'Thirty-five sessions on Genesis 6: the sons of God, the Watchers, the gates of hell and the courts of heaven.',
   array['Bible Study','Genesis 6'], 9.1, 2023, '/posters/poster-noah.jpg', '/posters/backdrop-noah.jpg', '#6fb3d9', '35 parts', 2)
on conflict (slug) do nothing;
