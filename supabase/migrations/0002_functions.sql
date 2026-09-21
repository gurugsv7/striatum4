-- ============================================================================
-- STRIATUM 4.0 — 0002_functions.sql
-- SECURITY DEFINER functions that make critical state transitions atomic,
-- idempotent, and safe under concurrency. All privileged mutation happens
-- through these functions (called from server actions using the service
-- role, or via RPC from a trusted server context) — never directly from
-- client-side row writes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- helper: random_token(n) — crypto-random base64url string from n random bytes
-- ----------------------------------------------------------------------------
create or replace function random_token(n integer default 32)
returns text
language sql
volatile
as $$
  select translate(
    encode(gen_random_bytes(n), 'base64'),
    '+/=',
    '-_'
  );
$$;

-- ----------------------------------------------------------------------------
-- is_admin(uid) / is_admin_role(uid, roles[])
-- ----------------------------------------------------------------------------
create or replace function is_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users au where au.user_id = p_uid);
$$;

create or replace function is_admin_role(p_uid uuid, p_roles admin_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users au
    where au.user_id = p_uid
      and au.role = any(p_roles)
  );
$$;

-- ----------------------------------------------------------------------------
-- issue_delegate_id() — atomically allocates 'S4-26-%04d'
-- ----------------------------------------------------------------------------
create or replace function issue_delegate_id()
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select 'S4-26-' || lpad(nextval('delegate_id_seq')::text, 4, '0');
$$;

-- ----------------------------------------------------------------------------
-- issue_registration_code() — atomically allocates 'REG-26-%06d'
-- ----------------------------------------------------------------------------
create or replace function issue_registration_code()
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select 'REG-26-' || lpad(nextval('event_registration_seq')::text, 6, '0');
$$;

-- ----------------------------------------------------------------------------
-- notify(user_id, kind, title, body, link) — small insert helper
-- ----------------------------------------------------------------------------
create or replace function notify(
  p_user_id uuid,
  p_kind    text,
  p_title   text,
  p_body    text default null,
  p_link    text default null
)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into notifications (user_id, kind, title, body, link)
  values (p_user_id, p_kind, p_title, p_body, p_link);
$$;

-- ----------------------------------------------------------------------------
-- audit(actor, action, entity, entity_id, payload) — small insert helper
-- ----------------------------------------------------------------------------
create or replace function audit(
  p_actor      uuid,
  p_action     text,
  p_entity     text,
  p_entity_id  uuid,
  p_payload    jsonb default null
)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into audit_log (actor_user_id, action, entity, entity_id, payload)
  values (p_actor, p_action, p_entity, p_entity_id, p_payload);
$$;

-- ----------------------------------------------------------------------------
-- approve_delegate_payment(p_submission_id, p_admin, p_note)
--
-- Idempotent: if the submission is already APPROVED, returns the existing
-- delegate row without issuing a second delegate id. Row-locks the
-- submission (and application) for the duration of the transaction; the
-- unique constraints on delegates(user_id) / delegates(application_id) are
-- the real backstop against a double-issue race.
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
--
-- Idempotent: if already APPROVED, returns without issuing a second QR.
-- Confirms the registration and issues exactly one qr_credentials row.
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
-- Honours requires_admin_approval (PENDING_APPROVAL vs CONFIRMED) and
-- capacity. Issues the QR only on CONFIRMED. Capacity is checked with the
-- event row locked (FOR UPDATE) and a count of non-cancelled registrations,
-- so concurrent confirmations cannot oversell capacity.
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
--
-- Returns a single-row typed result. First valid redemption inserts
-- check_ins; a repeat scan returns ALREADY_CHECKED_IN with the original
-- timestamp rather than raising, so the scanner UI can render it cleanly.
-- ----------------------------------------------------------------------------
do $$ begin
  create type qr_redeem_result as (
    outcome           text,   -- 'VALID' | 'ALREADY_CHECKED_IN' | 'WRONG_EVENT' | 'INVALID'
    participant_name  text,
    delegate_id_text  text,
    event_name        text,
    college           text,
    checked_in_at     timestamptz
  );
exception when duplicate_object then null; end $$;

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

-- ============================================================================
-- END 0002_functions.sql
-- ============================================================================
