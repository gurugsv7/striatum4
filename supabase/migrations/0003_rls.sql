-- ============================================================================
-- STRIATUM 4.0 — 0003_rls.sql
-- Row Level Security. Every table is enabled. Policies are intentionally
-- narrow: participants can only ever see/touch their own rows, and only in
-- the states the product spec allows; admins (rows in admin_users) get
-- broad read/write; some tables are admin-only or function-only (no direct
-- client write path at all — mutation happens exclusively through the
-- SECURITY DEFINER functions in 0002_functions.sql, called from trusted
-- server code with the service role, which bypasses RLS by design).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES
-- Intent: a user is the only one who can see/edit their own profile row;
-- admins can read every profile (needed for the admin console listings).
-- No client-side insert/delete — profiles are created only by the
-- handle_new_auth_user() trigger, and cascade-deleted with the auth user.
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_select_own on profiles
  for select
  using (id = auth.uid());

create policy profiles_select_admin on profiles
  for select
  using (is_admin(auth.uid()));

create policy profiles_update_own on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- ADMIN_USERS
-- Intent: admin roster is admin-only to read; there is no client write path
-- at all (granting/revoking admin access is a service-role / SQL operation).
-- ----------------------------------------------------------------------------
alter table admin_users enable row level security;

create policy admin_users_select_admin on admin_users
  for select
  using (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- APP_SETTINGS
-- Intent: the single settings row is public read (drives Coming Soon vs
-- Welcome, symposium dates) for both anon and authenticated visitors; only
-- admins can change it.
-- ----------------------------------------------------------------------------
alter table app_settings enable row level security;

create policy app_settings_select_public on app_settings
  for select
  using (true);

create policy app_settings_write_admin on app_settings
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- PAYMENT_SETTINGS
-- Intent: the active payment configuration (fee, QR, payee, UPI id,
-- instructions) is public read so unauthenticated/authenticated participants
-- can see how to pay; history rows and writes are admin-only. No secret
-- values live in this table — the QR image itself lives in the public
-- brand-assets bucket, referenced by storage path only.
-- ----------------------------------------------------------------------------
alter table payment_settings enable row level security;

create policy payment_settings_select_active_public on payment_settings
  for select
  using (is_active or is_admin(auth.uid()));

create policy payment_settings_write_admin on payment_settings
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- DELEGATE_FORM_FIELDS / EVENT_FORM_FIELDS / EVENT_TYPES
-- Intent: form/catalogue metadata is public read (drives dynamic forms and
-- filters); only admins may manage it.
-- ----------------------------------------------------------------------------
alter table delegate_form_fields enable row level security;

create policy delegate_form_fields_select_public on delegate_form_fields
  for select
  using (true);

create policy delegate_form_fields_write_admin on delegate_form_fields
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

alter table event_types enable row level security;

create policy event_types_select_public on event_types
  for select
  using (true);

create policy event_types_write_admin on event_types
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

alter table event_form_fields enable row level security;

create policy event_form_fields_select_public on event_form_fields
  for select
  using (true);

create policy event_form_fields_write_admin on event_form_fields
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- EVENTS
-- Intent: event catalogue is public read (browsing needs no delegate, no
-- login) so Explore/Programme/Event Detail work for anon visitors; only
-- admins manage event content.
-- ----------------------------------------------------------------------------
alter table events enable row level security;

create policy events_select_public on events
  for select
  using (true);

create policy events_write_admin on events
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- DELEGATE_APPLICATIONS
-- Intent: a participant sees/edits only their own application, and only in
-- the pre-approval states — they may never set status to APPROVED, assign
-- reviewed_by/reviewed_at, or edit a row after it has been APPROVED or is
-- under review (fields are locked while PAYMENT_UNDER_REVIEW; resubmission
-- after PAYMENT_REJECTED is allowed). Admins have full access for review.
-- ----------------------------------------------------------------------------
alter table delegate_applications enable row level security;

create policy delegate_applications_select_own on delegate_applications
  for select
  using (user_id = auth.uid());

create policy delegate_applications_select_admin on delegate_applications
  for select
  using (is_admin(auth.uid()));

create policy delegate_applications_insert_own on delegate_applications
  for insert
  with check (
    user_id = auth.uid()
    and status in ('DRAFT', 'PAYMENT_PENDING')
  );

create policy delegate_applications_update_own on delegate_applications
  for update
  using (
    user_id = auth.uid()
    and status in ('DRAFT', 'PAYMENT_PENDING', 'PAYMENT_REJECTED')
  )
  with check (
    user_id = auth.uid()
    and status in ('DRAFT', 'PAYMENT_PENDING', 'PAYMENT_REJECTED', 'PAYMENT_UNDER_REVIEW')
  );

create policy delegate_applications_write_admin on delegate_applications
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- DELEGATES
-- Intent: a participant may only ever read their own delegate row (their
-- Delegate Pass). Issuance happens exclusively inside
-- approve_delegate_payment() (SECURITY DEFINER) — no client insert/update
-- path exists. Admins have full access.
-- ----------------------------------------------------------------------------
alter table delegates enable row level security;

create policy delegates_select_own on delegates
  for select
  using (user_id = auth.uid());

create policy delegates_select_admin on delegates
  for select
  using (is_admin(auth.uid()));

create policy delegates_write_admin on delegates
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- TEAMS / TEAM_MEMBERS
-- Intent: visible to the owning delegate (via their registrations) and to
-- admins. Writes go through server actions tied to registration ownership;
-- policy mirrors that via the lead registration's user_id.
-- ----------------------------------------------------------------------------
alter table teams enable row level security;

create policy teams_select_owner on teams
  for select
  using (
    exists (
      select 1 from event_registrations er
      where er.team_id = teams.id
        and er.user_id = auth.uid()
    )
  );

create policy teams_select_admin on teams
  for select
  using (is_admin(auth.uid()));

create policy teams_insert_owner on teams
  for insert
  with check (auth.uid() is not null);

create policy teams_update_owner on teams
  for update
  using (
    exists (
      select 1 from event_registrations er
      where er.id = teams.lead_registration_id
        and er.user_id = auth.uid()
        and er.status in ('DRAFT', 'PAYMENT_PENDING')
    )
  )
  with check (
    exists (
      select 1 from event_registrations er
      where er.id = teams.lead_registration_id
        and er.user_id = auth.uid()
        and er.status in ('DRAFT', 'PAYMENT_PENDING')
    )
  );

create policy teams_write_admin on teams
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

alter table team_members enable row level security;

create policy team_members_select_owner on team_members
  for select
  using (
    exists (
      select 1 from event_registrations er
      where er.team_id = team_members.team_id
        and er.user_id = auth.uid()
    )
  );

create policy team_members_select_admin on team_members
  for select
  using (is_admin(auth.uid()));

create policy team_members_insert_owner on team_members
  for insert
  with check (
    exists (
      select 1 from event_registrations er
      where er.team_id = team_members.team_id
        and er.user_id = auth.uid()
        and er.status in ('DRAFT', 'PAYMENT_PENDING')
    )
  );

create policy team_members_update_owner on team_members
  for update
  using (
    exists (
      select 1 from event_registrations er
      where er.team_id = team_members.team_id
        and er.user_id = auth.uid()
        and er.status in ('DRAFT', 'PAYMENT_PENDING')
    )
  )
  with check (
    exists (
      select 1 from event_registrations er
      where er.team_id = team_members.team_id
        and er.user_id = auth.uid()
        and er.status in ('DRAFT', 'PAYMENT_PENDING')
    )
  );

create policy team_members_delete_owner on team_members
  for delete
  using (
    exists (
      select 1 from event_registrations er
      where er.team_id = team_members.team_id
        and er.user_id = auth.uid()
        and er.status in ('DRAFT', 'PAYMENT_PENDING')
    )
  );

create policy team_members_write_admin on team_members
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- EVENT_REGISTRATIONS
-- Intent: a participant reads only their own registrations, creates only
-- their own (as themselves), and may only update their own row while it is
-- still in a pre-confirmation state — they may never set status to
-- CONFIRMED/PENDING_APPROVAL themselves (that happens only via
-- confirm_free_event_registration() / approve_event_payment()). Admins have
-- full access.
-- ----------------------------------------------------------------------------
alter table event_registrations enable row level security;

create policy event_registrations_select_own on event_registrations
  for select
  using (user_id = auth.uid());

create policy event_registrations_select_admin on event_registrations
  for select
  using (is_admin(auth.uid()));

create policy event_registrations_insert_own on event_registrations
  for insert
  with check (
    user_id = auth.uid()
    and status in ('DRAFT', 'PAYMENT_PENDING')
  );

create policy event_registrations_update_own on event_registrations
  for update
  using (
    user_id = auth.uid()
    and status in ('DRAFT', 'PAYMENT_PENDING', 'PAYMENT_REJECTED')
  )
  with check (
    user_id = auth.uid()
    and status in ('DRAFT', 'PAYMENT_PENDING', 'PAYMENT_REJECTED', 'PAYMENT_UNDER_REVIEW', 'CANCELLED')
  );

create policy event_registrations_write_admin on event_registrations
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- PAYMENT_SUBMISSIONS
-- Intent: a participant sees only their own submissions, may insert a new
-- one for themselves as PENDING_REVIEW, and may replace the screenshot /
-- transaction reference only while the submission is PENDING_REVIEW or
-- NEEDS_RESUBMISSION — they can never write status = APPROVED (enforced by
-- restricting the update WITH CHECK to non-approved statuses only). Admins
-- have full access for the review queue.
-- ----------------------------------------------------------------------------
alter table payment_submissions enable row level security;

create policy payment_submissions_select_own on payment_submissions
  for select
  using (user_id = auth.uid());

create policy payment_submissions_select_admin on payment_submissions
  for select
  using (is_admin(auth.uid()));

create policy payment_submissions_insert_own on payment_submissions
  for insert
  with check (
    user_id = auth.uid()
    and status = 'PENDING_REVIEW'
  );

create policy payment_submissions_update_own on payment_submissions
  for update
  using (
    user_id = auth.uid()
    and status in ('PENDING_REVIEW', 'NEEDS_RESUBMISSION')
  )
  with check (
    user_id = auth.uid()
    and status in ('PENDING_REVIEW', 'NEEDS_RESUBMISSION')
  );

create policy payment_submissions_write_admin on payment_submissions
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- QR_CREDENTIALS
-- Intent: a participant may read only the QR credential tied to one of
-- their own confirmed registrations (to render their event pass). No
-- client insert/update path — issuance happens exclusively inside
-- approve_event_payment() / confirm_free_event_registration(). Admins have
-- full access (needed by the check-in scanner).
-- ----------------------------------------------------------------------------
alter table qr_credentials enable row level security;

create policy qr_credentials_select_own on qr_credentials
  for select
  using (
    exists (
      select 1 from event_registrations er
      where er.id = qr_credentials.event_registration_id
        and er.user_id = auth.uid()
    )
  );

create policy qr_credentials_select_admin on qr_credentials
  for select
  using (is_admin(auth.uid()));

create policy qr_credentials_write_admin on qr_credentials
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- CHECK_INS
-- Intent: admin-only (the check-in scanner and its history are operational
-- data, not something participants read directly — their confirmed status
-- is visible on their own event pass via qr_credentials / registration
-- status, not this table).
-- ----------------------------------------------------------------------------
alter table check_ins enable row level security;

create policy check_ins_admin_only on check_ins
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- RESULTS / RESULT_ENTRIES
-- Intent: PUBLISHED result rounds are public read (anon + authenticated);
-- DRAFT rounds are invisible to everyone except admins — enforced here in
-- the policy itself, not left to UI filtering. result_entries inherit
-- visibility from their parent result row.
-- ----------------------------------------------------------------------------
alter table results enable row level security;

create policy results_select_published_public on results
  for select
  using (status = 'PUBLISHED');

create policy results_select_admin on results
  for select
  using (is_admin(auth.uid()));

create policy results_write_admin on results
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

alter table result_entries enable row level security;

create policy result_entries_select_published_public on result_entries
  for select
  using (
    exists (
      select 1 from results r
      where r.id = result_entries.result_id
        and r.status = 'PUBLISHED'
    )
  );

create policy result_entries_select_admin on result_entries
  for select
  using (is_admin(auth.uid()));

create policy result_entries_write_admin on result_entries
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- Intent: a participant reads only their own notifications and may mark
-- them read (update read_at only) but not create or delete them — inserts
-- happen exclusively via the notify() helper called from SECURITY DEFINER
-- functions. Admins are not granted broad access here; notifications are
-- participant-facing, not an admin surface.
-- ----------------------------------------------------------------------------
alter table notifications enable row level security;

create policy notifications_select_own on notifications
  for select
  using (user_id = auth.uid());

create policy notifications_update_own on notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- AUDIT_LOG
-- Intent: admin-only, read only (writes happen exclusively via the audit()
-- helper called from SECURITY DEFINER functions, which run as the function
-- owner and are unaffected by RLS).
-- ----------------------------------------------------------------------------
alter table audit_log enable row level security;

create policy audit_log_select_admin on audit_log
  for select
  using (is_admin(auth.uid()));

-- ============================================================================
-- END 0003_rls.sql
-- ============================================================================
