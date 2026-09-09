-- Delegate access is granted on application, not on approval.
--
-- Previously a delegate had to wait for an organiser before they could register
-- for any workshop. That made the pass a bottleneck: people buy a Delegate Pass
-- precisely so they can book events, and holding them in a queue costs
-- registrations.
--
-- The Delegate ID is now issued the moment they apply, event registration opens
-- immediately, and verification becomes a REVOCATION check rather than a gate.
--
-- NOTE: the full create_order() body is re-declared in this migration because
-- its delegate-pass check changed from "approved" to "active". See
-- 20260909000001 for the original and the reasoning behind server-side pricing.

alter table public.delegate_applications
  drop constraint if exists delegate_applications_status_check;
alter table public.delegate_applications
  add constraint delegate_applications_status_check
  check (status in ('pending', 'approved', 'rejected', 'revoked'));

-- A revoked pass frees the user to apply again.
drop index if exists public.delegate_applications_one_live;
create unique index delegate_applications_one_live
  on public.delegate_applications (user_id)
  where status in ('pending', 'approved');

create or replace function public.assign_delegate_id()
returns trigger language plpgsql as $$
begin
  if new.delegate_id is null then
    new.delegate_id := 'S4-' || lpad(nextval('public.delegate_id_seq')::text, 4, '0') || '-26';
  end if;
  return new;
end;
$$;

drop trigger if exists delegate_id_on_insert on public.delegate_applications;
create trigger delegate_id_on_insert
  before insert on public.delegate_applications
  for each row execute function public.assign_delegate_id();

create or replace function public.has_active_delegate_pass(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.delegate_applications
     where user_id = p_user_id and status in ('pending', 'approved')
  );
$$;

create or replace function public.revoke_delegate(p_application_id uuid, p_reason text)
returns public.delegate_applications
language plpgsql security definer set search_path = public as $$
declare v_app public.delegate_applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A reason is required to revoke a pass' using errcode = 'P0001';
  end if;
  update public.delegate_applications
     set status = 'revoked', reviewed_at = now(),
         reviewed_by = auth.uid(), rejection_reason = btrim(p_reason)
   where id = p_application_id
   returning * into v_app;
  if not found then
    raise exception 'Application not found' using errcode = 'P0001';
  end if;
  return v_app;
end;
$$;

revoke execute on function public.revoke_delegate(uuid, text) from public, anon;
grant  execute on function public.revoke_delegate(uuid, text) to authenticated;
revoke execute on function public.has_active_delegate_pass(uuid) from public, anon;
grant  execute on function public.has_active_delegate_pass(uuid) to authenticated;

-- Backfill identifiers for anyone who applied before the trigger existed.
update public.delegate_applications
   set delegate_id = 'S4-' || lpad(nextval('public.delegate_id_seq')::text, 4, '0') || '-26'
 where delegate_id is null and status in ('pending', 'approved');
