-- ============================================================================
-- STRIATUM 4.0 — 0001_init.sql
-- Core schema: extensions, enums, tables, triggers, indexes.
-- Idempotent-where-sensible: uses IF NOT EXISTS / CREATE OR REPLACE / guarded
-- DO blocks so this file can be re-run against a partially-applied database
-- during early development. In production, migrations should be applied once,
-- in order, via the Supabase CLI.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid(), crypto helpers
create extension if not exists citext;     -- case-insensitive email

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES — one per state machine, never a shared generic "status"
-- ----------------------------------------------------------------------------

do $$ begin
  create type admin_role as enum ('SUPER_ADMIN', 'ADMIN', 'REVIEWER', 'SCANNER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type field_type as enum ('TEXT', 'EMAIL', 'TEL', 'NUMBER', 'SELECT', 'TEXTAREA', 'DATE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delegate_application_status as enum (
    'DRAFT',
    'PAYMENT_PENDING',
    'PAYMENT_UNDER_REVIEW',
    'PAYMENT_REJECTED',
    'APPROVED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type delegate_status as enum ('ACTIVE', 'REVOKED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_format as enum ('INDIVIDUAL', 'TEAM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_registration_status as enum (
    'DRAFT',
    'PAYMENT_PENDING',
    'PAYMENT_UNDER_REVIEW',
    'PAYMENT_REJECTED',
    'PENDING_APPROVAL',
    'CONFIRMED',
    'CANCELLED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_type as enum ('DELEGATE', 'EVENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_submission_status as enum (
    'NOT_SUBMITTED',
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED',
    'NEEDS_RESUBMISSION'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type result_status as enum ('DRAFT', 'PUBLISHED');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. UPDATED_AT TRIGGER HELPER (shared by every table with updated_at)
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. PROFILES  (mirrors auth.users; one row per account)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext not null unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new Supabase auth user is created.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 4. ADMIN_USERS
-- ----------------------------------------------------------------------------
create table if not exists admin_users (
  user_id     uuid primary key references profiles(id) on delete cascade,
  role        admin_role not null default 'ADMIN',
  created_at  timestamptz not null default now(),
  created_by  uuid references profiles(id) on delete set null
);

create index if not exists idx_admin_users_role on admin_users(role);

-- ----------------------------------------------------------------------------
-- 5. APP_SETTINGS (single row, enforced by a fixed-id check)
-- ----------------------------------------------------------------------------
create table if not exists app_settings (
  id               boolean primary key default true,
  launched         boolean not null default false,
  launch_date      timestamptz,
  symposium_start  date,
  symposium_end    date,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references profiles(id) on delete set null,
  constraint app_settings_singleton check (id)
);

drop trigger if exists trg_app_settings_updated_at on app_settings;
create trigger trg_app_settings_updated_at
  before update on app_settings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. PAYMENT_SETTINGS (one active row + history; nothing invented, fee nullable)
-- ----------------------------------------------------------------------------
create table if not exists payment_settings (
  id                        uuid primary key default gen_random_uuid(),
  delegate_fee_inr          integer check (delegate_fee_inr is null or delegate_fee_inr >= 0),
  payee_name                text,
  upi_id                    text,
  qr_storage_path           text,
  instructions              text,
  require_transaction_ref   boolean not null default false,
  is_active                 boolean not null default false,
  updated_at                timestamptz not null default now(),
  updated_by                uuid references profiles(id) on delete set null
);

drop trigger if exists trg_payment_settings_updated_at on payment_settings;
create trigger trg_payment_settings_updated_at
  before update on payment_settings
  for each row execute function set_updated_at();

-- Only one active row at a time.
create unique index if not exists uidx_payment_settings_one_active
  on payment_settings (is_active)
  where is_active;

create index if not exists idx_payment_settings_active on payment_settings(is_active);

-- ----------------------------------------------------------------------------
-- 7. DELEGATE_FORM_FIELDS (data-driven extra fields for the delegate form)
-- ----------------------------------------------------------------------------
create table if not exists delegate_form_fields (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  label       text not null,
  help_text   text,
  field_type  field_type not null default 'TEXT',
  options     jsonb,
  required    boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

create index if not exists idx_delegate_form_fields_active_sort
  on delegate_form_fields(is_active, sort_order);

-- ----------------------------------------------------------------------------
-- 8. DELEGATE_APPLICATIONS
-- ----------------------------------------------------------------------------
create table if not exists delegate_applications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references profiles(id) on delete cascade,
  full_name          text not null,
  email              citext not null,
  mobile             text not null,
  college            text not null,
  year_of_study      text not null,
  student_id         text,
  extra              jsonb not null default '{}'::jsonb,
  status             delegate_application_status not null default 'DRAFT',
  submitted_at       timestamptz,
  reviewed_by        uuid references profiles(id) on delete set null,
  reviewed_at        timestamptz,
  admin_note         text,
  rejection_reason   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_delegate_applications_updated_at on delegate_applications;
create trigger trg_delegate_applications_updated_at
  before update on delegate_applications
  for each row execute function set_updated_at();

create index if not exists idx_delegate_applications_status on delegate_applications(status);
create index if not exists idx_delegate_applications_submitted_at on delegate_applications(submitted_at);
create index if not exists idx_delegate_applications_email on delegate_applications(email);
create index if not exists idx_delegate_applications_mobile on delegate_applications(mobile);

-- ----------------------------------------------------------------------------
-- 9. DELEGATE_ID_SEQUENCE — atomic issuance of human-readable delegate ids
-- ----------------------------------------------------------------------------
create sequence if not exists delegate_id_seq start 1 increment 1;

-- issue_delegate_id() defined in 0002_functions.sql (needs the sequence above
-- to already exist, which it now does).

-- ----------------------------------------------------------------------------
-- 10. DELEGATES
-- ----------------------------------------------------------------------------
create table if not exists delegates (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references profiles(id) on delete cascade,
  application_id       uuid not null unique references delegate_applications(id) on delete restrict,
  delegate_id          text not null unique,
  verification_token   text not null unique,
  status               delegate_status not null default 'ACTIVE',
  issued_at            timestamptz not null default now(),
  issued_by            uuid references profiles(id) on delete set null,
  constraint delegates_delegate_id_format check (delegate_id ~ '^S4-26-[0-9]{4,}$')
);

create index if not exists idx_delegates_status on delegates(status);
create index if not exists idx_delegates_delegate_id on delegates(delegate_id);
create index if not exists idx_delegates_verification_token on delegates(verification_token);

-- ----------------------------------------------------------------------------
-- 11. EVENT_TYPES (categories are data, not hardcoded)
-- ----------------------------------------------------------------------------
create table if not exists event_types (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  label       text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

create index if not exists idx_event_types_active_sort on event_types(is_active, sort_order);

-- ----------------------------------------------------------------------------
-- 12. EVENTS
-- ----------------------------------------------------------------------------
create table if not exists events (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null unique,
  name                      text not null,
  type_id                   uuid references event_types(id) on delete set null,
  summary                   text,
  description               text,
  event_date                date,
  start_time                time,
  end_time                  time,
  session                   text,                 -- 'Forenoon' | 'Afternoon' | 'Evening' (free text, admin-entered)
  venue                     text,
  format                    event_format not null default 'INDIVIDUAL',
  min_team_size             integer,
  max_team_size             integer,
  is_paid                   boolean not null default false,
  fee_inr                   integer check (fee_inr is null or fee_inr >= 0),
  capacity                  integer check (capacity is null or capacity >= 0),
  registration_open         boolean not null default false,
  requires_admin_approval   boolean not null default false,
  eligibility               text,
  rules                     text,
  about                     text,
  faqs                      jsonb,
  speakers                  jsonb,
  schedule                  jsonb,
  payment_qr_storage_path   text,
  payment_upi_id            text,
  payment_payee_name        text,
  is_featured               boolean not null default false,
  results_status            result_status not null default 'DRAFT',
  sort_order                integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint events_team_size_range check (
    min_team_size is null or max_team_size is null or min_team_size <= max_team_size
  )
  -- NOTE: no CHECK ties is_paid to fee_inr — an event can be marked is_paid = true
  -- with fee_inr still NULL ("fee not yet announced"); the UI renders that state
  -- rather than the DB inventing or forbidding it.
);

drop trigger if exists trg_events_updated_at on events;
create trigger trg_events_updated_at
  before update on events
  for each row execute function set_updated_at();

create index if not exists idx_events_type_id on events(type_id);
create index if not exists idx_events_event_date on events(event_date);
create index if not exists idx_events_registration_open on events(registration_open);
create index if not exists idx_events_is_featured on events(is_featured) where is_featured;
create index if not exists idx_events_results_status on events(results_status);
create index if not exists idx_events_sort_order on events(sort_order);

-- ----------------------------------------------------------------------------
-- 13. EVENT_FORM_FIELDS
-- ----------------------------------------------------------------------------
create table if not exists event_form_fields (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  key         text not null,
  label       text not null,
  help_text   text,
  field_type  field_type not null default 'TEXT',
  options     jsonb,
  required    boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  unique (event_id, key)
);

create index if not exists idx_event_form_fields_event_active_sort
  on event_form_fields(event_id, is_active, sort_order);

-- ----------------------------------------------------------------------------
-- 14. TEAMS / TEAM_MEMBERS
-- ----------------------------------------------------------------------------
create table if not exists teams (
  id                     uuid primary key default gen_random_uuid(),
  event_id               uuid not null references events(id) on delete cascade,
  name                   text,
  lead_registration_id   uuid  -- FK added after event_registrations exists (see below)
);

create index if not exists idx_teams_event_id on teams(event_id);

create table if not exists team_members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  full_name   text not null,
  email       citext,
  mobile      text,
  college     text,
  year        text,
  is_lead     boolean not null default false
);

create index if not exists idx_team_members_team_id on team_members(team_id);

-- ----------------------------------------------------------------------------
-- 15. EVENT_REGISTRATION_SEQUENCE — atomic registration code issuance
-- ----------------------------------------------------------------------------
create sequence if not exists event_registration_seq start 1 increment 1;

-- ----------------------------------------------------------------------------
-- 16. EVENT_REGISTRATIONS
-- ----------------------------------------------------------------------------
create table if not exists event_registrations (
  id                 uuid primary key default gen_random_uuid(),
  registration_code  text not null unique,
  event_id           uuid not null references events(id) on delete cascade,
  delegate_id        uuid not null references delegates(id) on delete cascade,
  user_id            uuid not null references profiles(id) on delete cascade,
  team_id            uuid references teams(id) on delete set null,
  status             event_registration_status not null default 'DRAFT',
  extra              jsonb not null default '{}'::jsonb,
  registered_at      timestamptz,
  confirmed_at       timestamptz,
  cancelled_at       timestamptz,
  reviewed_by        uuid references profiles(id) on delete set null,
  reviewed_at        timestamptz,
  admin_note         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint event_registrations_code_format check (registration_code ~ '^REG-26-[0-9]{6,}$')
);

drop trigger if exists trg_event_registrations_updated_at on event_registrations;
create trigger trg_event_registrations_updated_at
  before update on event_registrations
  for each row execute function set_updated_at();

-- Prevent duplicate active registrations for the same delegate + event.
create unique index if not exists uidx_event_registrations_event_delegate_active
  on event_registrations(event_id, delegate_id)
  where status <> 'CANCELLED';

create index if not exists idx_event_registrations_event_id on event_registrations(event_id);
create index if not exists idx_event_registrations_delegate_id on event_registrations(delegate_id);
create index if not exists idx_event_registrations_user_id on event_registrations(user_id);
create index if not exists idx_event_registrations_status on event_registrations(status);
create index if not exists idx_event_registrations_team_id on event_registrations(team_id);
create index if not exists idx_event_registrations_registered_at on event_registrations(registered_at);

-- Now that event_registrations exists, wire teams.lead_registration_id.
do $$ begin
  alter table teams
    add constraint teams_lead_registration_id_fkey
    foreign key (lead_registration_id) references event_registrations(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists idx_teams_lead_registration_id on teams(lead_registration_id);

-- ----------------------------------------------------------------------------
-- 17. PAYMENT_SUBMISSIONS
-- ----------------------------------------------------------------------------
create table if not exists payment_submissions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references profiles(id) on delete cascade,
  payment_type                payment_type not null,
  delegate_application_id     uuid references delegate_applications(id) on delete cascade,
  event_registration_id       uuid references event_registrations(id) on delete cascade,
  expected_amount_inr         integer check (expected_amount_inr is null or expected_amount_inr >= 0),
  screenshot_storage_path     text not null,
  transaction_reference       text,
  status                      payment_submission_status not null default 'PENDING_REVIEW',
  submitted_at                timestamptz not null default now(),
  reviewed_by                 uuid references profiles(id) on delete set null,
  reviewed_at                 timestamptz,
  admin_note                  text,
  rejection_reason            text,
  superseded_by               uuid references payment_submissions(id) on delete set null,
  created_at                  timestamptz not null default now(),
  constraint payment_submissions_exactly_one_target check (
    (payment_type = 'DELEGATE' and delegate_application_id is not null and event_registration_id is null)
    or
    (payment_type = 'EVENT' and event_registration_id is not null and delegate_application_id is null)
  )
);

create index if not exists idx_payment_submissions_status_submitted_at
  on payment_submissions(status, submitted_at);
create index if not exists idx_payment_submissions_user_id on payment_submissions(user_id);
create index if not exists idx_payment_submissions_delegate_application_id
  on payment_submissions(delegate_application_id);
create index if not exists idx_payment_submissions_event_registration_id
  on payment_submissions(event_registration_id);
create index if not exists idx_payment_submissions_payment_type on payment_submissions(payment_type);

-- ----------------------------------------------------------------------------
-- 18. QR_CREDENTIALS — exactly one per confirmed event registration
-- ----------------------------------------------------------------------------
create table if not exists qr_credentials (
  id                       uuid primary key default gen_random_uuid(),
  event_registration_id    uuid not null unique references event_registrations(id) on delete cascade,
  event_id                 uuid not null references events(id) on delete cascade,
  delegate_id              uuid not null references delegates(id) on delete cascade,
  token                    text not null unique,
  token_hash               text,
  generated_at             timestamptz not null default now(),
  is_active                boolean not null default true
);

create index if not exists idx_qr_credentials_event_id on qr_credentials(event_id);
create index if not exists idx_qr_credentials_delegate_id on qr_credentials(delegate_id);
create index if not exists idx_qr_credentials_token on qr_credentials(token);
create index if not exists idx_qr_credentials_is_active on qr_credentials(is_active);

-- ----------------------------------------------------------------------------
-- 19. CHECK_INS
-- ----------------------------------------------------------------------------
create table if not exists check_ins (
  id                       uuid primary key default gen_random_uuid(),
  qr_credential_id         uuid not null unique references qr_credentials(id) on delete cascade,
  event_registration_id    uuid not null references event_registrations(id) on delete cascade,
  event_id                 uuid not null references events(id) on delete cascade,
  delegate_id              uuid not null references delegates(id) on delete cascade,
  checked_in_at            timestamptz not null default now(),
  checked_in_by            uuid references admin_users(user_id) on delete set null,
  device_note              text
);

create index if not exists idx_check_ins_event_id on check_ins(event_id);
create index if not exists idx_check_ins_delegate_id on check_ins(delegate_id);
create index if not exists idx_check_ins_checked_in_at on check_ins(checked_in_at);

-- ----------------------------------------------------------------------------
-- 20. RESULTS / RESULT_ENTRIES
-- ----------------------------------------------------------------------------
create table if not exists results (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  status         result_status not null default 'DRAFT',
  published_at   timestamptz,
  published_by   uuid references profiles(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now()
);

-- One published result set live per event at a time (multiple DRAFT rounds allowed
-- for editing/history, but only one may hold PUBLISHED for a given event).
create unique index if not exists uidx_results_event_published
  on results(event_id)
  where status = 'PUBLISHED';

create index if not exists idx_results_event_id on results(event_id);
create index if not exists idx_results_status on results(status);

create table if not exists result_entries (
  id                       uuid primary key default gen_random_uuid(),
  result_id                uuid not null references results(id) on delete cascade,
  position                 integer,
  label                    text,
  event_registration_id    uuid references event_registrations(id) on delete set null,
  team_id                  uuid references teams(id) on delete set null,
  participant_name         text,
  delegate_id_text         text,
  institution              text,
  score                    text,
  sort_order               integer not null default 0
);

create index if not exists idx_result_entries_result_id on result_entries(result_id);
create index if not exists idx_result_entries_event_registration_id
  on result_entries(event_registration_id);
create index if not exists idx_result_entries_sort_order on result_entries(result_id, sort_order);

-- ----------------------------------------------------------------------------
-- 21. NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_id_created_at
  on notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_id_unread
  on notifications(user_id) where read_at is null;

-- ----------------------------------------------------------------------------
-- 22. AUDIT_LOG
-- ----------------------------------------------------------------------------
create table if not exists audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references profiles(id) on delete set null,
  action         text not null,
  entity         text not null,
  entity_id      uuid,
  payload        jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists idx_audit_log_entity_entity_id on audit_log(entity, entity_id);
create index if not exists idx_audit_log_actor_user_id on audit_log(actor_user_id);
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

-- ============================================================================
-- END 0001_init.sql
-- ============================================================================
