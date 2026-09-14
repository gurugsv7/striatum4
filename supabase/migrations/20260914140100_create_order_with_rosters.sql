-- ============================================================================
-- create_order accepts registration rosters
--
-- Item shape (the client still sends WHAT, never what it costs):
--
--   {
--     "event_id": "s4-12",
--     "participation": "team",
--     "combo_id": "combo-aquaquest-glandswars",   -- optional
--     "lunch_choice": "veg",                      -- optional, full-day only
--     "teams": [                                  -- optional; 1 entry unless bulk
--       { "team_index": 1,
--         "participants": [
--           {"position":1,"role":"captain","name":"...","year_of_study":"...",
--            "college":"...","phone":"...","email":"..."} ] } ]
--   }
--
-- Team entries decide quantity, so a four-team pack cannot claim four places
-- while naming one team, and a roster cannot exceed the seats being paid for.
--
-- Reproduced from the deployed definition with only the roster handling added.
-- Every existing guard is retained: delegate pass via has_active_delegate_pass,
-- the order-hold expiry filter, per-team capacity, combo windows and the
-- server-side price resolution.
-- ============================================================================

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
  v_teams           jsonb;
  v_team            jsonb;
  v_price           integer;
  v_basis           text;
  v_subtotal        integer := 0;
  v_has_pass        boolean;
  v_tier            text;
  v_rule            public.event_registration_rules%rowtype;
  v_order           public.orders%rowtype;
  v_line_id         uuid;
  v_reference       text;
  v_drule           public.discount_rules%rowtype;
  v_discount        integer := 0;
  v_discount_id     text := null;
  v_discount_label  text := null;
  v_eligible_count  integer;
  v_eligible_units  integer;
  v_eligible_total  integer;
  v_best            integer := 0;
  v_lines           jsonb := '[]'::jsonb;
  v_line            jsonb;
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
  select tier into v_tier from public.delegate_applications
   where user_id = v_user and status = 'approved'
   order by submitted_at desc limit 1;

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

    -- Tier requirement, where the brochure names one.
    select * into v_rule from public.event_registration_rules where event_id = v_event.id;
    if found and v_rule.required_tier is not null then
      if v_tier is null then
        raise exception '% requires a % Delegate Pass; your pass tier is not on record',
          v_event.name, v_rule.required_tier using errcode = 'P0001';
      elsif v_tier <> v_rule.required_tier then
        raise exception '% requires a % Delegate Pass', v_event.name, v_rule.required_tier
          using errcode = 'P0001';
      end if;
    end if;

    -- Team entries decide how many places are bought.
    v_teams := v_item -> 'teams';
    if v_teams is null or jsonb_typeof(v_teams) <> 'array' or jsonb_array_length(v_teams) = 0 then
      -- No roster supplied: fall back to the pre-roster behaviour so an older
      -- client, or an event with nothing to collect, still works.
      v_quantity := coalesce((v_item ->> 'quantity')::int, 1);
      v_teams := null;
    else
      v_quantity := jsonb_array_length(v_teams);
    end if;

    if v_quantity < 1 or v_quantity > 10 then
      raise exception 'Invalid number of teams for %', v_event.name using errcode = 'P0001';
    end if;
    if v_quantity > 1 and v_event.participation <> 'team' then
      raise exception '% is registered per person, not per team', v_event.name
        using errcode = 'P0001';
    end if;

    -- Every roster is checked against the event's published rules.
    if v_teams is not null then
      for v_team in select * from jsonb_array_elements(v_teams)
      loop
        perform public.validate_roster(v_event.id, v_team, v_event.name);
      end loop;
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
      'price_basis',   v_basis,
      'combo_id',      v_item ->> 'combo_id',
      'lunch_choice',  case when v_event.full_day_workshop then v_item ->> 'lunch_choice' else null end,
      'teams',         coalesce(v_teams, '[]'::jsonb)
    );
  end loop;

  for v_drule in
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
     where (v_drule.eligible_event_ids is null
            or (l ->> 'event_id') = any (v_drule.eligible_event_ids))
       and (v_drule.eligible_categories is null
            or (l ->> 'category') = any (v_drule.eligible_categories));

    if v_eligible_count = 0
       or (v_drule.min_eligible_items is not null
           and v_eligible_count < v_drule.min_eligible_items)
       or (v_drule.min_quantity is not null
           and v_eligible_units < v_drule.min_quantity) then
      continue;
    end if;

    if v_drule.discount_type = 'percentage' then
      v_discount := floor(v_eligible_total * v_drule.discount_value / 100.0);
    else
      v_discount := v_drule.discount_value;
    end if;

    if v_drule.max_discount is not null then
      v_discount := least(v_discount, v_drule.max_discount);
    end if;
    v_discount := greatest(0, least(v_discount, v_eligible_total));

    if v_discount > v_best then
      v_best := v_discount;
      v_discount_id := v_drule.id;
      v_discount_label := v_drule.label;
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

  -- Lines, then their rosters, one line at a time so each participant row can
  -- carry its own order_line_id.
  for v_line in select * from jsonb_array_elements(v_lines)
  loop
    insert into public.order_lines (order_id, event_id, event_name, event_code, context,
                                    category, event_date, start_time, participation,
                                    quantity, unit_price, price_basis, lunch_choice, combo_id)
    values (v_order.id,
            v_line ->> 'event_id',  v_line ->> 'event_name', v_line ->> 'event_code',
            v_line ->> 'context',   v_line ->> 'category',
            nullif(v_line ->> 'event_date', '')::date,
            v_line ->> 'start_time', v_line ->> 'participation',
            (v_line ->> 'quantity')::int,
            (v_line ->> 'unit_price')::int, v_line ->> 'price_basis',
            v_line ->> 'lunch_choice', v_line ->> 'combo_id')
    returning id into v_line_id;

    insert into public.order_line_participants
      (order_line_id, order_id, event_id, team_index, position, role,
       name, year_of_study, college, phone, email, linked_user_id)
    select v_line_id,
           v_order.id,
           v_line ->> 'event_id',
           coalesce((t ->> 'team_index')::int, 1),
           coalesce((p ->> 'position')::int, 1),
           coalesce(p ->> 'role', 'member'),
           btrim(p ->> 'name'),
           nullif(btrim(coalesce(p ->> 'year_of_study', '')), ''),
           nullif(btrim(coalesce(p ->> 'college', '')), ''),
           nullif(btrim(coalesce(p ->> 'phone', '')), ''),
           nullif(btrim(coalesce(p ->> 'email', '')), ''),
           -- Only the very first seat is claimed as the buyer.
           case when coalesce((t ->> 'team_index')::int, 1) = 1
                     and coalesce((p ->> 'position')::int, 1) = 1
                then v_user else null end
      from jsonb_array_elements(v_line -> 'teams') t,
           jsonb_array_elements(t -> 'participants') p;
  end loop;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rosters for the verification console and My Events, without raw JSON.
-- ---------------------------------------------------------------------------

-- security_invoker: without it the view runs as its owner and bypasses the RLS
-- policy on order_line_participants, exposing every team's contact details to
-- any signed-in user.
create or replace view public.order_roster_view
with (security_invoker = true)
as
  select p.order_id,
         p.event_id,
         ol.event_name,
         ol.combo_id,
         p.team_index,
         p.position,
         p.role,
         p.name,
         p.year_of_study,
         p.college,
         p.phone,
         p.email
    from public.order_line_participants p
    join public.order_lines ol on ol.id = p.order_line_id
   order by ol.event_name, p.team_index, p.position;

grant select on public.order_roster_view to authenticated;

-- An internal helper for create_order; nothing calls it over the REST API.
revoke all on function public.validate_roster(text, jsonb, text) from public;
revoke all on function public.validate_roster(text, jsonb, text) from anon;
revoke all on function public.validate_roster(text, jsonb, text) from authenticated;
