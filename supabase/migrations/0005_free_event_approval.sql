-- ============================================================================
-- STRIATUM 4.0 — 0005_free_event_approval.sql
--
-- confirm_free_event_registration() (0002_functions.sql) lands a free
-- registration on PENDING_APPROVAL when events.requires_admin_approval is
-- true, but never had a matching function to move it the rest of the way to
-- CONFIRMED. This migration adds that admin transition, following exactly
-- the same idempotent, row-locked pattern as approve_event_payment() /
-- reject_event_payment() in 0002_functions.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- approve_free_event_registration(p_registration_id, p_admin, p_note)
--
-- Idempotent: if the registration is already CONFIRMED, returns it unchanged
-- (must never issue a second QR). Only valid from PENDING_APPROVAL. Confirms
-- the registration and issues exactly one qr_credentials row — same shape
-- and same guarantees as approve_event_payment().
-- ----------------------------------------------------------------------------
create or replace function approve_free_event_registration(
  p_registration_id uuid,
  p_admin uuid,
  p_note text default null
)
returns event_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration  event_registrations;
  v_event         events;
  v_qr            qr_credentials;
begin
  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_registration
  from event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'event registration % not found', p_registration_id;
  end if;

  -- Idempotency: already confirmed -> return as-is, never issue a second QR.
  if v_registration.status = 'CONFIRMED' then
    return v_registration;
  end if;

  if v_registration.status <> 'PENDING_APPROVAL' then
    raise exception 'registration % is not pending approval (status=%)',
      p_registration_id, v_registration.status;
  end if;

  select * into v_event from events where id = v_registration.event_id;

  if not found then
    raise exception 'event % not found', v_registration.event_id;
  end if;

  update event_registrations
  set status = 'CONFIRMED',
      confirmed_at = now(),
      reviewed_by = p_admin,
      reviewed_at = now(),
      admin_note = coalesce(p_note, admin_note)
  where id = v_registration.id
  returning * into v_registration;

  -- Issue exactly one QR credential per confirmed registration.
  select * into v_qr
  from qr_credentials
  where event_registration_id = v_registration.id;

  if not found then
    insert into qr_credentials (event_registration_id, event_id, delegate_id, token)
    values (v_registration.id, v_registration.event_id, v_registration.delegate_id, random_token(32))
    returning * into v_qr;
  end if;

  perform notify(
    v_registration.user_id,
    'EVENT_REGISTRATION_CONFIRMED',
    'Registration confirmed',
    'Your registration for ' || v_event.name || ' has been approved and confirmed.',
    '/my-events/' || v_registration.id
  );

  perform audit(p_admin, 'APPROVE_FREE_EVENT_REGISTRATION', 'event_registrations', v_registration.id,
    jsonb_build_object('event_id', v_registration.event_id, 'qr_credential_id', v_qr.id));

  return v_registration;
end;
$$;

-- ----------------------------------------------------------------------------
-- reject_free_event_registration(p_registration_id, p_admin, p_reason, p_note)
--
-- Mirrors reject_event_payment()'s idempotent pattern: a registration that
-- is already CANCELLED is returned unchanged (no-op); only valid from
-- PENDING_APPROVAL. There is no resubmission path for a free-event approval
-- rejection (unlike a payment, there is nothing to resubmit) — the
-- registration is cancelled outright so the participant can register again
-- from a clean state if they choose to.
-- ----------------------------------------------------------------------------
create or replace function reject_free_event_registration(
  p_registration_id uuid,
  p_admin uuid,
  p_reason text,
  p_note text default null
)
returns event_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration  event_registrations;
  v_event         events;
begin
  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_registration
  from event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'event registration % not found', p_registration_id;
  end if;

  if v_registration.status = 'CONFIRMED' then
    raise exception 'registration % is already confirmed and cannot be rejected', p_registration_id;
  end if;

  -- Idempotency: already cancelled -> return as-is.
  if v_registration.status = 'CANCELLED' then
    return v_registration;
  end if;

  if v_registration.status <> 'PENDING_APPROVAL' then
    raise exception 'registration % is not pending approval (status=%)',
      p_registration_id, v_registration.status;
  end if;

  select * into v_event from events where id = v_registration.event_id;

  update event_registrations
  set status = 'CANCELLED',
      cancelled_at = now(),
      reviewed_by = p_admin,
      reviewed_at = now(),
      admin_note = coalesce(p_reason, admin_note)
  where id = v_registration.id
  returning * into v_registration;

  perform notify(
    v_registration.user_id,
    'EVENT_REGISTRATION_REJECTED',
    'Registration not approved',
    coalesce(p_reason, 'Your registration for ' || coalesce(v_event.name, 'this event') || ' was not approved.'),
    '/my-events'
  );

  perform audit(p_admin, 'REJECT_FREE_EVENT_REGISTRATION', 'event_registrations', v_registration.id,
    jsonb_build_object('event_id', v_registration.event_id, 'reason', p_reason, 'note', p_note));

  return v_registration;
end;
$$;

-- ============================================================================
-- END 0005_free_event_approval.sql
-- ============================================================================
