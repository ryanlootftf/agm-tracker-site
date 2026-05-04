-- ============================================================
-- AGM Meeting Tracker — Migration 002
-- Adds stocks table, rebuilds agm_events to match scraper,
--   alters holdings to use stock_code FK
-- ============================================================

-- 1. Stocks master table (scraper source: Stock_List_Scraper.py)
create table public.stocks (
  stock_code   text primary key,            -- 4-digit code e.g. '0001'
  symbol       text not null,               -- ticker e.g. 'SCOMNET'
  company_name text not null,               -- e.g. 'SUPERCOMNET TECHNOLOGIES BHD'
  href         text,                        -- i3investor overview URL
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Rebuild agm_events to match Meeting_Scraper.py output exactly
drop table if exists public.agm_events cascade;

create table public.agm_events (
  id               uuid primary key default gen_random_uuid(),
  stock_code       text not null references public.stocks(stock_code),
  stock_ticker     text not null,           -- denormalised for quick display
  meeting_date     date not null,
  meeting_time     text,                    -- '10:00', '14:30', etc.
  meeting_type     text not null default 'General Meeting',
  meeting_location text,
  venue_type       text not null default 'Physical',  -- Physical / Hybrid
  meeting_link     text,                    -- URL for hybrid meetings
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (stock_code, meeting_date, meeting_time)
);

create index idx_agm_events_stock_code on public.agm_events(stock_code);
create index idx_agm_events_date       on public.agm_events(meeting_date);

-- 3. Alter holdings: ticker → stock_code with FK
--    Strategy: add new column, drop old, rename, add FK
alter table public.holdings
  add column stock_code text;

update public.holdings
  set stock_code = ticker;

alter table public.holdings
  alter column stock_code set not null;

alter table public.holdings
  drop column ticker;

alter table public.holdings
  add constraint fk_holdings_stock
  foreign key (stock_code) references public.stocks(stock_code);

-- rebuild index
drop index if exists idx_holdings_ticker;
create index idx_holdings_stock_code on public.holdings(stock_code);

-- ============================================================
-- Row Level Security
-- ============================================================

-- stocks: anyone can read (public reference data); only service_role can write
alter table public.stocks enable row level security;

create policy "stocks_public_select"
  on public.stocks for select
  to anon, authenticated
  using (true);

-- agm_events: all authenticated users can read; only service_role can write
alter table public.agm_events enable row level security;

create policy "agm_events_auth_select"
  on public.agm_events for select
  using (auth.role() = 'authenticated');

-- holdings RLS already exists but references ticker — no change needed
-- because the RLS uses portfolio_id → portfolios.user_id, not the column itself