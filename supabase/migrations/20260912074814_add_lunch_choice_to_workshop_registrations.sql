-- Lunch preferences are optional for historical rows and only required for
-- workshops explicitly marked as full-day in the catalogue.
alter table public.events
  add column if not exists full_day_workshop boolean not null default false;

update public.events
   set full_day_workshop = true
 where id in ('s4-01', 's4-05', 's4-06', 's4-07', 's4-08');

alter table public.order_lines
  add column if not exists lunch_choice text
  check (lunch_choice is null or lunch_choice in ('veg', 'non_veg'));

alter table public.registrations
  add column if not exists lunch_choice text
  check (lunch_choice is null or lunch_choice in ('veg', 'non_veg'));

-- The order-creation RPC remains the authority for prices and seats. This
-- companion RPC stores the non-financial preference after the order exists,
-- while checking ownership and full-day eligibility server-side.
create or replace function public.set_order_lunch_choices(
  p_order_id uuid,
  p_choices jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.orders where id = p_order_id and user_id = auth.uid()
  ) then
    raise exception 'Order not found' using errcode = '42501';
  end if;

  if p_choices is null or jsonb_typeof(p_choices) <> 'array' then
    raise exception 'Lunch choices must be an array' using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_choices) choice
     where choice ->> 'lunch_choice' not in ('veg', 'non_veg')
  ) then
    raise exception 'Invalid lunch choice' using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from public.order_lines line
      join public.events event on event.id = line.event_id
     where line.order_id = p_order_id
       and event.full_day_workshop
       and not exists (
         select 1 from jsonb_array_elements(p_choices) choice
          where choice ->> 'event_id' = line.event_id
       )
  ) then
    raise exception 'A full-day workshop is missing a lunch choice' using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_choices) choice
      left join public.order_lines line
        on line.order_id = p_order_id and line.event_id = choice ->> 'event_id'
      left join public.events event on event.id = line.event_id
     where line.id is null or not event.full_day_workshop
  ) then
    raise exception 'Lunch choice is only available for full-day workshops' using errcode = 'P0001';
  end if;

  update public.order_lines line
     set lunch_choice = choice ->> 'lunch_choice'
    from jsonb_array_elements(p_choices) choice
   where line.order_id = p_order_id
     and line.event_id = choice ->> 'event_id';
end;
$$;

revoke all on function public.set_order_lunch_choices(uuid, jsonb) from public;
grant execute on function public.set_order_lunch_choices(uuid, jsonb) to authenticated;

-- Existing approval logic inserts registrations from order lines without this
-- new field. Keep that function unchanged and copy the preference immediately
-- after each registration is inserted.
create or replace function public.sync_registration_lunch_choice()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.registrations registration
     set lunch_choice = line.lunch_choice
    from public.order_lines line
   where registration.id = new.id
     and line.order_id = new.order_id
     and line.event_id = new.event_id;
  return new;
end;
$$;

drop trigger if exists registrations_sync_lunch_choice on public.registrations;
create trigger registrations_sync_lunch_choice
after insert on public.registrations
for each row execute function public.sync_registration_lunch_choice();
