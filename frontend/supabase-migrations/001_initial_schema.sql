-- ============================================================
-- AGM Meeting Tracker — Initial Schema
-- Run this in the Supabase SQL Editor on your project.
-- ============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. profiles
create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);

-- link id to auth.users so each user gets one profile
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id)
  on delete cascade;

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. portfolios
create table public.portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  colour      text not null default '#6366F1',  -- default indigo
  created_at  timestamptz not null default now()
);

create index idx_portfolios_user_id on public.portfolios(user_id);

-- 3. holdings
create table public.holdings (
  id            uuid primary key default gen_random_uuid(),
  portfolio_id  uuid not null references public.portfolios(id) on delete cascade,
  ticker        text not null,
  shares        integer,
  created_at    timestamptz not null default now()
);

create index idx_holdings_portfolio_id on public.holdings(portfolio_id);
create index idx_holdings_ticker      on public.holdings(ticker);

-- 4. agm_events (global — written by scraper, read by frontend)
create table public.agm_events (
  id            uuid primary key default gen_random_uuid(),
  ticker        text not null,
  company_name  text not null,
  agm_date      date not null,
  agm_time      time,
  meeting_type  text not null default 'AGM',
  venue         text,
  status        text not null default 'Upcoming',
  source_url    text,
  last_updated  timestamptz not null default now()
);

-- upsert conflict key: same ticker / date / time / meeting_type = same event
create unique index idx_agm_events_unique
  on public.agm_events(ticker, agm_date, agm_time, meeting_type);

create index idx_agm_events_date on public.agm_events(agm_date);

-- 5. notification_preferences (schema-only, inactive until Phase 5)
create table public.notification_preferences (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  notify_email         boolean not null default false,
  notify_days_before   integer not null default 3,
  created_at           timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles               enable row level security;
alter table public.portfolios             enable row level security;
alter table public.holdings               enable row level security;
alter table public.agm_events             enable row level security;
alter table public.notification_preferences enable row level security;

-- profiles: user can read / update only their own row
create policy "profiles_own_select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_own_update"
  on public.profiles for update
  using (auth.uid() = id);

-- portfolios: user can CRUD only their own portfolios
create policy "portfolios_own_select"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "portfolios_own_insert"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "portfolios_own_update"
  on public.portfolios for update
  using (auth.uid() = user_id);

create policy "portfolios_own_delete"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- holdings: user can CRUD only holdings belonging to their portfolios
create policy "holdings_own_select"
  on public.holdings for select
  using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = holdings.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

create policy "holdings_own_insert"
  on public.holdings for insert
  with check (
    exists (
      select 1 from public.portfolios
      where portfolios.id = holdings.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

create policy "holdings_own_update"
  on public.holdings for update
  using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = holdings.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

create policy "holdings_own_delete"
  on public.holdings for delete
  using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = holdings.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

-- agm_events: all authenticated users can read; only service_role can write
create policy "agm_events_auth_select"
  on public.agm_events for select
  using (auth.role() = 'authenticated');

-- notification_preferences: user can read / update only their own row
create policy "notif_prefs_own_select"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "notif_prefs_own_update"
  on public.notification_preferences for update
  using (auth.uid() = user_id);