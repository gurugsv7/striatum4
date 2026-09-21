/**
 * STRIATUM 4.0 — delegate/registration id display + status label re-exports.
 *
 * Status labels/colours live in lib/types/enums.ts as the single source of
 * truth (consumed directly by <StatusChip>); this module re-exports them
 * under the lib/format/** namespace so callers can import formatting
 * helpers from one place, without a second copy of the label maps.
 */
export {
  DELEGATE_APPLICATION_STATUS_LABELS,
  DELEGATE_APPLICATION_STATUS_COLOR,
  DELEGATE_STATUS_LABELS,
  EVENT_REGISTRATION_STATUS_LABELS,
  EVENT_REGISTRATION_STATUS_COLOR,
  PAYMENT_SUBMISSION_STATUS_LABELS,
  PAYMENT_SUBMISSION_STATUS_COLOR,
  CHECK_IN_STATE_LABELS,
  CHECK_IN_STATE_COLOR,
  RESULT_STATUS_LABELS,
  RESULT_STATUS_COLOR,
  QR_REDEEM_OUTCOME_LABELS,
} from '@/lib/types/enums';

/** 'S4-26-0184' as-is — already the canonical display form. */
export function formatDelegateId(delegateId: string | null): string {
  return delegateId ?? 'Not issued';
}

/** 'REG-26-000123' as-is — already the canonical display form. */
export function formatRegistrationCode(code: string | null): string {
  return code ?? 'Not issued';
}
