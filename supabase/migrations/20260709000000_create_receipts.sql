create extension if not exists pgcrypto;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  vendor text not null,
  date date not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(12, 2) not null check (total >= 0),
  category text not null default 'Other',
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.receipts enable row level security;

drop policy if exists "Public can read receipts" on public.receipts;
create policy "Public can read receipts"
  on public.receipts for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can create receipts" on public.receipts;
create policy "Public can create receipts"
  on public.receipts for insert
  to anon, authenticated
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipt-images',
  'receipt-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view receipt images" on storage.objects;
create policy "Public can view receipt images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'receipt-images');

drop policy if exists "Public can upload receipt images" on storage.objects;
create policy "Public can upload receipt images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'receipt-images');
