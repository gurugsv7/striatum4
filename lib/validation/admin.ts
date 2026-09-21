/**
 * STRIATUM 4.0 — admin action payload validation.
 *
 * Approve/reject payloads for both delegate and event payments, plus the
 * fixed rejection-reason list from 00-PRODUCT.md.
 */
import { z } from 'zod';

export const REJECTION_REASONS = [
  'Screenshot unclear',
  'Incorrect amount',
  'Payment not found',
  'Duplicate screenshot',
  'Invalid transaction',
  'Other',
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const approvePaymentSchema = z.object({
  submissionId: z.string().uuid(),
  note: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : null)),
});
export type ApprovePaymentInput = z.infer<typeof approvePaymentSchema>;

export const rejectPaymentSchema = z.object({
  submissionId: z.string().uuid(),
  reason: z.enum(REJECTION_REASONS, 'Choose a rejection reason.'),
  note: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : null)),
  allowResubmit: z.boolean().default(true),
});
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;

export const approveFreeRegistrationSchema = z.object({
  registrationId: z.string().uuid(),
  note: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : null)),
});
export type ApproveFreeRegistrationInput = z.infer<typeof approveFreeRegistrationSchema>;

export const rejectFreeRegistrationSchema = z.object({
  registrationId: z.string().uuid(),
  reason: z.enum(REJECTION_REASONS, 'Choose a rejection reason.'),
  note: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : null)),
});
export type RejectFreeRegistrationInput = z.infer<typeof rejectFreeRegistrationSchema>;

export const checkInSchema = z.object({
  token: z.string().trim().min(1, 'Scan or paste a token.'),
  eventId: z.string().uuid(),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const toggleRegistrationOpenSchema = z.object({
  eventId: z.string().uuid(),
  open: z.boolean(),
});
export type ToggleRegistrationOpenInput = z.infer<typeof toggleRegistrationOpenSchema>;

export const setLaunchedSchema = z.object({
  launched: z.boolean(),
  launchDate: z.string().trim().datetime().optional().nullable(),
});
export type SetLaunchedInput = z.infer<typeof setLaunchedSchema>;

export const addAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'REVIEWER', 'SCANNER']),
});
export type AddAdminUserInput = z.infer<typeof addAdminUserSchema>;

export const updateAdminUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'REVIEWER', 'SCANNER']),
});
export type UpdateAdminUserRoleInput = z.infer<typeof updateAdminUserRoleSchema>;

export const removeAdminUserSchema = z.object({
  userId: z.string().uuid(),
});
export type RemoveAdminUserInput = z.infer<typeof removeAdminUserSchema>;
