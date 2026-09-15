-- CoolCalci Phase 2: authenticated users, cloud history, saved calculations and entitlements.
-- Safe baseline: all user data is protected by Row Level Security.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro_monthly','pro_yearly')),
  status text not null default 'active' check (status in ('trialing','active','past_due','canceled')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  calculation_count integer not null default 0 check (calculation_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create table if not exists public.calculation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  title text not null,
  result text not null,
  formula text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  title text not null,
  result text not null,
  formula text,
  created_at timestamptz not null default now()
);

create index if not exists calculation_history_user_created_idx
  on public.calculation_history(user_id, created_at desc);
create index if not exists saved_calculations_user_created_idx
  on public.saved_calculations(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_daily enable row level security;
alter table public.calculation_history enable row level security;
alter table public.saved_calculations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "usage_select_own" on public.usage_daily;
create policy "usage_select_own" on public.usage_daily for select using (auth.uid() = user_id);

drop policy if exists "usage_insert_own" on public.usage_daily;
create policy "usage_insert_own" on public.usage_daily for insert with check (auth.uid() = user_id);

drop policy if exists "usage_update_own" on public.usage_daily;
create policy "usage_update_own" on public.usage_daily for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "history_select_own" on public.calculation_history;
create policy "history_select_own" on public.calculation_history for select using (auth.uid() = user_id);

drop policy if exists "history_insert_own" on public.calculation_history;
create policy "history_insert_own" on public.calculation_history for insert with check (auth.uid() = user_id);

drop policy if exists "history_delete_own" on public.calculation_history;
create policy "history_delete_own" on public.calculation_history for delete using (auth.uid() = user_id);

drop policy if exists "saved_select_own" on public.saved_calculations;
create policy "saved_select_own" on public.saved_calculations for select using (auth.uid() = user_id);

drop policy if exists "saved_insert_own" on public.saved_calculations;
create policy "saved_insert_own" on public.saved_calculations for insert with check (auth.uid() = user_id);

drop policy if exists "saved_delete_own" on public.saved_calculations;
create policy "saved_delete_own" on public.saved_calculations for delete using (auth.uid() = user_id);

-- Client-side users may not directly change subscription plans. Entitlements will be
-- updated by a trusted server/payment flow in the monetization phase.
drop policy if exists "subscriptions_client_update_blocked" on public.subscriptions;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at before update on public.subscriptions
for each row execute procedure public.touch_updated_at();

drop trigger if exists usage_touch_updated_at on public.usage_daily;
create trigger usage_touch_updated_at before update on public.usage_daily
for each row execute procedure public.touch_updated_at();
