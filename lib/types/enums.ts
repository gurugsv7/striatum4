/**
 * STRIATUM 4.0 — enum types and label maps.
 *
 * Hand-written to mirror the Postgres ENUM types defined in
 * supabase/migrations/0001_init.sql exactly. Each status enum is kept
 * separate (no shared generic "Status" type) per docs/00-PRODUCT.md §5.
 *
 * Label maps are used by <StatusChip> (components/ui) to render a
 * human-readable label + colour for any status value without another
 * lookup table living in component code.
 */

// ---------------------------------------------------------------------------
// ADMIN_ROLE
// ---------------------------------------------------------------------------
export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'REVIEWER', 'SCANNER'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  REVIEWER: 'Reviewer',
  SCANNER: 'Scanner',
};

// ---------------------------------------------------------------------------
// FIELD_TYPE (delegate_form_fields / event_form_fields)
// ---------------------------------------------------------------------------
export const FIELD_TYPES = [
  'TEXT',
  'EMAIL',
  'TEL',
  'NUMBER',
  'SELECT',
  'TEXTAREA',
  'DATE',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: 'Text',
  EMAIL: 'Email',
  TEL: 'Phone',
  NUMBER: 'Number',
  SELECT: 'Select',
  TEXTAREA: 'Long text',
  DATE: 'Date',
};

// ---------------------------------------------------------------------------
// delegate_applications.status
// DRAFT -> PAYMENT_PENDING -> PAYMENT_UNDER_REVIEW -> APPROVED
//                                                   \-> PAYMENT_REJECTED -> PAYMENT_UNDER_REVIEW (resubmit)
// ---------------------------------------------------------------------------
export const DELEGATE_APPLICATION_STATUSES = [
  'DRAFT',
  'PAYMENT_PENDING',
  'PAYMENT_UNDER_REVIEW',
  'PAYMENT_REJECTED',
  'APPROVED',
] as const;
export type DelegateApplicationStatus = (typeof DELEGATE_APPLICATION_STATUSES)[number];

export const DELEGATE_APPLICATION_STATUS_LABELS: Record<DelegateApplicationStatus, string> = {
  DRAFT: 'Draft',
  PAYMENT_PENDING: 'Payment step incomplete',
  PAYMENT_UNDER_REVIEW: 'Verification pending',
  PAYMENT_REJECTED: 'Needs attention',
  APPROVED: 'Delegate active',
};

/** StatusChip colour token per docs/01-DESIGN-SYSTEM.md §6. */
export const DELEGATE_APPLICATION_STATUS_COLOR: Record<
  DelegateApplicationStatus,
  'ice' | 'warning' | 'signal' | 'danger'
> = {
  DRAFT: 'ice',
  PAYMENT_PENDING: 'warning',
  PAYMENT_UNDER_REVIEW: 'warning',
  PAYMENT_REJECTED: 'danger',
  APPROVED: 'signal',
};

// ---------------------------------------------------------------------------
// delegates.status
// ---------------------------------------------------------------------------
export const DELEGATE_STATUSES = ['ACTIVE', 'REVOKED'] as const;
export type DelegateStatus = (typeof DELEGATE_STATUSES)[number];

export const DELEGATE_STATUS_LABELS: Record<DelegateStatus, string> = {
  ACTIVE: 'Active',
  REVOKED: 'Revoked',
};

// ---------------------------------------------------------------------------
// event_registrations.status
// DRAFT -> PAYMENT_PENDING -> PAYMENT_UNDER_REVIEW -> CONFIRMED
//                                                   \-> PAYMENT_REJECTED -> PAYMENT_UNDER_REVIEW (resubmit)
// DRAFT -> PENDING_APPROVAL -> CONFIRMED   (free event requiring admin approval)
// DRAFT -> CONFIRMED                        (free event, no approval needed)
// any non-terminal -> CANCELLED
// ---------------------------------------------------------------------------
export const EVENT_REGISTRATION_STATUSES = [
  'DRAFT',
  'PAYMENT_PENDING',
  'PAYMENT_UNDER_REVIEW',
  'PAYMENT_REJECTED',
  'PENDING_APPROVAL',
  'CONFIRMED',
  'CANCELLED',
] as const;
export type EventRegistrationStatus = (typeof EVENT_REGISTRATION_STATUSES)[number];

export const EVENT_REGISTRATION_STATUS_LABELS: Record<EventRegistrationStatus, string> = {
  DRAFT: 'Draft',
  PAYMENT_PENDING: 'Payment step incomplete',
  PAYMENT_UNDER_REVIEW: 'Verification pending',
  PAYMENT_REJECTED: 'Needs attention',
  PENDING_APPROVAL: 'Pending approval',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

export const EVENT_REGISTRATION_STATUS_COLOR: Record<
  EventRegistrationStatus,
  'ice' | 'warning' | 'signal' | 'danger'
> = {
  DRAFT: 'ice',
  PAYMENT_PENDING: 'warning',
  PAYMENT_UNDER_REVIEW: 'warning',
  PAYMENT_REJECTED: 'danger',
  PENDING_APPROVAL: 'warning',
  CONFIRMED: 'signal',
  CANCELLED: 'danger',
};

// ---------------------------------------------------------------------------
// payment_submissions.status
// NOT_SUBMITTED -> PENDING_REVIEW -> APPROVED
//                                 \-> REJECTED
//                                 \-> NEEDS_RESUBMISSION -> PENDING_REVIEW
// ---------------------------------------------------------------------------
export const PAYMENT_SUBMISSION_STATUSES = [
  'NOT_SUBMITTED',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_RESUBMISSION',
] as const;
export type PaymentSubmissionStatus = (typeof PAYMENT_SUBMISSION_STATUSES)[number];

export const PAYMENT_SUBMISSION_STATUS_LABELS: Record<PaymentSubmissionStatus, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_RESUBMISSION: 'Needs resubmission',
};

export const PAYMENT_SUBMISSION_STATUS_COLOR: Record<
  PaymentSubmissionStatus,
  'ice' | 'warning' | 'signal' | 'danger'
> = {
  NOT_SUBMITTED: 'ice',
  PENDING_REVIEW: 'warning',
  APPROVED: 'signal',
  REJECTED: 'danger',
  NEEDS_RESUBMISSION: 'danger',
};

// ---------------------------------------------------------------------------
// payment_type (payment_submissions.payment_type)
// ---------------------------------------------------------------------------
export const PAYMENT_TYPES = ['DELEGATE', 'EVENT'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  DELEGATE: 'Delegate registration',
  EVENT: 'Event registration',
};

// ---------------------------------------------------------------------------
// check-in state (derived: presence of a check_ins row, not a DB enum)
// ---------------------------------------------------------------------------
export const CHECK_IN_STATES = ['NOT_CHECKED_IN', 'CHECKED_IN'] as const;
export type CheckInState = (typeof CHECK_IN_STATES)[number];

export const CHECK_IN_STATE_LABELS: Record<CheckInState, string> = {
  NOT_CHECKED_IN: 'Not checked in',
  CHECKED_IN: 'Checked in',
};

export const CHECK_IN_STATE_COLOR: Record<CheckInState, 'ice' | 'success'> = {
  NOT_CHECKED_IN: 'ice',
  CHECKED_IN: 'success',
};

// ---------------------------------------------------------------------------
// result_status (results.status, events.results_status)
// ---------------------------------------------------------------------------
export const RESULT_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export const RESULT_STATUS_COLOR: Record<ResultStatus, 'ice' | 'signal'> = {
  DRAFT: 'ice',
  PUBLISHED: 'signal',
};

// ---------------------------------------------------------------------------
// event_format (events.format)
// ---------------------------------------------------------------------------
export const EVENT_FORMATS = ['INDIVIDUAL', 'TEAM'] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  INDIVIDUAL: 'Individual',
  TEAM: 'Team',
};

// ---------------------------------------------------------------------------
// redeem_event_qr() outcome (lib/qr contract — mirrors qr_redeem_result)
// ---------------------------------------------------------------------------
export const QR_REDEEM_OUTCOMES = [
  'VALID',
  'ALREADY_CHECKED_IN',
  'WRONG_EVENT',
  'INVALID',
] as const;
export type QrRedeemOutcome = (typeof QR_REDEEM_OUTCOMES)[number];

export const QR_REDEEM_OUTCOME_LABELS: Record<QrRedeemOutcome, string> = {
  VALID: 'Valid pass',
  ALREADY_CHECKED_IN: 'Already checked in',
  WRONG_EVENT: 'Wrong event',
  INVALID: 'Invalid pass',
};
