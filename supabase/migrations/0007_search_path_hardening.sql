-- ============================================================================
-- STRIATUM 4.0 — 0007_search_path_hardening.sql
--
-- Addresses three residual Supabase Security Advisor WARN-level findings on
-- top of 0006_function_hardening.sql (which closed the privilege-escalation
-- hole; verified working, see 0006's header). This migration is additive and
-- safe to apply to an already-migrated live database: every statement is
-- idempotent (ALTER FUNCTION ... SET, CREATE OR REPLACE FUNCTION, REVOKE),
-- and no function signature, return type, argument order, locking, status
-- guard, idempotent short-circuit, or 0006 identity guard is changed.
--
-- 1) Mutable search_path (function_search_path_mutable)
--    -----------------------------------------------------------------------
--    Every SECURITY DEFINER / SQL function defined across 0002_functions.sql,
--    0005_free_event_approval.sql and 0006_function_hardening.sql was
--    checked. All of them except two already carry `set search_path =
--    public` (a pinned path — not what the advisor flags). The two without
--    any pinned search_path, both defined in files this migration does not
--    otherwise touch, are:
--
--      - set_updated_at()   (0001_init.sql)  — trigger helper, body only
--        touches NEW and calls now(). now() is a pg_catalog builtin, and
--        pg_catalog is always implicitly searched first regardless of
--        search_path, so search_path = '' is safe here: no unqualified
--        non-pg_catalog reference exists in the body.
--
--      - random_token(integer)  (0002_functions.sql) — body calls
--        gen_random_bytes() (from the pgcrypto extension, installed
--        unqualified into the public schema by 0001_init.sql) plus
--        encode()/translate() (pg_catalog builtins), all unqualified. The
--        body does NOT schema-qualify gen_random_bytes, so search_path = ''
--        would break it (gen_random_bytes would no longer resolve). Per the
--        task's own guidance, this gets an explicit pinned path instead:
--        `pg_catalog, public` — pg_catalog first (builtins), public second
--        (finds gen_random_bytes), with no other schema on the path for an
--        attacker to shadow anything in.
--
--    Both fixes below use ALTER FUNCTION ... SET search_path, not CREATE OR
--    REPLACE — this only changes the function's pinned search_path config
--    and cannot alter its body, signature, volatility, or grants.
--
-- 2) handle_new_auth_user() executable by anon/authenticated
--    -----------------------------------------------------------------------
--    Verified against the definition in 0001_init.sql: it is installed ONLY
--    as an AFTER INSERT trigger on auth.users
--    (`create trigger trg_on_auth_user_created ... execute function
--    handle_new_auth_user()`) and is not called via RPC anywhere in this
--    codebase (grepped lib/**, supabase/** — the only other reference is
--    descriptive, in supabase/README.md). Postgres does not check EXECUTE
--    privilege on a trigger function against the session role that caused
--    the trigger to fire — the trigger manager invokes it internally, under
--    the function's own SECURITY DEFINER context, independent of table- or
--    function-level grants held by the inserting role. Revoking EXECUTE from
--    public/anon/authenticated therefore cannot break the
--    auth.users -> profiles trigger; it only closes the unnecessary direct
--    RPC surface (POST /rest/v1/rpc/handle_new_auth_user), which serves no
--    purpose since the function assumes it is running inside a row-level
--    auth.users trigger (reads NEW).
--
-- 3) confirm_free_event_registration() ownership gap
--    -----------------------------------------------------------------------
--    p_registration_id was trusted without checking it actually belongs to
--    p_actor. Reachability is already fully contained (0006 revoked EXECUTE
--    from anon/authenticated; lib/actions/events.ts calls this only via the
--    service-role client with p_actor sourced from the server-verified
--    requireDelegate() session — see registerForEvent() in
--    lib/actions/events.ts), but it is a real logic gap worth closing
--    defensively. event_registrations.user_id (0001_init.sql) is the row's
--    owning profile id, and requireDelegate()'s userId (lib/auth/guards.ts)
--    — the same value threaded through to p_actor at the events.ts call
--    site — is also a profiles.id. So the correct comparison is
--    `v_registration.user_id is distinct from p_actor`. The check is
--    inserted immediately after the row is locked and the not-found guard
--    (before the idempotency short-circuit), so a mismatched actor is
--    rejected regardless of the registration's current status — nothing
--    else about the function changes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (1a) set_updated_at() — pin to the empty search_path.
-- ----------------------------------------------------------------------------
alter function set_updated_at() set search_path = '';

-- ----------------------------------------------------------------------------
-- (1b) random_token(integer) — pin to an explicit, minimal path.
-- ----------------------------------------------------------------------------
alter function random_token(integer) set search_path = pg_catalog, public;

-- ----------------------------------------------------------------------------
-- (2) handle_new_auth_user() — revoke unnecessary direct-RPC reachability.
-- The auth.users AFTER INSERT trigger continues to fire unaffected: trigger
-- invocation does not check EXECUTE privilege against the triggering role.
-- ----------------------------------------------------------------------------
revoke execute on function handle_new_auth_user() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- (3) confirm_free_event_registration(p_registration_id, p_actor) —
-- add the ownership check. Body otherwise reproduced VERBATIM from
-- 0006_function_hardening.sql: same signature, same locking, same capacity
-- guard, same PENDING_APPROVAL/CONFIRMED branch, same idempotent
-- short-circuit, same auth.uid() identity guard from 0006.
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

  -- Ownership check (new in 0007): the registration must belong to the
  -- actor performing the confirmation. Checked immediately after the lock
  -- and not-found guard, before the idempotency short-circuit, so a
  -- mismatched actor is rejected regardless of the registration's status.
  if v_registration.user_id is distinct from p_actor then
    raise exception 'registration % does not belong to actor %', p_registration_id, p_actor
      using errcode = '42501';
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

-- Re-assert this function's grants (CREATE OR REPLACE preserves the existing
-- ACL when the OID is unchanged, so this is belt-and-braces, not a behaviour
-- change): still reachable only via service_role, per 0006.
revoke execute on function confirm_free_event_registration(uuid, uuid) from public, anon, authenticated;
grant execute on function confirm_free_event_registration(uuid, uuid) to service_role;

-- ============================================================================
-- REMAINING ADVISORIES AFTER THIS MIGRATION (expected, accepted)
-- ============================================================================
-- - citext extension installed in the public schema (extension_in_public).
--   profiles.email is typed `citext`; relocating the extension risks
--   breaking that column type on a live, already-migrated database for a
--   cosmetic advisory. Consciously not addressed here.
-- - is_admin(uuid), is_admin_role(uuid, admin_role[]), issue_registration_code()
--   remain executable by anon/authenticated by design: is_admin() is called
--   as the querying role inside every RLS policy (0003_rls.sql/0004_storage.sql)
--   and revoking it would break RLS project-wide; is_admin_role() is the same
--   non-mutating shape, left consistent with is_admin(); issue_registration_code()
--   is called directly by the participant's own authenticated session client
--   in lib/actions/events.ts (registerForEvent(), line ~92) and only advances
--   a sequence with no admin check to bypass. These will keep showing as
--   "SECURITY DEFINER function executable by anon/authenticated" — that is
--   intentional, documented in 0006_function_hardening.sql and here.
-- - random_token(integer) is now pinned to `pg_catalog, public` rather than
--   an empty search_path (see rationale above) — Advisor should clear the
--   mutable-search-path warning for it, but note the choice in case a future
--   reviewer expects search_path = '' uniformly across every function.
-- ============================================================================

-- ============================================================================
-- END 0007_search_path_hardening.sql
-- ============================================================================
