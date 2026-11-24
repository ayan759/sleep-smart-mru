-- Sleep Smart MRU: anonymous campus sleep-barrier poll.
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.
--
-- Privacy model
--   * No names, emails, accounts, free text or raw IP addresses are stored.
--   * poll_responses has RLS on and NO policies: anon/authenticated can't read or write it.
--     Inserts happen only through the Next.js server route using the service-role key.
--   * The public can read only aggregate views. Year/faculty breakdowns drop groups < 10.
--   * Realtime streams poll_tick (counts only), never individual responses.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ polls
create table if not exists public.polls (
  id text primary key,
  title text not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.polls enable row level security;
create policy "polls are public" on public.polls for select to anon, authenticated using (true);
grant select on public.polls to anon, authenticated;

insert into public.polls (id, title)
values ('fall-2026', 'What cuts into your sleep? (Fall 2026)')
on conflict (id) do nothing;

-- ------------------------------------------------------------------ responses
create table if not exists public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references public.polls (id) on delete cascade,
  dataset text not null check (dataset in ('live', 'demo')),
  -- sha256(poll id + random device token from localStorage), hex. Not linkable to a person.
  device_hash text not null check (device_hash ~ '^[0-9a-f]{64}$'),
  barriers text[] not null check (
    cardinality(barriers) between 1 and 3
    and barriers <@ array[
      'assignments','exams','early_classes','late_classes','job_shifts','commute','stress',
      'screens','gaming','caffeine','social','noise','family','other'
    ]::text[]
  ),
  top_barrier text not null,
  supports text[] not null check (
    cardinality(supports) between 1 and 2
    and supports <@ array[
      'posters','app_reminders','sleep_tools','quiet_spaces','fewer_early_exams','workshops','other'
    ]::text[]
  ),
  year_of_study text check (year_of_study in ('1','2','3','4','5plus')),
  faculty text check (faculty in ('arts','business_comms','health_education','science_tech','open_studies')),
  sleep_bucket text check (sleep_bucket in ('lt5','5_6','6_7','7_8','8_9','9plus')),
  -- Coarse on purpose: hour only.
  created_hour timestamptz not null default date_trunc('hour', now()),
  constraint top_barrier_is_chosen check (top_barrier = any (barriers)),
  constraint one_response_per_device unique (poll_id, dataset, device_hash)
);
create index if not exists poll_responses_poll_dataset on public.poll_responses (poll_id, dataset);

alter table public.poll_responses enable row level security;
revoke all on public.poll_responses from anon, authenticated;

-- ------------------------------------------------------------------ rate limiting
create table if not exists public.poll_rate_limits (
  bucket text not null, -- HMAC of the IP with a daily-rotating key; never the raw IP
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket, window_start)
);
alter table public.poll_rate_limits enable row level security;
revoke all on public.poll_rate_limits from anon, authenticated;

create or replace function public.poll_rate_hit(p_bucket text, p_window_seconds int, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into poll_rate_limits (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = poll_rate_limits.hits + 1
  returning hits into n;
  delete from poll_rate_limits where window_start < now() - interval '1 day';
  return n <= p_limit;
end;
$$;
revoke all on function public.poll_rate_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.poll_rate_hit(text, int, int) to service_role;

-- ------------------------------------------------------------------ live counter (realtime)
create table if not exists public.poll_tick (
  poll_id text not null,
  dataset text not null,
  responses int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (poll_id, dataset)
);
alter table public.poll_tick enable row level security;
create policy "counts are public" on public.poll_tick for select to anon, authenticated using (true);
grant select on public.poll_tick to anon, authenticated;

create or replace function public.poll_tick_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
  d text;
begin
  if tg_op = 'DELETE' then
    p := old.poll_id; d := old.dataset;
  else
    p := new.poll_id; d := new.dataset;
  end if;
  insert into poll_tick (poll_id, dataset, responses, updated_at)
  values (p, d, (select count(*) from poll_responses r where r.poll_id = p and r.dataset = d), now())
  on conflict (poll_id, dataset)
  do update set responses = excluded.responses, updated_at = excluded.updated_at;
  return null;
end;
$$;

drop trigger if exists poll_responses_tick on public.poll_responses;
create trigger poll_responses_tick
after insert or delete on public.poll_responses
for each row execute function public.poll_tick_refresh();

do $$
begin
  alter publication supabase_realtime add table public.poll_tick;
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------------ aggregate views (public)
-- Views run with their owner's rights (security_invoker = false), so they can aggregate the
-- locked table while exposing only counts.
create or replace view public.v_poll_totals as
  select poll_id, dataset, count(*)::int as responses
  from public.poll_responses group by poll_id, dataset;

create or replace view public.v_poll_barriers as
  select r.poll_id, r.dataset, b.option_id, count(*)::int as n
  from public.poll_responses r cross join lateral unnest(r.barriers) as b(option_id)
  group by r.poll_id, r.dataset, b.option_id;

create or replace view public.v_poll_top_barrier as
  select poll_id, dataset, top_barrier as option_id, count(*)::int as n
  from public.poll_responses group by poll_id, dataset, top_barrier;

create or replace view public.v_poll_supports as
  select r.poll_id, r.dataset, s.option_id, count(*)::int as n
  from public.poll_responses r cross join lateral unnest(r.supports) as s(option_id)
  group by r.poll_id, r.dataset, s.option_id;

-- Breakdowns: groups with fewer than 10 respondents are excluded here, in the database.
create or replace view public.v_poll_year_barriers as
  with g as (
    select poll_id, dataset, year_of_study, count(*)::int as group_n
    from public.poll_responses where year_of_study is not null
    group by poll_id, dataset, year_of_study
    having count(*) >= 10
  )
  select r.poll_id, r.dataset, r.year_of_study as group_id, g.group_n, b.option_id, count(*)::int as n
  from public.poll_responses r
  join g on g.poll_id = r.poll_id and g.dataset = r.dataset and g.year_of_study = r.year_of_study
  cross join lateral unnest(r.barriers) as b(option_id)
  group by r.poll_id, r.dataset, r.year_of_study, g.group_n, b.option_id;

create or replace view public.v_poll_faculty_barriers as
  with g as (
    select poll_id, dataset, faculty, count(*)::int as group_n
    from public.poll_responses where faculty is not null
    group by poll_id, dataset, faculty
    having count(*) >= 10
  )
  select r.poll_id, r.dataset, r.faculty as group_id, g.group_n, b.option_id, count(*)::int as n
  from public.poll_responses r
  join g on g.poll_id = r.poll_id and g.dataset = r.dataset and g.faculty = r.faculty
  cross join lateral unnest(r.barriers) as b(option_id)
  group by r.poll_id, r.dataset, r.faculty, g.group_n, b.option_id;

grant select on
  public.v_poll_totals, public.v_poll_barriers, public.v_poll_top_barrier, public.v_poll_supports,
  public.v_poll_year_barriers, public.v_poll_faculty_barriers
to anon, authenticated;
