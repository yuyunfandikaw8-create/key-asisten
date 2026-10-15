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
