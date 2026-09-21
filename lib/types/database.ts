/**
 * STRIATUM 4.0 — hand-written database types.
 *
 * Mirrors supabase/migrations/0001_init.sql through 0004_storage.sql exactly.
 * Shaped like the output of `supabase gen types typescript` so
 * `createClient<Database>()` works as a drop-in. This file is hand-written
 * (per the orchestrator's file-ownership split) — keep it in sync with the
 * SQL by hand whenever a migration changes a table.
 *
 * Enum string-union types live in ./enums.ts and are re-exported here under
 * Database['public']['Enums'] for Supabase-client compatibility.
 */

import type {
  AdminRole,
  DelegateApplicationStatus,
  DelegateStatus,
  EventFormat,
  EventRegistrationStatus,
  FieldType,
  PaymentSubmissionStatus,
  PaymentType,
  ResultStatus,
} from './enums';

// ---------------------------------------------------------------------------
// Shared scalar aliases
// ---------------------------------------------------------------------------
export type UUID = string;
export type ISODateTime = string; // timestamptz, ISO 8601
export type ISODate = string; // date, 'YYYY-MM-DD'
export type ISOTime = string; // time, 'HH:MM:SS'
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------
export type ProfileRow = {
  id: UUID;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}
export type ProfileInsert = {
  id: UUID;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}
export type ProfileUpdate = {
  id?: UUID;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

// ---------------------------------------------------------------------------
// admin_users
// ---------------------------------------------------------------------------
export type AdminUserRow = {
  user_id: UUID;
  role: AdminRole;
  created_at: ISODateTime;
  created_by: UUID | null;
}
export type AdminUserInsert = {
  user_id: UUID;
  role?: AdminRole;
  created_at?: ISODateTime;
  created_by?: UUID | null;
}
export type AdminUserUpdate = {
  user_id?: UUID;
  role?: AdminRole;
  created_at?: ISODateTime;
  created_by?: UUID | null;
}

// ---------------------------------------------------------------------------
// app_settings (singleton, id is always `true`)
// ---------------------------------------------------------------------------
export type AppSettingsRow = {
  id: true;
  launched: boolean;
  launch_date: ISODateTime | null;
  symposium_start: ISODate | null;
  symposium_end: ISODate | null;
  updated_at: ISODateTime;
  updated_by: UUID | null;
}
export type AppSettingsInsert = {
  id?: true;
  launched?: boolean;
  launch_date?: ISODateTime | null;
  symposium_start?: ISODate | null;
  symposium_end?: ISODate | null;
  updated_at?: ISODateTime;
  updated_by?: UUID | null;
}
export type AppSettingsUpdate = {
  launched?: boolean;
  launch_date?: ISODateTime | null;
  symposium_start?: ISODate | null;
  symposium_end?: ISODate | null;
  updated_at?: ISODateTime;
  updated_by?: UUID | null;
}

// ---------------------------------------------------------------------------
// payment_settings
// ---------------------------------------------------------------------------
export type PaymentSettingsRow = {
  id: UUID;
  delegate_fee_inr: number | null;
  payee_name: string | null;
  upi_id: string | null;
  qr_storage_path: string | null;
  instructions: string | null;
  require_transaction_ref: boolean;
  is_active: boolean;
  updated_at: ISODateTime;
  updated_by: UUID | null;
}
export type PaymentSettingsInsert = {
  id?: UUID;
  delegate_fee_inr?: number | null;
  payee_name?: string | null;
  upi_id?: string | null;
  qr_storage_path?: string | null;
  instructions?: string | null;
  require_transaction_ref?: boolean;
  is_active?: boolean;
  updated_at?: ISODateTime;
  updated_by?: UUID | null;
}
export type PaymentSettingsUpdate = {
  delegate_fee_inr?: number | null;
  payee_name?: string | null;
  upi_id?: string | null;
  qr_storage_path?: string | null;
  instructions?: string | null;
  require_transaction_ref?: boolean;
  is_active?: boolean;
  updated_at?: ISODateTime;
  updated_by?: UUID | null;
}

// ---------------------------------------------------------------------------
// delegate_form_fields / event_form_fields (shared shape)
// ---------------------------------------------------------------------------
export type DelegateFormFieldRow = {
  id: UUID;
  key: string;
  label: string;
  help_text: string | null;
  field_type: FieldType;
  options: Json | null;
  required: boolean;
  sort_order: number;
  is_active: boolean;
}
export type DelegateFormFieldInsert = {
  id?: UUID;
  key: string;
  label: string;
  help_text?: string | null;
  field_type?: FieldType;
  options?: Json | null;
  required?: boolean;
  sort_order?: number;
  is_active?: boolean;
}
export type DelegateFormFieldUpdate = {
  key?: string;
  label?: string;
  help_text?: string | null;
  field_type?: FieldType;
  options?: Json | null;
  required?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

export type EventFormFieldRow = {
  id: UUID;
  event_id: UUID;
  key: string;
  label: string;
  help_text: string | null;
  field_type: FieldType;
  options: Json | null;
  required: boolean;
  sort_order: number;
  is_active: boolean;
}
export type EventFormFieldInsert = {
  id?: UUID;
  event_id: UUID;
  key: string;
  label: string;
  help_text?: string | null;
  field_type?: FieldType;
  options?: Json | null;
  required?: boolean;
  sort_order?: number;
  is_active?: boolean;
}
export type EventFormFieldUpdate = {
  event_id?: UUID;
  key?: string;
  label?: string;
  help_text?: string | null;
  field_type?: FieldType;
  options?: Json | null;
  required?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// delegate_applications
// ---------------------------------------------------------------------------
export type DelegateApplicationRow = {
  id: UUID;
  user_id: UUID;
  full_name: string;
  email: string;
  mobile: string;
  college: string;
  year_of_study: string;
  student_id: string | null;
  extra: Json;
  status: DelegateApplicationStatus;
  submitted_at: ISODateTime | null;
  reviewed_by: UUID | null;
  reviewed_at: ISODateTime | null;
  admin_note: string | null;
  rejection_reason: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}
export type DelegateApplicationInsert = {
  id?: UUID;
  user_id: UUID;
  full_name: string;
  email: string;
  mobile: string;
  college: string;
  year_of_study: string;
  student_id?: string | null;
  extra?: Json;
  status?: DelegateApplicationStatus;
  submitted_at?: ISODateTime | null;
  reviewed_by?: UUID | null;
  reviewed_at?: ISODateTime | null;
  admin_note?: string | null;
  rejection_reason?: string | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}
export type DelegateApplicationUpdate = {
  full_name?: string;
  email?: string;
  mobile?: string;
  college?: string;
  year_of_study?: string;
  student_id?: string | null;
  extra?: Json;
  status?: DelegateApplicationStatus;
  submitted_at?: ISODateTime | null;
  reviewed_by?: UUID | null;
  reviewed_at?: ISODateTime | null;
  admin_note?: string | null;
  rejection_reason?: string | null;
  updated_at?: ISODateTime;
}

// ---------------------------------------------------------------------------
// delegates
// ---------------------------------------------------------------------------
export type DelegateRow = {
  id: UUID;
  user_id: UUID;
  application_id: UUID;
  delegate_id: string; // 'S4-26-0184'
  verification_token: string;
  status: DelegateStatus;
  issued_at: ISODateTime;
  issued_by: UUID | null;
}
export type DelegateInsert = {
  id?: UUID;
  user_id: UUID;
  application_id: UUID;
  delegate_id: string;
  verification_token: string;
  status?: DelegateStatus;
  issued_at?: ISODateTime;
  issued_by?: UUID | null;
}
export type DelegateUpdate = {
  status?: DelegateStatus;
  issued_by?: UUID | null;
}

// ---------------------------------------------------------------------------
// event_types
// ---------------------------------------------------------------------------
export type EventTypeRow = {
  id: UUID;
  key: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}
export type EventTypeInsert = {
  id?: UUID;
  key: string;
  label: string;
  sort_order?: number;
  is_active?: boolean;
}
export type EventTypeUpdate = {
  key?: string;
  label?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------
export type EventRow = {
  id: UUID;
  slug: string;
  name: string;
  type_id: UUID | null;
  summary: string | null;
  description: string | null;
  event_date: ISODate | null;
  start_time: ISOTime | null;
  end_time: ISOTime | null;
  session: string | null;
  venue: string | null;
  format: EventFormat;
  min_team_size: number | null;
  max_team_size: number | null;
  is_paid: boolean;
  fee_inr: number | null;
  capacity: number | null;
  registration_open: boolean;
  requires_admin_approval: boolean;
  eligibility: string | null;
  rules: string | null;
  about: string | null;
  faqs: Json | null;
  speakers: Json | null;
  schedule: Json | null;
  payment_qr_storage_path: string | null;
  payment_upi_id: string | null;
  payment_payee_name: string | null;
  is_featured: boolean;
  results_status: ResultStatus;
  sort_order: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}
export type EventInsert = {
  id?: UUID;
  slug: string;
  name: string;
  type_id?: UUID | null;
  summary?: string | null;
  description?: string | null;
  event_date?: ISODate | null;
  start_time?: ISOTime | null;
  end_time?: ISOTime | null;
  session?: string | null;
  venue?: string | null;
  format?: EventFormat;
  min_team_size?: number | null;
  max_team_size?: number | null;
  is_paid?: boolean;
  fee_inr?: number | null;
  capacity?: number | null;
  registration_open?: boolean;
  requires_admin_approval?: boolean;
  eligibility?: string | null;
  rules?: string | null;
  about?: string | null;
  faqs?: Json | null;
  speakers?: Json | null;
  schedule?: Json | null;
  payment_qr_storage_path?: string | null;
  payment_upi_id?: string | null;
  payment_payee_name?: string | null;
  is_featured?: boolean;
  results_status?: ResultStatus;
  sort_order?: number;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}
export type EventUpdate = {
  slug?: string;
  name?: string;
  type_id?: UUID | null;
  summary?: string | null;
  description?: string | null;
  event_date?: ISODate | null;
  start_time?: ISOTime | null;
  end_time?: ISOTime | null;
  session?: string | null;
  venue?: string | null;
  format?: EventFormat;
  min_team_size?: number | null;
  max_team_size?: number | null;
  is_paid?: boolean;
  fee_inr?: number | null;
  capacity?: number | null;
  registration_open?: boolean;
  requires_admin_approval?: boolean;
  eligibility?: string | null;
  rules?: string | null;
  about?: string | null;
  faqs?: Json | null;
  speakers?: Json | null;
  schedule?: Json | null;
  payment_qr_storage_path?: string | null;
  payment_upi_id?: string | null;
  payment_payee_name?: string | null;
  is_featured?: boolean;
  results_status?: ResultStatus;
  sort_order?: number;
  updated_at?: ISODateTime;
}

// ---------------------------------------------------------------------------
// teams / team_members
// ---------------------------------------------------------------------------
export type TeamRow = {
  id: UUID;
  event_id: UUID;
  name: string | null;
  lead_registration_id: UUID | null;
}
export type TeamInsert = {
  id?: UUID;
  event_id: UUID;
  name?: string | null;
  lead_registration_id?: UUID | null;
}
export type TeamUpdate = {
  name?: string | null;
  lead_registration_id?: UUID | null;
}

export type TeamMemberRow = {
  id: UUID;
  team_id: UUID;
  full_name: string;
  email: string | null;
  mobile: string | null;
  college: string | null;
  year: string | null;
  is_lead: boolean;
}
export type TeamMemberInsert = {
  id?: UUID;
  team_id: UUID;
  full_name: string;
  email?: string | null;
  mobile?: string | null;
  college?: string | null;
  year?: string | null;
  is_lead?: boolean;
}
export type TeamMemberUpdate = {
  full_name?: string;
  email?: string | null;
  mobile?: string | null;
  college?: string | null;
  year?: string | null;
  is_lead?: boolean;
}

// ---------------------------------------------------------------------------
// event_registrations
// ---------------------------------------------------------------------------
export type EventRegistrationRow = {
  id: UUID;
  registration_code: string; // 'REG-26-000123'
  event_id: UUID;
  delegate_id: UUID;
  user_id: UUID;
  team_id: UUID | null;
  status: EventRegistrationStatus;
  extra: Json;
  registered_at: ISODateTime | null;
  confirmed_at: ISODateTime | null;
  cancelled_at: ISODateTime | null;
  reviewed_by: UUID | null;
  reviewed_at: ISODateTime | null;
  admin_note: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}
export type EventRegistrationInsert = {
  id?: UUID;
  registration_code: string;
  event_id: UUID;
  delegate_id: UUID;
  user_id: UUID;
  team_id?: UUID | null;
  status?: EventRegistrationStatus;
  extra?: Json;
  registered_at?: ISODateTime | null;
  confirmed_at?: ISODateTime | null;
  cancelled_at?: ISODateTime | null;
  reviewed_by?: UUID | null;
  reviewed_at?: ISODateTime | null;
  admin_note?: string | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}
export type EventRegistrationUpdate = {
  team_id?: UUID | null;
  status?: EventRegistrationStatus;
  extra?: Json;
  registered_at?: ISODateTime | null;
  confirmed_at?: ISODateTime | null;
  cancelled_at?: ISODateTime | null;
  reviewed_by?: UUID | null;
  reviewed_at?: ISODateTime | null;
  admin_note?: string | null;
  updated_at?: ISODateTime;
}

// ---------------------------------------------------------------------------
// payment_submissions
// ---------------------------------------------------------------------------
export type PaymentSubmissionRow = {
  id: UUID;
  user_id: UUID;
  payment_type: PaymentType;
  delegate_application_id: UUID | null;
  event_registration_id: UUID | null;
  expected_amount_inr: number | null;
  screenshot_storage_path: string;
  transaction_reference: string | null;
  status: PaymentSubmissionStatus;
  submitted_at: ISODateTime;
  reviewed_by: UUID | null;
  reviewed_at: ISODateTime | null;
  admin_note: string | null;
  rejection_reason: string | null;
  superseded_by: UUID | null;
  created_at: ISODateTime;
}
export type PaymentSubmissionInsert = {
  id?: UUID;
  user_id: UUID;
  payment_type: PaymentType;
  delegate_application_id?: UUID | null;
  event_registration_id?: UUID | null;
  expected_amount_inr?: number | null;
  screenshot_storage_path: string;
  transaction_reference?: string | null;
  status?: PaymentSubmissionStatus;
  submitted_at?: ISODateTime;
  reviewed_by?: UUID | null;
  reviewed_at?: ISODateTime | null;
  admin_note?: string | null;
  rejection_reason?: string | null;
  superseded_by?: UUID | null;
  created_at?: ISODateTime;
}
export type PaymentSubmissionUpdate = {
  expected_amount_inr?: number | null;
  screenshot_storage_path?: string;
  transaction_reference?: string | null;
  status?: PaymentSubmissionStatus;
  reviewed_by?: UUID | null;
  reviewed_at?: ISODateTime | null;
  admin_note?: string | null;
  rejection_reason?: string | null;
  superseded_by?: UUID | null;
}

// ---------------------------------------------------------------------------
// qr_credentials
// ---------------------------------------------------------------------------
export type QrCredentialRow = {
  id: UUID;
  event_registration_id: UUID;
  event_id: UUID;
  delegate_id: UUID;
  token: string;
  token_hash: string | null;
  generated_at: ISODateTime;
  is_active: boolean;
}
export type QrCredentialInsert = {
  id?: UUID;
  event_registration_id: UUID;
  event_id: UUID;
  delegate_id: UUID;
  token: string;
  token_hash?: string | null;
  generated_at?: ISODateTime;
  is_active?: boolean;
}
export type QrCredentialUpdate = {
  token_hash?: string | null;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// check_ins
// ---------------------------------------------------------------------------
export type CheckInRow = {
  id: UUID;
  qr_credential_id: UUID;
  event_registration_id: UUID;
  event_id: UUID;
  delegate_id: UUID;
  checked_in_at: ISODateTime;
  checked_in_by: UUID | null;
  device_note: string | null;
}
export type CheckInInsert = {
  id?: UUID;
  qr_credential_id: UUID;
  event_registration_id: UUID;
  event_id: UUID;
  delegate_id: UUID;
  checked_in_at?: ISODateTime;
  checked_in_by?: UUID | null;
  device_note?: string | null;
}
export type CheckInUpdate = {
  device_note?: string | null;
}

// ---------------------------------------------------------------------------
// results / result_entries
// ---------------------------------------------------------------------------
export type ResultRow = {
  id: UUID;
  event_id: UUID;
  status: ResultStatus;
  published_at: ISODateTime | null;
  published_by: UUID | null;
  notes: string | null;
  created_at: ISODateTime;
}
export type ResultInsert = {
  id?: UUID;
  event_id: UUID;
  status?: ResultStatus;
  published_at?: ISODateTime | null;
  published_by?: UUID | null;
  notes?: string | null;
  created_at?: ISODateTime;
}
export type ResultUpdate = {
  status?: ResultStatus;
  published_at?: ISODateTime | null;
  published_by?: UUID | null;
  notes?: string | null;
}

export type ResultEntryRow = {
  id: UUID;
  result_id: UUID;
  position: number | null;
  label: string | null;
  event_registration_id: UUID | null;
  team_id: UUID | null;
  participant_name: string | null;
  delegate_id_text: string | null;
  institution: string | null;
  score: string | null;
  sort_order: number;
}
export type ResultEntryInsert = {
  id?: UUID;
  result_id: UUID;
  position?: number | null;
  label?: string | null;
  event_registration_id?: UUID | null;
  team_id?: UUID | null;
  participant_name?: string | null;
  delegate_id_text?: string | null;
  institution?: string | null;
  score?: string | null;
  sort_order?: number;
}
export type ResultEntryUpdate = {
  position?: number | null;
  label?: string | null;
  event_registration_id?: UUID | null;
  team_id?: UUID | null;
  participant_name?: string | null;
  delegate_id_text?: string | null;
  institution?: string | null;
  score?: string | null;
  sort_order?: number;
}

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export type NotificationRow = {
  id: UUID;
  user_id: UUID;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: ISODateTime | null;
  created_at: ISODateTime;
}
export type NotificationInsert = {
  id?: UUID;
  user_id: UUID;
  kind: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read_at?: ISODateTime | null;
  created_at?: ISODateTime;
}
export type NotificationUpdate = {
  read_at?: ISODateTime | null;
}

// ---------------------------------------------------------------------------
// audit_log
// ---------------------------------------------------------------------------
export type AuditLogRow = {
  id: UUID;
  actor_user_id: UUID | null;
  action: string;
  entity: string;
  entity_id: UUID | null;
  payload: Json | null;
  created_at: ISODateTime;
}
export type AuditLogInsert = {
  id?: UUID;
  actor_user_id?: UUID | null;
  action: string;
  entity: string;
  entity_id?: UUID | null;
  payload?: Json | null;
  created_at?: ISODateTime;
}
export type AuditLogUpdate = Record<string, never>; // audit_log rows are append-only

// ---------------------------------------------------------------------------
// redeem_event_qr() RPC result shape (mirrors qr_redeem_result composite type)
// ---------------------------------------------------------------------------
export type QrRedeemResult = {
  outcome: 'VALID' | 'ALREADY_CHECKED_IN' | 'WRONG_EVENT' | 'INVALID';
  participant_name: string | null;
  delegate_id_text: string | null;
  event_name: string | null;
  college: string | null;
  checked_in_at: ISODateTime | null;
}

// ---------------------------------------------------------------------------
// Database — Supabase-client-shaped root type
// ---------------------------------------------------------------------------
type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, ProfileInsert, ProfileUpdate>;
      admin_users: TableDef<AdminUserRow, AdminUserInsert, AdminUserUpdate>;
      app_settings: TableDef<AppSettingsRow, AppSettingsInsert, AppSettingsUpdate>;
      payment_settings: TableDef<PaymentSettingsRow, PaymentSettingsInsert, PaymentSettingsUpdate>;
      delegate_form_fields: TableDef<
        DelegateFormFieldRow,
        DelegateFormFieldInsert,
        DelegateFormFieldUpdate
      >;
      event_form_fields: TableDef<EventFormFieldRow, EventFormFieldInsert, EventFormFieldUpdate>;
      delegate_applications: TableDef<
        DelegateApplicationRow,
        DelegateApplicationInsert,
        DelegateApplicationUpdate
      >;
      delegates: TableDef<DelegateRow, DelegateInsert, DelegateUpdate>;
      event_types: TableDef<EventTypeRow, EventTypeInsert, EventTypeUpdate>;
      events: TableDef<EventRow, EventInsert, EventUpdate>;
      teams: TableDef<TeamRow, TeamInsert, TeamUpdate>;
      team_members: TableDef<TeamMemberRow, TeamMemberInsert, TeamMemberUpdate>;
      event_registrations: TableDef<
        EventRegistrationRow,
        EventRegistrationInsert,
        EventRegistrationUpdate
      >;
      payment_submissions: TableDef<
        PaymentSubmissionRow,
        PaymentSubmissionInsert,
        PaymentSubmissionUpdate
      >;
      qr_credentials: TableDef<QrCredentialRow, QrCredentialInsert, QrCredentialUpdate>;
      check_ins: TableDef<CheckInRow, CheckInInsert, CheckInUpdate>;
      results: TableDef<ResultRow, ResultInsert, ResultUpdate>;
      result_entries: TableDef<ResultEntryRow, ResultEntryInsert, ResultEntryUpdate>;
      notifications: TableDef<NotificationRow, NotificationInsert, NotificationUpdate>;
      audit_log: TableDef<AuditLogRow, AuditLogInsert, AuditLogUpdate>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: { p_uid: string }; Returns: boolean };
      is_admin_role: { Args: { p_uid: string; p_roles: AdminRole[] }; Returns: boolean };
      issue_delegate_id: { Args: Record<string, never>; Returns: string };
      issue_registration_code: { Args: Record<string, never>; Returns: string };
      approve_delegate_payment: {
        Args: { p_submission_id: string; p_admin: string; p_note?: string | null };
        Returns: DelegateRow;
      };
      reject_delegate_payment: {
        Args: {
          p_submission_id: string;
          p_admin: string;
          p_reason: string;
          p_note?: string | null;
          p_allow_resubmit?: boolean;
        };
        Returns: PaymentSubmissionRow;
      };
      approve_event_payment: {
        Args: { p_submission_id: string; p_admin: string; p_note?: string | null };
        Returns: EventRegistrationRow;
      };
      reject_event_payment: {
        Args: {
          p_submission_id: string;
          p_admin: string;
          p_reason: string;
          p_note?: string | null;
          p_allow_resubmit?: boolean;
        };
        Returns: PaymentSubmissionRow;
      };
      confirm_free_event_registration: {
        Args: { p_registration_id: string; p_actor: string };
        Returns: EventRegistrationRow;
      };
      approve_free_event_registration: {
        Args: { p_registration_id: string; p_admin: string; p_note?: string | null };
        Returns: EventRegistrationRow;
      };
      reject_free_event_registration: {
        Args: {
          p_registration_id: string;
          p_admin: string;
          p_reason: string;
          p_note?: string | null;
        };
        Returns: EventRegistrationRow;
      };
      redeem_event_qr: {
        Args: { p_token: string; p_event_id: string; p_admin: string };
        Returns: QrRedeemResult;
      };
      publish_results: {
        Args: { p_result_id: string; p_admin: string };
        Returns: ResultRow;
      };
      unpublish_results: {
        Args: { p_result_id: string; p_admin: string };
        Returns: ResultRow;
      };
    };
    Enums: {
      admin_role: AdminRole;
      field_type: FieldType;
      delegate_application_status: DelegateApplicationStatus;
      delegate_status: DelegateStatus;
      event_format: EventFormat;
      event_registration_status: EventRegistrationStatus;
      payment_type: PaymentType;
      payment_submission_status: PaymentSubmissionStatus;
      result_status: ResultStatus;
    };
    CompositeTypes: {
      qr_redeem_result: QrRedeemResult;
    };
  };
}
