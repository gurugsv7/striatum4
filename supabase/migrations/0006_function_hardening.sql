-- ============================================================================
-- STRIATUM 4.0 — 0006_function_hardening.sql
--
-- Fixes a privilege-escalation vulnerability flagged by Supabase's Security
-- Advisor: every SECURITY DEFINER function in 0002_functions.sql and
-- 0005_free_event_approval.sql that performs a privileged mutation accepts a
-- caller-supplied `p_admin` (or `p_actor`) uuid and checks THAT VALUE against
-- admin_users — it never binds the argument to auth.uid(). Combined with the
-- default `EXECUTE ... TO PUBLIC` grant Postgres applies to every new
-- function (which anon and authenticated inherit via PostgREST), anyone who
-- learns or guesses a real admin's user id can call these functions directly
-- through the public RPC endpoint (e.g. POST /rest/v1/rpc/approve_delegate_payment)
-- and approve their own payment — no administrator involved.
--
-- This migration is additive and safe to run against an already-migrated
-- live database: it does not touch 0002/0005 in place (their function
-- signatures, bodies, locking, status guards and idempotency behaviour are
-- reproduced here VERBATIM, with exactly one guard block inserted per
-- function), and every statement is idempotent — CREATE OR REPLACE FUNCTION
-- and REVOKE/GRANT can all be re-run safely.
--
-- Defence in depth, two independent layers:
--
--   Layer 1 — REVOKE reachability. Every privileged function has its
--   PUBLIC/anon/authenticated EXECUTE grant revoked and EXECUTE re-granted
--   only to service_role, so it is no longer reachable at all through the
--   anon/authenticated PostgREST roles, regardless of what argument values
--   are supplied.
--
--   Layer 2 — bind the identity when a real caller exists. Each function
--   gains:
--
--     if auth.uid() is not null and p_admin is distinct from auth.uid() then
--       raise exception 'admin identity mismatch' using errcode = '42501';
--     end if;
--
--   The application invokes every one of these functions from
--   lib/actions/admin.ts using the SERVICE-ROLE client (lib/supabase/admin.ts)
--   — under service_role, auth.uid() is NULL, so this guard is a no-op on
--   the app's own call path and every existing admin action keeps working
--   unchanged. It exists purely as a second line of defence: even if Layer 1's
--   grant were ever accidentally restored (a future migration, a manual
--   `grant execute on all functions in schema public to authenticated`,
--   etc.), an authenticated session still could not act as a *different*
--   admin, because the function itself now refuses any p_admin/p_actor value
--   that doesn't match the caller's own auth.uid().
--
-- is_admin(p_admin) is kept as the pre-existing authorization check in every
-- function that had it — this migration ADDS the identity-binding guard, it
-- does not replace that check.
-- ============================================================================

-- ============================================================================
-- LAYER 2 — CREATE OR REPLACE each privileged function, body copied verbatim
-- from 0002_functions.sql / 0005_free_event_approval.sql with exactly one
-- guard block inserted at the top of the function body. No signature,
-- locking, status-guard, or idempotency-check change.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- approve_delegate_payment(p_submission_id, p_admin, p_note)
-- ----------------------------------------------------------------------------
create or replace function approve_delegate_payment(
  p_submission_id uuid,
  p_admin uuid,
  p_note text default null
)
returns delegates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission   payment_submissions;
  v_application  delegate_applications;
  v_delegate     delegates;
  v_new_id       text;
  v_new_token    text;
begin
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_submission
  from payment_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'payment submission % not found', p_submission_id;
  end if;

  if v_submission.payment_type <> 'DELEGATE' then
    raise exception 'submission % is not a delegate payment', p_submission_id;
  end if;

  -- Idempotency: already approved -> return existing delegate, do nothing else.
  if v_submission.status = 'APPROVED' then
    select * into v_delegate
    from delegates
    where application_id = v_submission.delegate_application_id;

    if found then
      return v_delegate;
    end if;
    -- Fall through: status says approved but delegate row is somehow missing.
    -- Treat as an anomaly and re-issue below rather than silently failing.
  end if;

  if v_submission.status not in ('PENDING_REVIEW', 'NEEDS_RESUBMISSION') then
    raise exception 'submission % is not pending review (status=%)',
      p_submission_id, v_submission.status;
  end if;

  select * into v_application
  from delegate_applications
  where id = v_submission.delegate_application_id
  for update;

  if not found then
    raise exception 'delegate application % not found', v_submission.delegate_application_id;
  end if;

  -- Mark submission approved.
  update payment_submissions
  set status = 'APPROVED',
      reviewed_by = p_admin,
      reviewed_at = now(),
      admin_note = coalesce(p_note, admin_note)
  where id = v_submission.id;

  -- Mark application approved.
  update delegate_applications
  set status = 'APPROVED',
      reviewed_by = p_admin,
      reviewed_at = now(),
      admin_note = coalesce(p_note, admin_note)
  where id = v_application.id;

  -- Issue the delegate row (unique constraints guard against duplicates).
  select * into v_delegate
  from delegates
  where application_id = v_application.id;

  if not found then
    v_new_id := issue_delegate_id();
    v_new_token := random_token(32);

    insert into delegates (user_id, application_id, delegate_id, verification_token, issued_by)
    values (v_application.user_id, v_application.id, v_new_id, v_new_token, p_admin)
    returning * into v_delegate;
  end if;

  perform notify(
    v_application.user_id,
    'DELEGATE_APPROVED',
    'Delegate ID issued',
    'Your Delegate ID ' || v_delegate.delegate_id || ' is now active.',
    '/delegate/pass'
  );

  perform audit(p_admin, 'APPROVE_DELEGATE_PAYMENT', 'payment_submissions', v_submission.id,
    jsonb_build_object('delegate_id', v_delegate.delegate_id, 'application_id', v_application.id));

  return v_delegate;
end;
$$;

-- ----------------------------------------------------------------------------
-- reject_delegate_payment(p_submission_id, p_admin, p_reason, p_note, p_allow_resubmit)
-- ----------------------------------------------------------------------------
create or replace function reject_delegate_payment(
  p_submission_id uuid,
  p_admin uuid,
  p_reason text,
  p_note text default null,
  p_allow_resubmit boolean default true
)
returns payment_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission  payment_submissions;
  v_application delegate_applications;
  v_new_status  payment_submission_status;
begin
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_submission
  from payment_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'payment submission % not found', p_submission_id;
  end if;

  if v_submission.payment_type <> 'DELEGATE' then
    raise exception 'submission % is not a delegate payment', p_submission_id;
  end if;

  if v_submission.status = 'APPROVED' then
    raise exception 'submission % is already approved and cannot be rejected', p_submission_id;
  end if;

  if v_submission.status in ('REJECTED', 'NEEDS_RESUBMISSION') then
    -- Already in a terminal-ish rejected state; treat as idempotent no-op on re-call.
    return v_submission;
  end if;

  v_new_status := case when p_allow_resubmit then 'NEEDS_RESUBMISSION' else 'REJECTED' end;

  update payment_submissions
  set status = v_new_status,
      reviewed_by = p_admin,
      reviewed_at = now(),
      rejection_reason = p_reason,
      admin_note = coalesce(p_note, admin_note)
  where id = v_submission.id
  returning * into v_submission;

  select * into v_application
  from delegate_applications
  where id = v_submission.delegate_application_id
  for update;

  update delegate_applications
  set status = 'PAYMENT_REJECTED',
      reviewed_by = p_admin,
      reviewed_at = now(),
      rejection_reason = p_reason,
      admin_note = coalesce(p_note, admin_note)
  where id = v_application.id;

  perform notify(
    v_application.user_id,
    'DELEGATE_PAYMENT_REJECTED',
    'Delegate payment needs attention',
    p_reason,
    '/delegate/payment'
  );

  perform audit(p_admin, 'REJECT_DELEGATE_PAYMENT', 'payment_submissions', v_submission.id,
    jsonb_build_object('reason', p_reason, 'allow_resubmit', p_allow_resubmit));

  return v_submission;
end;
$$;

-- ----------------------------------------------------------------------------
-- approve_event_payment(p_submission_id, p_admin, p_note)
-- ----------------------------------------------------------------------------
create or replace function approve_event_payment(
  p_submission_id uuid,
  p_admin uuid,
  p_note text default null
)
returns event_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission    payment_submissions;
  v_registration  event_registrations;
  v_qr            qr_credentials;
begin
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_submission
  from payment_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'payment submission % not found', p_submission_id;
  end if;

  if v_submission.payment_type <> 'EVENT' then
    raise exception 'submission % is not an event payment', p_submission_id;
  end if;

  select * into v_registration
  from event_registrations
  where id = v_submission.event_registration_id
  for update;

  if not found then
    raise exception 'event registration % not found', v_submission.event_registration_id;
  end if;

  -- Idempotency: already approved -> return current registration, do nothing else.
  if v_submission.status = 'APPROVED' then
    return v_registration;
  end if;

  if v_submission.status not in ('PENDING_REVIEW', 'NEEDS_RESUBMISSION') then
    raise exception 'submission % is not pending review (status=%)',
      p_submission_id, v_submission.status;
  end if;

  update payment_submissions
  set status = 'APPROVED',
      reviewed_by = p_admin,
      reviewed_at = now(),
      admin_note = coalesce(p_note, admin_note)
  where id = v_submission.id;

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
    'EVENT_PAYMENT_APPROVED',
    'Event registration confirmed',
    'Your payment was verified and your event pass is ready.',
    '/my-events/' || v_registration.id
  );

  perform audit(p_admin, 'APPROVE_EVENT_PAYMENT', 'payment_submissions', v_submission.id,
    jsonb_build_object('event_registration_id', v_registration.id, 'qr_credential_id', v_qr.id));

  return v_registration;
end;
$$;

-- ----------------------------------------------------------------------------
-- reject_event_payment(p_submission_id, p_admin, p_reason, p_note, p_allow_resubmit)
-- ----------------------------------------------------------------------------
create or replace function reject_event_payment(
  p_submission_id uuid,
  p_admin uuid,
  p_reason text,
  p_note text default null,
  p_allow_resubmit boolean default true
)
returns payment_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission    payment_submissions;
  v_registration  event_registrations;
  v_new_status    payment_submission_status;
begin
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_submission
  from payment_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'payment submission % not found', p_submission_id;
  end if;

  if v_submission.payment_type <> 'EVENT' then
    raise exception 'submission % is not an event payment', p_submission_id;
  end if;

  if v_submission.status = 'APPROVED' then
    raise exception 'submission % is already approved and cannot be rejected', p_submission_id;
  end if;

  if v_submission.status in ('REJECTED', 'NEEDS_RESUBMISSION') then
    return v_submission;
  end if;

  v_new_status := case when p_allow_resubmit then 'NEEDS_RESUBMISSION' else 'REJECTED' end;

  update payment_submissions
  set status = v_new_status,
      reviewed_by = p_admin,
      reviewed_at = now(),
      rejection_reason = p_reason,
      admin_note = coalesce(p_note, admin_note)
  where id = v_submission.id
  returning * into v_submission;

  select * into v_registration
  from event_registrations
  where id = v_submission.event_registration_id
  for update;

  update event_registrations
  set status = 'PAYMENT_REJECTED',
      reviewed_by = p_admin,
      reviewed_at = now(),
      admin_note = coalesce(p_note, admin_note)
  where id = v_registration.id;

  perform notify(
    v_registration.user_id,
    'EVENT_PAYMENT_REJECTED',
    'Event payment needs attention',
    p_reason,
    '/my-events/' || v_registration.id
  );

  perform audit(p_admin, 'REJECT_EVENT_PAYMENT', 'payment_submissions', v_submission.id,
    jsonb_build_object('reason', p_reason, 'allow_resubmit', p_allow_resubmit));

  return v_submission;
end;
$$;

-- ----------------------------------------------------------------------------
-- confirm_free_event_registration(p_registration_id, p_actor)
--
-- Not admin-gated (participants confirm their own free registration) — but
-- p_actor is trusted the same way p_admin is elsewhere in this file and is
-- attributed on the audit_log row and on delegates.issued_by-equivalent
-- fields, so the same identity-binding guard applies, using p_actor instead
-- of p_admin. Layer 1 (see below) is the primary fix for this function:
-- once EXECUTE is revoked from anon/authenticated, it is reachable only via
-- the service-role call in lib/actions/events.ts, which already sets
-- p_actor from the server-verified requireDelegate() session, never from
-- client input.
-- ----------------------------------------------------------------------------
create or replace function confirm_free_event_registration(
  p_registration_id uuid,
  p_actor uuid
)
returns event_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration  event_registrations;
  v_event         events;
  v_confirmed_count integer;
  v_qr            qr_credentials;
  v_target_status event_registration_status;
begin
  if auth.uid() is not null and p_actor is distinct from auth.uid() then
    raise exception 'actor identity mismatch' using errcode = '42501';
  end if;

  select * into v_registration
  from event_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'event registration % not found', p_registration_id;
  end if;

  -- Idempotency: already in a settled state, return as-is.
  if v_registration.status in ('CONFIRMED', 'PENDING_APPROVAL', 'CANCELLED') then
    return v_registration;
  end if;

  -- Lock the event row so concurrent confirmations serialize on capacity.
  select * into v_event
  from events
  where id = v_registration.event_id
  for update;

  if not found then
    raise exception 'event % not found', v_registration.event_id;
  end if;

  if v_event.is_paid then
    raise exception 'event % is paid; use the payment flow instead', v_event.id;
  end if;

  if v_event.capacity is not null then
    select count(*) into v_confirmed_count
    from event_registrations
    where event_id = v_event.id
      and status in ('CONFIRMED', 'PENDING_APPROVAL')
      and id <> v_registration.id;

    if v_confirmed_count >= v_event.capacity then
      raise exception 'event % is at capacity', v_event.name using errcode = 'P0001';
    end if;
  end if;

  v_target_status := case
    when v_event.requires_admin_approval then 'PENDING_APPROVAL'
    else 'CONFIRMED'
  end;

  update event_registrations
  set status = v_target_status,
      registered_at = coalesce(registered_at, now()),
      confirmed_at = case when v_target_status = 'CONFIRMED' then now() else confirmed_at end
  where id = v_registration.id
  returning * into v_registration;

  if v_target_status = 'CONFIRMED' then
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
      'You are confirmed for ' || v_event.name || '.',
      '/my-events/' || v_registration.id
    );
  else
    perform notify(
      v_registration.user_id,
      'EVENT_REGISTRATION_PENDING_APPROVAL',
      'Registration pending approval',
      'Your registration for ' || v_event.name || ' is awaiting organizer approval.',
      '/my-events/' || v_registration.id
    );
  end if;

  perform audit(p_actor, 'CONFIRM_FREE_EVENT_REGISTRATION', 'event_registrations', v_registration.id,
    jsonb_build_object('event_id', v_event.id, 'result_status', v_target_status));

  return v_registration;
end;
$$;

-- ----------------------------------------------------------------------------
-- redeem_event_qr(p_token, p_event_id, p_admin)
-- ----------------------------------------------------------------------------
create or replace function redeem_event_qr(
  p_token text,
  p_event_id uuid,
  p_admin uuid
)
returns qr_redeem_result
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr        qr_credentials;
  v_reg       event_registrations;
  v_event     events;
  v_delegate  delegates;
  v_app       delegate_applications;
  v_checkin   check_ins;
  v_result    qr_redeem_result;
begin
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_qr
  from qr_credentials
  where token = p_token
    and is_active
  for update;

  if not found then
    v_result.outcome := 'INVALID';
    return v_result;
  end if;

  if v_qr.event_id <> p_event_id then
    v_result.outcome := 'WRONG_EVENT';
    return v_result;
  end if;

  select * into v_reg from event_registrations where id = v_qr.event_registration_id;
  select * into v_event from events where id = v_qr.event_id;
  select * into v_delegate from delegates where id = v_qr.delegate_id;
  select * into v_app from delegate_applications where id = v_delegate.application_id;

  select * into v_checkin
  from check_ins
  where qr_credential_id = v_qr.id;

  if found then
    v_result.outcome := 'ALREADY_CHECKED_IN';
    v_result.participant_name := v_app.full_name;
    v_result.delegate_id_text := v_delegate.delegate_id;
    v_result.event_name := v_event.name;
    v_result.college := v_app.college;
    v_result.checked_in_at := v_checkin.checked_in_at;
    return v_result;
  end if;

  insert into check_ins (qr_credential_id, event_registration_id, event_id, delegate_id, checked_in_by)
  values (v_qr.id, v_reg.id, v_event.id, v_delegate.id, p_admin)
  returning * into v_checkin;

  perform audit(p_admin, 'CHECK_IN', 'event_registrations', v_reg.id,
    jsonb_build_object('event_id', v_event.id, 'delegate_id', v_delegate.delegate_id));

  v_result.outcome := 'VALID';
  v_result.participant_name := v_app.full_name;
  v_result.delegate_id_text := v_delegate.delegate_id;
  v_result.event_name := v_event.name;
  v_result.college := v_app.college;
  v_result.checked_in_at := v_checkin.checked_in_at;
  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- publish_results(p_result_id, p_admin) / unpublish_results(p_result_id, p_admin)
-- ----------------------------------------------------------------------------
create or replace function publish_results(
  p_result_id uuid,
  p_admin uuid
)
returns results
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result  results;
begin
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_result from results where id = p_result_id for update;
  if not found then
    raise exception 'result % not found', p_result_id;
  end if;

  if v_result.status = 'PUBLISHED' then
    return v_result;
  end if;

  -- Unpublish any other published round for the same event first, so the
  -- partial unique index (one PUBLISHED row per event) never conflicts.
  update results
  set status = 'DRAFT'
  where event_id = v_result.event_id
    and status = 'PUBLISHED'
    and id <> v_result.id;

  update results
  set status = 'PUBLISHED',
      published_at = now(),
      published_by = p_admin
  where id = v_result.id
  returning * into v_result;

  update events set results_status = 'PUBLISHED' where id = v_result.event_id;

  perform audit(p_admin, 'PUBLISH_RESULTS', 'results', v_result.id,
    jsonb_build_object('event_id', v_result.event_id));

  return v_result;
end;
$$;

create or replace function unpublish_results(
  p_result_id uuid,
  p_admin uuid
)
returns results
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result  results;
begin
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

  if not is_admin(p_admin) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_result from results where id = p_result_id for update;
  if not found then
    raise exception 'result % not found', p_result_id;
  end if;

  if v_result.status = 'DRAFT' then
    return v_result;
  end if;

  update results
  set status = 'DRAFT'
  where id = v_result.id
  returning * into v_result;

  update events set results_status = 'DRAFT' where id = v_result.event_id;

  perform audit(p_admin, 'UNPUBLISH_RESULTS', 'results', v_result.id,
    jsonb_build_object('event_id', v_result.event_id));

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- approve_free_event_registration(p_registration_id, p_admin, p_note)
-- (0005_free_event_approval.sql)
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
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

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
-- (0005_free_event_approval.sql)
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
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;

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
-- LAYER 1 — revoke reachability.
--
-- Every function below either performs a privileged mutation gated on
-- is_admin(p_admin) (or, for confirm_free_event_registration, trusts
-- p_actor for attribution) or is an internal helper that inserts into a
-- table participants must never write directly (notify() spoofs
-- notifications to an arbitrary user_id; audit() spoofs an arbitrary actor
-- into audit_log; issue_delegate_id() allocates a real Delegate ID off a
-- shared sequence). None of these are called via a direct client-side RPC
-- in the application — every caller in lib/actions/** either reaches them
-- through the service-role client, or (for issue_delegate_id/notify/audit)
-- only from inside another SECURITY DEFINER function, which continues to
-- work after this revoke because the function owner always retains EXECUTE
-- on functions it owns, independent of PUBLIC/anon/authenticated grants.
--
-- Deliberately NOT revoked (documented, not an oversight):
--   - is_admin(uuid), is_admin_role(uuid, admin_role[]): pure, non-mutating
--     read helpers. is_admin(auth.uid()) is called directly inside every
--     RLS policy in 0003_rls.sql/0004_storage.sql and is evaluated as the
--     querying role (anon/authenticated) at policy-check time, not as the
--     function owner — revoking its EXECUTE grant would break every RLS
--     policy in the project. is_admin_role is the same non-mutating shape
--     (and not currently wired into any RLS policy) and is left untouched
--     for consistency with is_admin and because it discloses nothing an
--     authenticated/anon caller couldn't already infer from is_admin.
--   - issue_registration_code(): called directly by the participant's own
--     authenticated session client in lib/actions/events.ts
--     (`supabase.rpc('issue_registration_code')`, the RLS-bound server
--     client, not the service-role client) — revoking it would break event
--     registration for every real user. It only advances a sequence
--     (event_registration_seq) and carries no admin check to bypass; the
--     worst a hostile caller could do by calling it directly is burn
--     sequence values, which is not a security boundary.
--   - random_token(n): pure computation (crypto-random bytes -> text), no
--     table access, no privileged data in or out. Harmless if called
--     directly and not required by any RLS policy, so left at its default
--     grants to keep this migration's diff minimal.
-- ============================================================================

revoke execute on function approve_delegate_payment(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function reject_delegate_payment(uuid, uuid, text, text, boolean) from public, anon, authenticated;
revoke execute on function approve_event_payment(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function reject_event_payment(uuid, uuid, text, text, boolean) from public, anon, authenticated;
revoke execute on function confirm_free_event_registration(uuid, uuid) from public, anon, authenticated;
revoke execute on function approve_free_event_registration(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function reject_free_event_registration(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function redeem_event_qr(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function publish_results(uuid, uuid) from public, anon, authenticated;
revoke execute on function unpublish_results(uuid, uuid) from public, anon, authenticated;
revoke execute on function issue_delegate_id() from public, anon, authenticated;
revoke execute on function notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function audit(uuid, text, text, uuid, jsonb) from public, anon, authenticated;

grant execute on function approve_delegate_payment(uuid, uuid, text) to service_role;
grant execute on function reject_delegate_payment(uuid, uuid, text, text, boolean) to service_role;
grant execute on function approve_event_payment(uuid, uuid, text) to service_role;
grant execute on function reject_event_payment(uuid, uuid, text, text, boolean) to service_role;
grant execute on function confirm_free_event_registration(uuid, uuid) to service_role;
grant execute on function approve_free_event_registration(uuid, uuid, text) to service_role;
grant execute on function reject_free_event_registration(uuid, uuid, text, text) to service_role;
grant execute on function redeem_event_qr(text, uuid, uuid) to service_role;
grant execute on function publish_results(uuid, uuid) to service_role;
grant execute on function unpublish_results(uuid, uuid) to service_role;
grant execute on function issue_delegate_id() to service_role;
grant execute on function notify(uuid, text, text, text, text) to service_role;
grant execute on function audit(uuid, text, text, uuid, jsonb) to service_role;

-- ============================================================================
-- END 0006_function_hardening.sql
-- ============================================================================
