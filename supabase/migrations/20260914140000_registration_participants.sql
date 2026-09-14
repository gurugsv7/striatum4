-- ============================================================================
-- Registration participants
--
-- A cart item used to be an event id, so an order recorded "this user bought
-- Aquaquest" while the actual competition entry is three named people. This
-- adds the roster as real rows and re-validates it server-side, because a
-- team's composition decides eligibility and a client cannot be trusted with
-- eligibility any more than it can be trusted with a price.
--
-- Shape:
--   orders -> order_lines -> order_line_participants
--                         -> registrations (one per team entry, already)
--
-- Participants hang off the ORDER LINE, not the registration, because they are
-- known at checkout and registrations are only created once an organiser
-- approves the payment. Both carry (event_id, team_index), so a registration
-- joins to its roster without duplicating it.
--
-- Nothing here changes pricing, capacity, proof upload, verification, order
-- expiry or delegate approval.
-- ============================================================================

create table if not exists public.order_line_participants (
  id             uuid primary key default gen_random_uuid(),
  order_line_id  uuid not null references public.order_lines (id) on delete cascade,
  order_id       uuid not null references public.orders (id) on delete cascade,
  event_id       text not null references public.events (id),

  -- Which team of a multi-team entry, and which seat within it.
  team_index     integer not null default 1 check (team_index >= 1),
  position       integer not null check (position >= 1),
  role           text    not null default 'member' check (role in ('captain', 'member')),

  name           text not null check (length(btrim(name)) > 0),
  year_of_study  text,
  college        text,
  phone          text,
  email          text,

  /* The signed-in user, when this participant is them. */
  linked_user_id uuid references auth.users (id) on delete set null,

  created_at     timestamptz not null default now(),

  unique (order_line_id, team_index, position)
);

create index if not exists olp_order_idx on public.order_line_participants (order_id);
create index if not exists olp_event_idx on public.order_line_participants (event_id);

comment on table public.order_line_participants is
  'Who is actually taking part. One row per person per team entry on an order line.';

alter table public.order_line_participants enable row level security;

-- A delegate reads only their own roster; organisers read every roster. Nobody
-- reads another team's contact details.
drop policy if exists olp_select on public.order_line_participants;
create policy olp_select on public.order_line_participants
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
       where o.id = order_line_participants.order_id
         and o.user_id = auth.uid()
    )
  );

-- Writes happen only inside create_order, which is SECURITY DEFINER. No direct
-- insert path is granted, so a client cannot inject a roster after the fact.
revoke all on public.order_line_participants from anon, authenticated;
grant select on public.order_line_participants to authenticated;

-- ------------------------------------------------------- combo provenance ---
-- An order already records which discount rule applied, which is the combo id.
-- The line needs it too, so My Events and the console can say which bundle a
-- particular event arrived in when an order mixes combos with singles.

alter table public.order_lines
  add column if not exists combo_id text;

comment on column public.order_lines.combo_id is
  'The combo this line was bought as part of, when it was. Null for a single event.';

-- ---------------------------------------------------------- delegate tier ---
-- MEDMAZE names a Tier 2 pass. The tier was only ever held in browser state,
-- so it could not be checked. Store it on the application.

alter table public.delegate_applications
  add column if not exists tier text check (tier is null or tier in ('AQUALUME', 'SYNEXA'));

comment on column public.delegate_applications.tier is
  'Delegate pass tier. Null for applications filed before the tier was recorded.';

-- ============================================================================
-- Roster validation
--
-- Mirrors src/data/registrationSchemas.ts. Kept as data so the two can be
-- compared, rather than as branching code that silently drifts.
-- ============================================================================

create table if not exists public.event_registration_rules (
  event_id        text primary key references public.events (id) on delete cascade,
  min_members     integer not null default 1 check (min_members >= 1),
  max_members     integer not null default 1 check (max_members >= 1),
  same_college    boolean not null default false,
  allowed_years   text[],
  /* [{"year": "CRRI / Intern", "max": 1}, ...] */
  year_limits     jsonb not null default '[]'::jsonb,
  required_tier   text check (required_tier is null or required_tier in ('AQUALUME', 'SYNEXA')),
  constraint rules_bounds check (max_members >= min_members)
);

alter table public.event_registration_rules enable row level security;
drop policy if exists err_read on public.event_registration_rules;
create policy err_read on public.event_registration_rules for select using (true);
drop policy if exists err_write on public.event_registration_rules;
create policy err_write on public.event_registration_rules for all
  using (public.is_admin()) with check (public.is_admin());

-- Defaults for every registerable event: a single participant.
insert into public.event_registration_rules (event_id, min_members, max_members)
select e.id,
       case when e.participation = 'individual' then 1 else coalesce(e.team_min, 1) end,
       case when e.participation = 'individual' then 1 else coalesce(e.team_max, 6) end
  from public.events e
 where e.registerable
on conflict (event_id) do update set
  min_members = excluded.min_members,
  max_members = excluded.max_members;

-- Brochure-stated team rules.
insert into public.event_registration_rules
  (event_id, min_members, max_members, same_college, allowed_years, year_limits, required_tier)
values
  -- Oceanic Odyssey: exactly 3, one college, 1 third year, 2 second years.
  ('s4-11', 3, 3, true,
   array['1st Year','2nd Year','3rd Year'],
   '[{"year":"3rd Year","max":1},{"year":"2nd Year","max":2}]'::jsonb, null),
  -- Aquaquest: exactly 3, one college, 1 CRRI, 1 final year.
  ('s4-12', 3, 3, true,
   array['2nd Year','3rd Year','Final Year','CRRI / Intern'],
   '[{"year":"CRRI / Intern","max":1},{"year":"Final Year","max":1}]'::jsonb, null),
  -- Glandswars: up to 2, cross-college allowed, 1 CRRI.
  ('s4-13', 1, 2, false,
   array['1st Year','2nd Year','3rd Year','Final Year','CRRI / Intern'],
   '[{"year":"CRRI / Intern","max":1}]'::jsonb, null),
  -- Luminara: 2 to 6, one institution.
  ('s4-14', 2, 6, true, null, '[]'::jsonb, null),
  -- Neuronova: individual or small team; the brochure recommends but does not require.
  ('s4-18', 1, 3, false, null, '[]'::jsonb, null),
  -- The Medical Vault: exactly 3.
  ('s4-25', 3, 3, false, null, '[]'::jsonb, null),
  -- Medmaze: exactly 3, Tier 2 pass.
  ('s4-26', 3, 3, false, null, '[]'::jsonb, 'SYNEXA')
on conflict (event_id) do update set
  min_members   = excluded.min_members,
  max_members   = excluded.max_members,
  same_college  = excluded.same_college,
  allowed_years = excluded.allowed_years,
  year_limits   = excluded.year_limits,
  required_tier = excluded.required_tier;

-- ---------------------------------------------------------------------------
-- Validates one team against an event's rules. Raises on the first breach.
-- ---------------------------------------------------------------------------

create or replace function public.validate_roster(
  p_event_id text,
  p_team jsonb,
  p_event_name text
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rule    public.event_registration_rules%rowtype;
  v_people  jsonb := coalesce(p_team -> 'participants', '[]'::jsonb);
  v_count   integer := jsonb_array_length(v_people);
  v_limit   jsonb;
  v_person  jsonb;
  v_colleges integer;
begin
  select * into v_rule from public.event_registration_rules where event_id = p_event_id;
  if not found then
    -- No published team rule: a single participant is still required so that
    -- an order can never be a registration with nobody in it.
    if v_count < 1 then
      raise exception 'Add at least one participant for %', p_event_name using errcode = 'P0001';
    end if;
    return;
  end if;

  if v_count < v_rule.min_members or v_count > v_rule.max_members then
    if v_rule.min_members = v_rule.max_members then
      raise exception '% needs exactly % participant(s)', p_event_name, v_rule.min_members
        using errcode = 'P0001';
    else
      raise exception '% takes between % and % members', p_event_name, v_rule.min_members, v_rule.max_members
        using errcode = 'P0001';
    end if;
  end if;

  -- Everyone needs a name.
  if exists (
    select 1 from jsonb_array_elements(v_people) p
     where coalesce(btrim(p ->> 'name'), '') = ''
  ) then
    raise exception 'Every participant for % needs a name', p_event_name using errcode = 'P0001';
  end if;

  -- One college for the whole team, where the brochure says so.
  if v_rule.same_college then
    select count(distinct lower(btrim(coalesce(p ->> 'college', ''))))
      into v_colleges
      from jsonb_array_elements(v_people) p;
    if v_colleges <> 1 or exists (
      select 1 from jsonb_array_elements(v_people) p
       where coalesce(btrim(p ->> 'college'), '') = ''
    ) then
      raise exception 'All members of a % team must be from the same college', p_event_name
        using errcode = 'P0001';
    end if;
  end if;

  -- Eligible years.
  if v_rule.allowed_years is not null then
    for v_person in select * from jsonb_array_elements(v_people)
    loop
      if coalesce(v_person ->> 'year_of_study', '') <> ''
         and not (v_person ->> 'year_of_study') = any (v_rule.allowed_years) then
        raise exception '% is not eligible for %', v_person ->> 'year_of_study', p_event_name
          using errcode = 'P0001';
      end if;
    end loop;
  end if;

  -- Per-team year caps.
  for v_limit in select * from jsonb_array_elements(v_rule.year_limits)
  loop
    if (select count(*) from jsonb_array_elements(v_people) p
         where p ->> 'year_of_study' = v_limit ->> 'year') > (v_limit ->> 'max')::int then
      raise exception '% allows at most % of %', p_event_name, v_limit ->> 'max', v_limit ->> 'year'
        using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

revoke all on function public.validate_roster(text, jsonb, text) from anon, authenticated;
