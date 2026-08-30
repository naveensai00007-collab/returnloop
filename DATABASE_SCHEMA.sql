-- ReturnLoop database schema
-- Target: Supabase Postgres
-- RLS is mandatory.
-- Run in Supabase SQL editor or migration system.

create extension if not exists pgcrypto;

-- Enums
do $$
begin
  create type purchase_status as enum ('active', 'returned', 'kept');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type reminder_status as enum ('pending', 'sent', 'failed', 'skipped');
exception
  when duplicate_object then null;
end $$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  timezone text not null default 'UTC',
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stores
-- Store policies are estimates unless verified.
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  default_return_window_days int check (default_return_window_days between 1 and 365),
  policy_notes text,
  policy_source text not null default 'estimate',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Purchases
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid references public.stores(id),
  custom_store_name text,
  item_name text,
  amount numeric(12,2),
  currency char(3) not null default 'USD',
  purchase_date date not null,
  return_window_days int not null check (return_window_days between 1 and 365),
  return_deadline date not null,
  status purchase_status not null default 'active',
  source text not null default 'manual' check (source in ('manual', 'receipt', 'import')),
  receipt_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint store_or_custom_store check (store_id is not null or custom_store_name is not null)
);

-- Reminders
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  reminder_date date not null,
  reminder_type text not null check (reminder_type in ('d7', 'd3', 'd1')),
  status reminder_status not null default 'pending',
  attempts int not null default 0,
  sent_at timestamptz,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  unique (purchase_id, reminder_type)
);

-- AI extractions
create table if not exists public.ai_extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'receipt_image',
  status text not null check (status in ('succeeded', 'failed', 'needs_review')),
  extracted jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists purchases_user_idx on public.purchases (user_id);
create index if not exists purchases_deadline_idx on public.purchases (return_deadline);
create index if not exists purchases_status_idx on public.purchases (status);
create index if not exists purchases_deleted_at_idx on public.purchases (deleted_at);
create index if not exists reminders_user_idx on public.reminders (user_id);
create index if not exists reminders_purchase_idx on public.reminders (purchase_id);
create index if not exists reminders_status_idx on public.reminders (status);
create index if not exists ai_extractions_user_idx on public.ai_extractions (user_id);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists purchases_updated_at on public.purchases;
create trigger purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

-- Row Level Security
alter table if exists public.profiles enable row level security;
alter table if exists public.stores enable row level security;
alter table if exists public.purchases enable row level security;
alter table if exists public.reminders enable row level security;
alter table if exists public.ai_extractions enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (id = auth.uid());

-- Stores policies
-- Authenticated users can read stores.
drop policy if exists "stores_select_authenticated" on public.stores;
create policy "stores_select_authenticated"
on public.stores
for select
to authenticated
using (true);

-- Purchases policies
drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
on public.purchases
for select
to authenticated
using (user_id = auth.uid() and deleted_at is null);

drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own"
on public.purchases
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "purchases_update_own" on public.purchases;
create policy "purchases_update_own"
on public.purchases
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "purchases_delete_own" on public.purchases;
create policy "purchases_delete_own"
on public.purchases
for delete
to authenticated
using (user_id = auth.uid());

-- Reminders policies
-- Clients can only read reminders. Server/service role writes reminders.
drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own"
on public.reminders
for select
to authenticated
using (user_id = auth.uid());

-- AI extractions policies
-- Clients can only read their own extraction history. Server/service role writes.
drop policy if exists "ai_extractions_select_own" on public.ai_extractions;
create policy "ai_extractions_select_own"
on public.ai_extractions
for select
to authenticated
using (user_id = auth.uid());

-- Storage bucket for receipts
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_insert_own" on storage.objects;
create policy "receipts_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "receipts_select_own" on storage.objects;
create policy "receipts_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "receipts_delete_own" on storage.objects;
create policy "receipts_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Seed common stores as estimates only.
-- Do not present these as legally verified policies.
insert into public.stores (name, slug, default_return_window_days, policy_notes, policy_source, verified)
values
  ('Amazon', 'amazon', 30, 'Common estimate. Many categories differ.', 'estimate', false),
  ('Walmart', 'walmart', 90, 'Common estimate. Many categories differ.', 'estimate', false),
  ('Target', 'target', 90, 'Common estimate. Many categories differ.', 'estimate', false),
  ('Best Buy', 'best-buy', 15, 'Common estimate. Electronics may differ.', 'estimate', false),
  ('Nike', 'nike', 30, 'Common estimate.', 'estimate', false),
  ('Adidas', 'adidas', 30, 'Common estimate.', 'estimate', false),
  ('Zara', 'zara', 30, 'Common estimate.', 'estimate', false),
  ('H&M', 'hm', 30, 'Common estimate.', 'estimate', false),
  ('IKEA', 'ikea', 365, 'Common estimate. Conditions apply.', 'estimate', false),
  ('Apple', 'apple', 14, 'Common estimate.', 'estimate', false)
on conflict (slug) do nothing;
