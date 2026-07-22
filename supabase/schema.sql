-- ════════════════════════════════════════════════════════
--  גדוד 13 — Battle Memorial · Supabase schema
--  Run in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── battles ──────────────────────────────────────────────
create table if not exists battles (
  id            text primary key default gen_random_uuid()::text,
  slug          text unique not null,
  title         text not null,
  kind          text not null check (kind in ('battle','ambush','rescue')),
  date          date not null default '2023-10-07',
  time          text not null,                 -- "HH:MM"
  lng           double precision not null,
  lat           double precision not null,
  location_name text not null,
  unit          text not null,
  summary       text,
  description    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── timeline events ──────────────────────────────────────
create table if not exists timeline_events (
  id         text primary key default gen_random_uuid()::text,
  battle_id  text not null references battles(id) on delete cascade,
  time       text not null,                    -- "HH:MM" start
  end_time   text,                             -- "HH:MM" end (optional)
  title      text not null,
  detail     text,
  path       jsonb                             -- [{time, coordinates:[lng,lat]}] timed waypoints
);
create index if not exists idx_timeline_battle on timeline_events(battle_id);

-- ── soldiers (fallen) ────────────────────────────────────
create table if not exists soldiers (
  id         text primary key default gen_random_uuid()::text,
  battle_id  text not null references battles(id) on delete cascade,
  full_name  text not null,
  rank       text,
  age        int,
  photo      text,
  hometown   text,
  memorial   text,
  affiliation text                              -- 'battalion_13' | 'combat_team'
);
create index if not exists idx_soldiers_battle on soldiers(battle_id);

-- ── media ────────────────────────────────────────────────
create table if not exists media (
  id         text primary key default gen_random_uuid()::text,
  battle_id  text not null references battles(id) on delete cascade,
  kind       text not null check (kind in ('image','video','drone','audio','radio')),
  url        text not null,
  thumb      text,
  caption    text
);
create index if not exists idx_media_battle on media(battle_id);

-- ── Row Level Security ───────────────────────────────────
alter table battles         enable row level security;
alter table timeline_events enable row level security;
alter table soldiers        enable row level security;
alter table media           enable row level security;

-- Public read (the site is a public memorial).
create policy "public read battles"  on battles         for select using (true);
create policy "public read timeline" on timeline_events for select using (true);
create policy "public read soldiers" on soldiers        for select using (true);
create policy "public read media"    on media           for select using (true);

-- Writes happen only via the service-role key (admin API route),
-- which bypasses RLS. No insert/update/delete policies for anon.

-- ── Storage bucket for uploaded media ────────────────────
insert into storage.buckets (id, name, public)
values ('battle-media', 'battle-media', true)
on conflict (id) do nothing;

create policy "public read battle-media"
  on storage.objects for select
  using (bucket_id = 'battle-media');

-- ── Realtime ─────────────────────────────────────────────
-- Broadcast row changes so the map updates live after an admin save (the
-- public read policies above govern what the anon client is allowed to receive).
alter publication supabase_realtime add table battles;
alter publication supabase_realtime add table timeline_events;
alter publication supabase_realtime add table soldiers;
alter publication supabase_realtime add table media;
