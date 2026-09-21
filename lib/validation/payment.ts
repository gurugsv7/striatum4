/**
 * STRIATUM 4.0 — payment screenshot submission validation.
 *
 * Shared by the delegate payment step and the event payment step. The
 * transaction reference is optional unless payment_settings (or the
 * effective per-event override) has require_transaction_ref = true —
 * callers build the schema with buildPaymentSubmissionSchema() once they
 * know that flag, rather than hardcoding it here.
 */
import { z } from 'zod';

export const ALLOWED_SCREENSHOT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024; // 8MB

export const screenshotFileSchema = z
  .instanceof(File, { message: 'Attach a payment screenshot.' })
  .refine((file) => file.size > 0, 'Attach a payment screenshot.')
  .refine(
    (file) => file.size <= MAX_SCREENSHOT_BYTES,
    `Screenshot must be ${MAX_SCREENSHOT_BYTES / (1024 * 1024)}MB or smaller.`
  )
  .refine(
    (file) => (ALLOWED_SCREENSHOT_MIME_TYPES as readonly string[]).includes(file.type),
    'Screenshot must be a JPEG, PNG, or WEBP image.'
  );

/**
 * Builds the payment-submission schema for a given "require transaction
 * reference" flag. `targetId` is validated by the caller (it identifies a
 * delegate_application or an event_registration; the exactly-one-of
 * constraint is enforced at the DB layer and by the actions, not here).
 */
export function buildPaymentSubmissionSchema(requireTransactionRef: boolean) {
  return z.object({
    screenshot: screenshotFileSchema,
    transactionReference: requireTransactionRef
      ? z.string().trim().min(1, 'Transaction reference is required.').max(200)
      : z
          .string()
          .trim()
          .max(200)
          .optional()
          .or(z.literal(''))
          .transform((v) => (v ? v : null)),
  });
}

export type PaymentSubmissionInput = {
  screenshot: File;
  transactionReference: string | null;
};

// Non-file metadata used by replaceDelegateScreenshot / submitEventPayment
// action wrappers to identify which submission is being acted on.
export const paymentTargetSchema = z.object({
  submissionId: z.string().uuid().optional(),
});
