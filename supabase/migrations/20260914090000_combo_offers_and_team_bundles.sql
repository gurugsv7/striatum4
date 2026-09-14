-- ============================================================================
-- Combo offers and multi-team quiz entries
--
-- Two capabilities, both built on machinery that already exists rather than
-- beside it:
--
--   1. Combos are rows in public.discount_rules. The rule matcher in
--      create_order already resolves "these events together, this much off";
--      it gains a validity window and a quantity threshold, and the combos are
--      seeded as ordinary rules. No new pricing path, and the server stays the
--      only place a total is decided.
--
--   2. "Group of 4 Teams" means four distinct teams entering one quiz, not a
--      four-person team. order_lines gains a quantity and registrations gain a
--      team_index, so one order can carry four real places in the same event.
--
-- The three functions below are reproduced from the CURRENT deployed
-- definitions, not from the original core migration, so that everything added
-- since is preserved rather than silently rolled back:
--
--   * create_order keeps has_active_delegate_pass() (immediate pass access)
--     and the order-hold expiry filter on the pending-order check.
--   * approve_order keeps the payment-proof requirement in full, including the
--     storage-object existence check, and keeps copying lunch_choice.
--   * event_seats_taken keeps the expiry filter so lapsed holds release seats.
--
-- Nothing here changes proof upload, manual verification, order expiry or
-- delegate approval.
-- ============================================================================

-- ------------------------------------------------------ multi-team lines ----

alter table public.order_lines
  add column if not exists quantity integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'order_lines_quantity_sane'
  ) then
    alter table public.order_lines
      add constraint order_lines_quantity_sane check (quantity between 1 and 10);
  end if;
end;
$$;

comment on column public.order_lines.quantity is
  'Team entries purchased for this event on this order. 1 for an individual place.';

alter table public.registrations
  add column if not exists team_index integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'registrations_team_index_sane'
  ) then
    alter table public.registrations
      add constraint registrations_team_index_sane check (team_index >= 1);
  end if;
end;
$$;

comment on column public.registrations.team_index is
  'Distinguishes the teams of a multi-team entry. 1 for a single place.';

-- A delegate may now hold several places in one event, but each must be a
-- distinct team. Existing rows default to team_index 1 and stay unique.
alter table public.registrations
  drop constraint if exists registrations_user_id_event_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'registrations_one_place_per_team'
  ) then
    alter table public.registrations
      add constraint registrations_one_place_per_team
        unique (user_id, event_id, team_index);
  end if;
end;
$$;

-- ------------------------------------------------------ combo rule fields ---

alter table public.discount_rules
  add column if not exists kind text not null default 'rule';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'discount_rules_kind_known') then
    alter table public.discount_rules
      add constraint discount_rules_kind_known check (kind in ('rule', 'combo'));
  end if;
end;
$$;

alter table public.discount_rules add column if not exists starts_at timestamptz;
alter table public.discount_rules add column if not exists ends_at   timestamptz;

-- Minimum total team entries across the eligible lines. The pair combos leave
-- this null; the four-team packs set it to 4.
alter table public.discount_rules add column if not exists min_quantity integer;

comment on column public.discount_rules.ends_at is
  'Offer closes after this instant. Combos close at the end of 27 Sep 2026 IST.';

-- ---------------------------------------------------------------- seats -----
-- Seats consumed must count team entries, not rows, now that one line can hold
-- several places. The expiry filter is unchanged.

create or replace function public.event_seats_taken(p_event_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.registrations r where r.event_id = p_event_id)
  + (select coalesce(sum(ol.quantity), 0)
       from public.order_lines ol
       join public.orders o on o.id = ol.order_id
      where ol.event_id = p_event_id
        and o.status in ('awaiting_payment', 'payment_submitted', 'under_review')
        and public.order_hold_expires_at(o.status, o.created_at, o.submitted_at) > now())
$$;

-- ------------------------------------------------------------ create_order --
-- Unchanged in intent: the client sends only WHAT it wants. This revision adds
-- a per-item quantity, prices it, checks capacity against it, and honours the
-- combo validity window and quantity threshold.

create or replace function public.create_order(p_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user            uuid := auth.uid();
  v_phase           text;
  v_item            jsonb;
  v_event           public.events%rowtype;
  v_participation   text;
  v_quantity        integer;
  v_price           integer;
  v_basis           text;
  v_subtotal        integer := 0;
  v_has_pass        boolean;
  v_order           public.orders%rowtype;
  v_reference       text;
  v_rule            public.discount_rules%rowtype;
  v_discount        integer := 0;
  v_discount_id     text := null;
  v_discount_label  text := null;
  v_eligible_count  integer;
  v_eligible_units  integer;
  v_eligible_total  integer;
  v_best            integer := 0;
  v_lines           jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty' using errcode = 'P0001';
  end if;

  select (value #>> '{}') into v_phase from public.app_settings where key = 'pricing_phase';
  v_phase := coalesce(v_phase, 'early');

  v_has_pass := public.has_active_delegate_pass(v_user);

  -- An event may appear only once per order; several teams travel as quantity.
  if (select count(*) from (
        select v -> 'event_id' from jsonb_array_elements(p_items) v group by 1 having count(*) > 1
      ) duplicated) > 0 then
    raise exception 'An event cannot be added twice to one order' using errcode = 'P0001';
  end if;

  perform 1
     from public.events
    where id in (select jsonb_array_elements(p_items) ->> 'event_id')
    order by id
      for update;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_event from public.events where id = v_item ->> 'event_id';
    if not found then
      raise exception 'Unknown event: %', v_item ->> 'event_id' using errcode = 'P0001';
    end if;

    if not v_event.registerable or v_event.status in ('closed', 'not_registerable') then
      raise exception '% is not open for registration', v_event.name using errcode = 'P0001';
    end if;

    if v_event.price_unspecified then
      raise exception 'Fees are not yet published for %', v_event.name using errcode = 'P0001';
    end if;

    if v_event.delegate_pass_requirement = 'required' and not v_has_pass then
      raise exception '% requires a Delegate Pass', v_event.name using errcode = 'P0001';
    end if;

    v_quantity := coalesce((v_item ->> 'quantity')::int, 1);
    if v_quantity < 1 or v_quantity > 10 then
      raise exception 'Invalid number of teams for %', v_event.name using errcode = 'P0001';
    end if;
    -- Only team events can be entered several times over. A workshop place is
    -- one person's seat, so a quantity above one there is always a mistake.
    if v_quantity > 1 and v_event.participation <> 'team' then
      raise exception '% is registered per person, not per team', v_event.name
        using errcode = 'P0001';
    end if;

    if exists (select 1 from public.registrations
                where user_id = v_user and event_id = v_event.id) then
      raise exception 'You are already registered for %', v_event.name using errcode = 'P0001';
    end if;

    if exists (select 1
                 from public.order_lines ol
                 join public.orders o on o.id = ol.order_id
                where ol.event_id = v_event.id
                  and o.user_id = v_user
                  and o.status in ('awaiting_payment', 'payment_submitted', 'under_review')
                  and public.order_hold_expires_at(o.status, o.created_at, o.submitted_at) > now()) then
      raise exception '% is already in an order awaiting verification', v_event.name
        using errcode = 'P0001';
    end if;

    -- Every team in a bulk entry needs its own seat. For a single place this is
    -- the same test as before.
    if v_event.slots is not null
       and public.event_seats_taken(v_event.id) + v_quantity > v_event.slots then
      raise exception '% does not have enough places left', v_event.name using errcode = 'P0001';
    end if;

    v_participation := coalesce(v_item ->> 'participation',
                                case when v_event.participation = 'team'
                                     then 'team' else 'individual' end);

    if v_event.price_early_bird is not null or v_event.price_late_bird is not null then
      if v_phase <> 'early' and v_event.price_late_bird is not null then
        v_price := v_event.price_late_bird; v_basis := 'Late bird';
      else
        v_price := v_event.price_early_bird; v_basis := 'Early bird';
      end if;
    elsif v_event.price_entry is not null or v_event.price_spot is not null then
      if v_phase = 'spot' and v_event.price_spot is not null then
        v_price := v_event.price_spot; v_basis := 'Spot entry';
      else
        v_price := v_event.price_entry; v_basis := 'Entry';
      end if;
    elsif v_participation = 'team' and v_event.price_team is not null then
      v_price := v_event.price_team; v_basis := 'Team';
    elsif v_participation = 'individual' and v_event.price_individual is not null then
      v_price := v_event.price_individual; v_basis := 'Individual';
    elsif v_event.price_team is not null then
      v_price := v_event.price_team; v_basis := 'Team';
    elsif v_event.price_individual is not null then
      v_price := v_event.price_individual; v_basis := 'Individual';
    elsif v_event.price_flat is not null then
      v_price := v_event.price_flat; v_basis := 'Registration';
    else
      raise exception 'No published fee for %', v_event.name using errcode = 'P0001';
    end if;

    if v_event.price_unit = 'per_team' then
      v_basis := v_basis || ' - per team';
    elsif v_event.price_unit = 'per_person' then
      v_basis := v_basis || ' - per person';
    end if;

    v_subtotal := v_subtotal + (v_price * v_quantity);
    v_lines := v_lines || jsonb_build_object(
      'event_id',      v_event.id,
      'event_name',    v_event.name,
      'event_code',    v_event.code,
      'context',       coalesce(v_event.specialties[1] || ' - ', '') || v_event.format,
      'category',      v_event.category,
      'event_date',    v_event.event_date,
      'start_time',    v_event.start_time,
      'participation', v_participation,
      'quantity',      v_quantity,
      'unit_price',    v_price,
      'price_basis',   v_basis
    );
  end loop;

  -- Best active offer wins; combos are ordinary rules with a closing date.
  for v_rule in
    select * from public.discount_rules
     where active
       and (starts_at is null or now() >= starts_at)
       and (ends_at   is null or now() <= ends_at)
     order by priority
  loop
    select count(*),
           coalesce(sum((l ->> 'quantity')::int), 0),
           coalesce(sum((l ->> 'unit_price')::int * (l ->> 'quantity')::int), 0)
      into v_eligible_count, v_eligible_units, v_eligible_total
      from jsonb_array_elements(v_lines) l
     where (v_rule.eligible_event_ids is null
            or (l ->> 'event_id') = any (v_rule.eligible_event_ids))
       and (v_rule.eligible_categories is null
            or (l ->> 'category') = any (v_rule.eligible_categories));

    if v_eligible_count = 0
       or (v_rule.min_eligible_items is not null
           and v_eligible_count < v_rule.min_eligible_items)
       or (v_rule.min_quantity is not null
           and v_eligible_units < v_rule.min_quantity) then
      continue;
    end if;

    if v_rule.discount_type = 'percentage' then
      v_discount := floor(v_eligible_total * v_rule.discount_value / 100.0);
    else
      v_discount := v_rule.discount_value;
    end if;

    if v_rule.max_discount is not null then
      v_discount := least(v_discount, v_rule.max_discount);
    end if;
    v_discount := greatest(0, least(v_discount, v_eligible_total));

    if v_discount > v_best then
      v_best := v_discount;
      v_discount_id := v_rule.id;
      v_discount_label := v_rule.label;
    end if;
  end loop;

  v_reference := 'S4 / ' || lpad(nextval('public.order_reference_seq')::text, 4, '0');

  insert into public.orders (reference, user_id, subtotal, discount_amount,
                             discount_rule_id, discount_label, total,
                             pricing_phase, status)
  values (v_reference, v_user, v_subtotal, v_best,
          v_discount_id, v_discount_label, v_subtotal - v_best,
          v_phase, 'awaiting_payment')
  returning * into v_order;

  insert into public.order_lines (order_id, event_id, event_name, event_code, context,
                                  category, event_date, start_time, participation,
                                  quantity, unit_price, price_basis)
  select v_order.id,
         l ->> 'event_id',   l ->> 'event_name', l ->> 'event_code',
         l ->> 'context',    l ->> 'category',
         nullif(l ->> 'event_date', '')::date,
         l ->> 'start_time', l ->> 'participation',
         (l ->> 'quantity')::int,
         (l ->> 'unit_price')::int, l ->> 'price_basis'
    from jsonb_array_elements(v_lines) l;

  return v_order;
end;
$$;

-- ----------------------------------------------------------- approve_order --
-- One registration per team entry, so a four-team pack produces four places.
-- Every payment-proof guard is retained exactly as deployed.

create or replace function public.approve_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_line  public.order_lines%rowtype;
  v_team  integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0001';
  end if;
  if v_order.status = 'approved' then
    raise exception 'Order is already approved' using errcode = 'P0001';
  end if;
  if v_order.status not in ('payment_submitted', 'under_review') then
    raise exception 'Payment proof must be submitted before approval'
      using errcode = 'P0001';
  end if;
  if v_order.proof_path is null
     or v_order.proof_mime not in ('image/jpeg', 'image/png')
     or v_order.proof_size is null
     or v_order.proof_size <= 0
     or v_order.proof_size > 5242880 then
    raise exception 'A valid payment screenshot is required before approval'
      using errcode = 'P0001';
  end if;
  if not exists (
    select 1
      from storage.objects obj
     where obj.bucket_id = 'payment-proofs'
       and obj.name = v_order.proof_path
       and coalesce((obj.metadata ->> 'size')::bigint, 0) > 0
  ) then
    raise exception 'Payment screenshot file is missing from secure storage'
      using errcode = 'P0001';
  end if;

  for v_line in select * from public.order_lines where order_id = p_order_id
  loop
    for v_team in 1 .. v_line.quantity
    loop
      insert into public.registrations
        (order_id, user_id, event_id, participation, lunch_choice, team_index)
      values
        (v_order.id, v_order.user_id, v_line.event_id, v_line.participation,
         v_line.lunch_choice, v_team)
      on conflict (user_id, event_id, team_index) do nothing;
    end loop;
  end loop;

  update public.orders
     set status = 'approved', reviewed_at = now(),
         reviewed_by = auth.uid(), rejection_reason = null
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$;

-- ------------------------------------------------------------ combo offers --
-- Composition and amounts come from the organisers' Combo Offers document.
-- discount_value is the saving; the server subtracts it from the re-read
-- catalogue total, so a change in event pricing can never be silently
-- overridden by a stale combo price.
--
-- Offers close at the end of 27 September 2026, Asia/Kolkata (18:29:59Z).

insert into public.discount_rules
  (id, name, label, kind, eligible_event_ids, min_eligible_items, min_quantity,
   discount_type, discount_value, active, priority, ends_at)
values
  ('combo-bonefire-trauma', 'Bonefire + Trauma Resuscitation',
   'COMBO - BONEFIRE + TRAUMA RESUSCITATION', 'combo',
   array['s4-07','s4-08'], 2, null, 'fixed', 300, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-genesis-sono', 'Genesis + The Sono Edge',
   'COMBO - GENESIS + THE SONO EDGE', 'combo',
   array['s4-05','s4-01'], 2, null, 'fixed', 200, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-stitchreef-trauma', 'Stitchreef + Trauma Resuscitation',
   'COMBO - STITCHREEF + TRAUMA RESUSCITATION', 'combo',
   array['s4-02','s4-08'], 2, null, 'fixed', 300, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-stitchreef-pleuralis', 'Stitchreef + Pleuralis',
   'COMBO - STITCHREEF + PLEURALIS', 'combo',
   array['s4-02','s4-09'], 2, null, 'fixed', 200, true, 30,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-genesis-stitchreef-pleuralis', 'Genesis + Stitchreef + Pleuralis',
   'COMBO - GENESIS + STITCHREEF + PLEURALIS', 'combo',
   array['s4-05','s4-02','s4-09'], 3, null, 'fixed', 200, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-rythmica-glowcode', 'Rythmica + Glow Code',
   'COMBO - RYTHMICA + GLOW CODE', 'combo',
   array['s4-10','s4-06'], 2, null, 'fixed', 200, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-rythmica-penumbra-paedopraxis', 'Rythmica + Penumbra + Paedopraxis',
   'COMBO - RYTHMICA + PENUMBRA + PAEDOPRAXIS', 'combo',
   array['s4-10','s4-04','s4-03'], 3, null, 'fixed', 200, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-oceanic-glandswars', 'Oceanic Odyssey + Glandswars',
   'COMBO - OCEANIC ODYSSEY + GLANDSWARS', 'combo',
   array['s4-11','s4-13'], 2, null, 'fixed', 150, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-aquaquest-glandswars', 'Aquaquest + Glandswars',
   'COMBO - AQUAQUEST + GLANDSWARS', 'combo',
   array['s4-12','s4-13'], 2, null, 'fixed', 200, true, 20,
   timestamptz '2026-09-27 18:29:59.999+00'),

  -- Four distinct teams entering one quiz.
  ('combo-glandswars-4-teams', 'Glandswars, four teams',
   'COMBO - 4 TEAMS - GLANDSWARS', 'combo',
   array['s4-13'], 1, 4, 'fixed', 200, true, 10,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-oceanic-4-teams', 'Oceanic Odyssey, four teams',
   'COMBO - 4 TEAMS - OCEANIC ODYSSEY', 'combo',
   array['s4-11'], 1, 4, 'fixed', 200, true, 10,
   timestamptz '2026-09-27 18:29:59.999+00'),

  ('combo-aquaquest-4-teams', 'Aquaquest, four teams',
   'COMBO - 4 TEAMS - AQUAQUEST', 'combo',
   array['s4-12'], 1, 4, 'fixed', 300, true, 10,
   timestamptz '2026-09-27 18:29:59.999+00')
on conflict (id) do update set
  name               = excluded.name,
  label              = excluded.label,
  kind               = excluded.kind,
  eligible_event_ids = excluded.eligible_event_ids,
  min_eligible_items = excluded.min_eligible_items,
  min_quantity       = excluded.min_quantity,
  discount_type      = excluded.discount_type,
  discount_value     = excluded.discount_value,
  active             = excluded.active,
  priority           = excluded.priority,
  ends_at            = excluded.ends_at;
