create extension if not exists pgcrypto;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vendor text not null,
  date date not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(12, 2) not null check (total >= 0),
  category text not null default 'Other',
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.receipts
  add column if not exists user_id uuid default auth.uid()
  references auth.users(id) on delete cascade;

alter table public.receipts enable row level security;

drop policy if exists "Public can read receipts" on public.receipts;
drop policy if exists "Public can create receipts" on public.receipts;
drop policy if exists "Users can read own receipts" on public.receipts;
create policy "Users can read own receipts"
  on public.receipts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own receipts" on public.receipts;
create policy "Users can create own receipts"
  on public.receipts for insert
  to authenticated
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipt-images',
  'receipt-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view receipt images" on storage.objects;
drop policy if exists "Public can upload receipt images" on storage.objects;
drop policy if exists "Users can view own receipt images" on storage.objects;
create policy "Users can view own receipt images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload own receipt images" on storage.objects;
create policy "Users can upload own receipt images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can remove own receipt images" on storage.objects;
create policy "Users can remove own receipt images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
