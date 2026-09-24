-- Finance approval belongs to the finance mailbox alone. Event organisers can
-- inspect the current conclave roster without receiving orders or proofs.
do $$
begin
  if not exists (
    select 1 from public.admins a join auth.users u on u.id = a.user_id
    where lower(u.email) = 'gurugsv235@gmail.com'
      and nullif(u.encrypted_password, '') is not null
  ) then
    raise exception 'Shared event-admin Auth account is missing or has no password';
  end if;
  if not exists (
    select 1 from public.admins a join auth.users u on u.id = a.user_id
    where lower(u.email) = 'financesigma26@gmail.com'
  ) then
    raise exception 'Finance admin Auth account is missing';
  end if;
end $$;

create or replace function public.is_finance_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    join auth.users u on u.id = a.user_id
    where a.user_id = (select auth.uid())
      and lower(u.email) = 'financesigma26@gmail.com'
  );
$$;
revoke all on function public.is_finance_admin() from public, anon;
grant execute on function public.is_finance_admin() to authenticated;

-- These predate the finance role and still checked the wider admin role.
-- Keep their validated business logic intact while replacing that one gate.
do $$
declare
  signature text;
  definition text;
begin
  foreach signature in array array[
    'public.approve_delegate(uuid)',
    'public.reject_delegate(uuid,text)',
    'public.revoke_delegate(uuid,text)'
  ] loop
    definition := pg_get_functiondef(signature::regprocedure);
    if position('if not public.is_admin() then' in definition) = 0 then
      raise exception 'Unexpected approval function body: %', signature;
    end if;
    execute replace(definition,
      'if not public.is_admin() then',
      'if not public.is_finance_admin() then');
  end loop;
end $$;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_finance_admin()));

drop policy if exists lines_select on public.order_lines;
create policy lines_select on public.order_lines for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_lines.order_id
      and (o.user_id = (select auth.uid()) or (select public.is_finance_admin()))
  ));

drop policy if exists delegate_select on public.delegate_applications;
create policy delegate_select on public.delegate_applications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_finance_admin()));

drop policy if exists regs_select on public.registrations;
create policy regs_select on public.registrations for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_finance_admin()));

drop policy if exists proof_read_own on storage.objects;
create policy proof_read_own on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_finance_admin())
  ));

drop policy if exists events_write on public.events;
create policy events_write on public.events for all to authenticated
  using ((select public.is_finance_admin()))
  with check ((select public.is_finance_admin()));
drop policy if exists rules_write on public.discount_rules;
create policy rules_write on public.discount_rules for all to authenticated
  using ((select public.is_finance_admin()))
  with check ((select public.is_finance_admin()));
drop policy if exists settings_write on public.app_settings;
create policy settings_write on public.app_settings for all to authenticated
  using ((select public.is_finance_admin()))
  with check ((select public.is_finance_admin()));
drop policy if exists err_write on public.event_registration_rules;
create policy err_write on public.event_registration_rules for all to authenticated
  using ((select public.is_finance_admin()))
  with check ((select public.is_finance_admin()));

-- One row per actual participant and event. Display names/dates come from the
-- current catalogue, not old order snapshots. No price or proof is returned.
create or replace function public.event_admin_registrations()
returns table (
  event_id text, event_name text, event_date date,
  order_reference text, order_status text,
  attendee_name text, attendee_email text, attendee_phone text,
  attendee_college text, attendee_year text,
  lunch_choice text, registered_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  return query
    select e.id, e.name, e.event_date,
           o.reference, o.status::text,
           coalesce(p.name, 'Attendee not recorded'), p.email, p.phone,
           p.college, p.year_of_study,
           ol.lunch_choice, o.created_at
    from public.order_lines ol
    join public.orders o on o.id = ol.order_id
    join public.events e on e.id = ol.event_id
    left join public.order_line_participants p on p.order_line_id = ol.id
    where o.status <> 'cancelled'
      and o.created_at >= timestamptz '2026-01-01 00:00:00+00'
      and o.created_at < timestamptz '2027-01-01 00:00:00+00'
      and e.id like 's4-%'
      and (e.event_date between date '2026-01-01' and date '2026-12-31' or e.event_date is null)
      and (ol.event_date between date '2026-01-01' and date '2026-12-31' or ol.event_date is null)
    order by e.name, o.created_at desc, p.team_index, p.position;
end;
$$;
revoke all on function public.event_admin_registrations() from public, anon;
grant execute on function public.event_admin_registrations() to authenticated;
