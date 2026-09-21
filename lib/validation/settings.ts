/**
 * STRIATUM 4.0 — admin settings validation (app_settings, payment_settings,
 * per-event payment overrides).
 */
import { z } from 'zod';

export const updateAppSettingsSchema = z.object({
  launched: z.boolean(),
  launchDate: z.string().trim().datetime().optional().nullable(),
  symposiumStart: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  symposiumEnd: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;

export const updatePaymentSettingsSchema = z.object({
  delegateFeeInr: z.coerce.number().int().min(0).optional().nullable(),
  payeeName: z.string().trim().max(200).optional().nullable(),
  upiId: z.string().trim().max(200).optional().nullable(),
  instructions: z.string().trim().max(5000).optional().nullable(),
  requireTransactionRef: z.boolean().default(false),
  // QR image upload is handled as a File in the action's FormData input,
  // validated separately with the same constraints as payment screenshots
  // (see lib/validation/payment.ts) but is optional here — an admin may
  // update fee/instructions without replacing the QR image.
});
export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>;

export const eventPaymentOverrideSchema = z.object({
  eventId: z.string().uuid(),
  paymentUpiId: z.string().trim().max(200).optional().nullable(),
  paymentPayeeName: z.string().trim().max(200).optional().nullable(),
  // paymentQrStoragePath is set by the upload step in the action, not by
  // the form payload directly.
});
export type EventPaymentOverrideInput = z.infer<typeof eventPaymentOverrideSchema>;
