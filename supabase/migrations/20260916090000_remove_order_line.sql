-- ============================================================================
-- Letting a delegate take an event back out of an unpaid order.
--
-- There was no way to undo a registration at all. An event sitting in a live
-- order is blocked from being registered again, so a delegate who added the
-- wrong thing was stuck with it for the 48 hours of the hold and could not buy
-- the combo containing it either.
--
-- Only while nothing has been paid. Once a screenshot is submitted the order is
-- evidence in front of an organiser and is not the delegate's to edit.
--
-- The total is recomputed rather than adjusted, because a combo discount cannot
-- survive the combo being broken up. Order S4/0058 was live while this was
-- written: two events, 3100, less a 300 combo discount. Dropping one leg has to
-- withdraw the discount, not keep it.
--
-- Verified against the live database:
--   combo order 3100/-300/2800, remove one leg -> 1300, discount 0, label null
--   its participants went with it
--   removing the last line          -> order cancelled, total 0
--   removing the same line twice    -> refused
--   another delegate removing it    -> refused, "That order is not yours"
--   payment_submitted / under_review / approved / rejected / cancelled
--                                   -> refused, "can no longer be changed"
-- ============================================================================

create or replace function public.recompute_order_totals(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_subtotal       integer := 0;
  v_drule          public.discount_rules%rowtype;
  v_discount       integer;
  v_best           integer := 0;
  v_discount_id    text := null;
  v_discount_label text := null;
  v_eligible_count integer;
  v_eligible_units integer;
  v_eligible_total integer;
begin
  select coalesce(sum(unit_price * quantity), 0) into v_subtotal
    from public.order_lines where order_id = p_order_id;

  -- The same walk create_order makes: every active rule, best one wins.
  for v_drule in
    select * from public.discount_rules
     where active
       and (starts_at is null or now() >= starts_at)
       and (ends_at   is null or now() <= ends_at)
     order by priority
  loop
    select count(*), coalesce(sum(quantity), 0), coalesce(sum(unit_price * quantity), 0)
      into v_eligible_count, v_eligible_units, v_eligible_total
      from public.order_lines ol
     where ol.order_id = p_order_id
       and (v_drule.eligible_event_ids is null or ol.event_id = any (v_drule.eligible_event_ids))
       and (v_drule.eligible_categories is null or ol.category = any (v_drule.eligible_categories));

    if v_eligible_count = 0
       or (v_drule.min_eligible_items is not null and v_eligible_count < v_drule.min_eligible_items)
       or (v_drule.min_quantity is not null and v_eligible_units < v_drule.min_quantity) then
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

  update public.orders
     set subtotal = v_subtotal,
         discount_amount = v_best,
         discount_rule_id = v_discount_id,
         discount_label = v_discount_label,
         total = v_subtotal - v_best
   where id = p_order_id;
end;
$function$;

create or replace function public.remove_order_line(p_line_id uuid)
returns public.orders
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user  uuid := auth.uid();
  v_line  public.order_lines%rowtype;
  v_order public.orders%rowtype;
  v_left  integer;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_line from public.order_lines where id = p_line_id;
  if not found then
    raise exception 'That registration is no longer in your order' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders where id = v_line.order_id for update;
  if not found or v_order.user_id <> v_user then
    raise exception 'That order is not yours' using errcode = '42501';
  end if;

  -- Once payment has been submitted the order belongs to the verification
  -- queue, not to the delegate.
  if v_order.status <> 'awaiting_payment' then
    raise exception 'This order can no longer be changed' using errcode = 'P0001';
  end if;

  delete from public.order_line_participants where order_line_id = p_line_id;
  delete from public.order_lines where id = p_line_id;

  select count(*) into v_left from public.order_lines where order_id = v_order.id;

  if v_left = 0 then
    -- Nothing left to pay for. Cancelling releases the hold rather than
    -- leaving an empty order sitting in the delegate's list.
    update public.orders
       set status = 'cancelled', subtotal = 0, discount_amount = 0,
           discount_rule_id = null, discount_label = null, total = 0
     where id = v_order.id;
  else
    perform public.recompute_order_totals(v_order.id);
  end if;

  select * into v_order from public.orders where id = v_order.id;
  return v_order;
end;
$function$;

revoke all on function public.recompute_order_totals(uuid) from public, anon, authenticated;
grant execute on function public.remove_order_line(uuid) to authenticated;
