-- 48-hour hold on unverified orders.
--
-- An order that is never paid for, or whose proof is never verified, used to
-- hold its seats forever, so a slow verification queue silently locked capacity
-- nobody had paid for. Holds now lapse after 48 hours.
--
-- Deliberately NOT applied to 'approved': a confirmed registration never
-- expires. An order under review is measured from when the delegate submitted
-- their proof, which is the agreed verification window.

create or replace function public.order_hold_expires_at(
  p_status public.order_status,
  p_created_at timestamptz,
  p_submitted_at timestamptz
)
returns timestamptz
language sql
immutable
as $$
  select case
    when p_status = 'awaiting_payment' then p_created_at + interval '48 hours'
    when p_status in ('payment_submitted', 'under_review')
      then coalesce(p_submitted_at, p_created_at) + interval '48 hours'
    else null
  end;
$$;

create or replace function public.event_seats_taken(p_event_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.registrations r where r.event_id = p_event_id)
  + (select count(*)
       from public.order_lines ol
       join public.orders o on o.id = ol.order_id
      where ol.event_id = p_event_id
        and o.status in ('awaiting_payment', 'payment_submitted', 'under_review')
        and public.order_hold_expires_at(o.status, o.created_at, o.submitted_at) > now())
$$;

create or replace function public.expire_stale_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with lapsed as (
    update public.orders
       set status = 'cancelled',
           rejection_reason = coalesce(
             rejection_reason,
             'This order was not verified within 48 hours, so the held seats were released.')
     where status in ('awaiting_payment', 'payment_submitted', 'under_review')
       and public.order_hold_expires_at(status, created_at, submitted_at) <= now()
    returning 1
  )
  select count(*) into v_count from lapsed;
  return v_count;
end;
$$;

revoke execute on function public.expire_stale_orders() from public, anon;
grant execute on function public.expire_stale_orders() to authenticated;
