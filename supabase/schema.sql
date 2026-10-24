-- Jalankan di Supabase SQL Editor setelah Auth siap.
-- Publishable key tidak bisa membuat tabel; pakai SQL Editor / secret di server saja.

create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  city text not null default 'Bandung',
  phone text default '',
  created_at timestamptz not null default now()
);

alter table public.studios enable row level security;

create policy "Studios are readable by owner"
  on public.studios for select
  using (auth.uid() = owner_id);

create policy "Owners can insert their studio"
  on public.studios for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their studio"
  on public.studios for update
  using (auth.uid() = owner_id);

-- Profil + state studio ikut email/akun (sinkron lintas HP / perangkat).
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

create or replace function public.touch_owner_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists owner_data_touch_updated_at on public.owner_data;
create trigger owner_data_touch_updated_at
  before update on public.owner_data
  for each row execute function public.touch_owner_data_updated_at();
