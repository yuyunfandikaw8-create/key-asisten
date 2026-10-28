-- Key Assistant — skema database lengkap
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run
-- (Anon key tidak bisa membuat tabel; butuh SQL Editor / service role.)

-- ---------------------------------------------------------------------------
-- 1) Profil akun (Owner & Klien)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text not null default '',
  city text not null default '',
  role text not null default 'owner' check (role in ('owner', 'client')),
  role_chosen boolean not null default false,
  avatar text,
  trial_started_at timestamptz,
  onboarding_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_idx
  on public.profiles (lower(email));

alter table public.profiles enable row level security;

drop policy if exists "Profiles readable by owner" on public.profiles;
create policy "Profiles readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles insert by owner" on public.profiles;
create policy "Profiles insert by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles update by owner" on public.profiles;
create policy "Profiles update by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2) Studio ringkas (opsional / direktori)
-- ---------------------------------------------------------------------------
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  city text not null default 'Bandung',
  phone text default '',
  created_at timestamptz not null default now()
);

create index if not exists studios_owner_id_idx on public.studios (owner_id);

alter table public.studios enable row level security;

drop policy if exists "Studios are readable by owner" on public.studios;
create policy "Studios are readable by owner"
  on public.studios for select
  using (auth.uid() = owner_id);

drop policy if exists "Owners can insert their studio" on public.studios;
create policy "Owners can insert their studio"
  on public.studios for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their studio" on public.studios;
create policy "Owners can update their studio"
  on public.studios for update
  using (auth.uid() = owner_id);

drop policy if exists "Owners can delete their studio" on public.studios;
create policy "Owners can delete their studio"
  on public.studios for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- 3) Data bisnis Owner (profil bisnis + state studio: booking, invoice, dll)
-- ---------------------------------------------------------------------------
create table if not exists public.owner_data (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  profile jsonb not null default '{}'::jsonb,
  studio jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists owner_data_email_idx
  on public.owner_data (lower(email));

alter table public.owner_data enable row level security;

drop policy if exists "Owner data readable by owner" on public.owner_data;
create policy "Owner data readable by owner"
  on public.owner_data for select
  using (auth.uid() = owner_id);

drop policy if exists "Owner data insert by owner" on public.owner_data;
create policy "Owner data insert by owner"
  on public.owner_data for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owner data update by owner" on public.owner_data;
create policy "Owner data update by owner"
  on public.owner_data for update
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- 4) Data Klien (acara, shortlist, booking status)
-- ---------------------------------------------------------------------------
create table if not exists public.client_data (
  client_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  workspace jsonb not null default '{"shortlist":[],"events":[],"activeEventId":null}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists client_data_email_idx
  on public.client_data (lower(email));

alter table public.client_data enable row level security;

drop policy if exists "Client data readable by client" on public.client_data;
create policy "Client data readable by client"
  on public.client_data for select
  using (auth.uid() = client_id);

drop policy if exists "Client data insert by client" on public.client_data;
create policy "Client data insert by client"
  on public.client_data for insert
  with check (auth.uid() = client_id);

drop policy if exists "Client data update by client" on public.client_data;
create policy "Client data update by client"
  on public.client_data for update
  using (auth.uid() = client_id);

-- ---------------------------------------------------------------------------
-- 5) Pricelist / link booking publik (/p/[slug]) — bisa dibaca siapa saja
-- ---------------------------------------------------------------------------
create table if not exists public.public_booking_profiles (
  slug text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  city text not null default '',
  services jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists public_booking_profiles_owner_idx
  on public.public_booking_profiles (owner_id);

alter table public.public_booking_profiles enable row level security;

drop policy if exists "Public booking profiles are readable by anyone"
  on public.public_booking_profiles;
create policy "Public booking profiles are readable by anyone"
  on public.public_booking_profiles for select
  using (true);

drop policy if exists "Owners insert public booking profile"
  on public.public_booking_profiles;
create policy "Owners insert public booking profile"
  on public.public_booking_profiles for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners update public booking profile"
  on public.public_booking_profiles;
create policy "Owners update public booking profile"
  on public.public_booking_profiles for update
  using (auth.uid() = owner_id);

drop policy if exists "Owners delete public booking profile"
  on public.public_booking_profiles;
create policy "Owners delete public booking profile"
  on public.public_booking_profiles for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- 6) Pengajuan booking dari link publik (opsional, lintas perangkat)
-- ---------------------------------------------------------------------------
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'diajukan'
    check (status in ('diajukan', 'menunggu_konfirmasi', 'diterima', 'ditolak')),
  created_at timestamptz not null default now()
);

create index if not exists booking_requests_owner_idx
  on public.booking_requests (owner_id, created_at desc);

alter table public.booking_requests enable row level security;

drop policy if exists "Anyone can insert booking request" on public.booking_requests;
create policy "Anyone can insert booking request"
  on public.booking_requests for insert
  with check (true);

drop policy if exists "Owner reads booking requests" on public.booking_requests;
create policy "Owner reads booking requests"
  on public.booking_requests for select
  using (auth.uid() = owner_id);

drop policy if exists "Owner updates booking requests" on public.booking_requests;
create policy "Owner updates booking requests"
  on public.booking_requests for update
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- 7) updated_at helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists owner_data_touch_updated_at on public.owner_data;
create trigger owner_data_touch_updated_at
  before update on public.owner_data
  for each row execute function public.touch_updated_at();

drop trigger if exists client_data_touch_updated_at on public.client_data;
create trigger client_data_touch_updated_at
  before update on public.client_data
  for each row execute function public.touch_updated_at();

drop trigger if exists public_booking_profiles_touch_updated_at
  on public.public_booking_profiles;
create trigger public_booking_profiles_touch_updated_at
  before update on public.public_booking_profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 8) Auto-buat profiles saat user Auth baru
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, role_chosen)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'user'), '@', 1)),
    case
      when new.raw_user_meta_data->>'role' = 'client' then 'client'
      else 'owner'
    end,
    coalesce((new.raw_user_meta_data->>'role_chosen')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 9) Realtime (opsional) — aktifkan di Dashboard bila perlu
-- ---------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.booking_requests;
