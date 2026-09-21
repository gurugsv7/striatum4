/**
 * STRIATUM 4.0 — delegate application validation.
 *
 * The delegate form is data-driven: `delegate_form_fields` seeds the six
 * baseline fields (full_name/email/mobile/college/year_of_study/student_id),
 * which map onto dedicated columns on delegate_applications, but organizers
 * may add more fields later without a redeploy. Those extra fields land in
 * delegate_applications.extra (jsonb) and must validate without a code
 * change — buildDelegateApplicationSchema() composes the static base schema
 * with a dynamic schema built from the current delegate_form_fields rows.
 */
import { z } from 'zod';

import type { DelegateFormFieldRow } from '@/lib/types/database';

// ---------------------------------------------------------------------------
// Base (dedicated-column) fields — always present, always required at the
// point the participant proceeds to payment.
// ---------------------------------------------------------------------------
export const delegateApplicationBaseSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.').max(200),
  email: z.string().trim().email('Enter a valid email address.').max(320),
  mobile: z
    .string()
    .trim()
    .min(7, 'Enter a valid mobile number.')
    .max(20, 'Enter a valid mobile number.')
    .regex(/^[0-9+\-\s()]+$/, 'Enter a valid mobile number.'),
  college: z.string().trim().min(1, 'College/institution is required.').max(300),
  yearOfStudy: z.string().trim().min(1, 'Year of study is required.').max(50),
  studentId: z.string().trim().max(100).optional().or(z.literal('')).transform((v) => v || null),
});

export type DelegateApplicationBaseInput = z.infer<typeof delegateApplicationBaseSchema>;

// ---------------------------------------------------------------------------
// Dynamic extra-field schema builder
// ---------------------------------------------------------------------------
function zodForField(field: DelegateFormFieldRow): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.field_type) {
    case 'EMAIL':
      schema = z.string().trim().email(`${field.label} must be a valid email.`);
      break;
    case 'TEL':
      schema = z
        .string()
        .trim()
        .regex(/^[0-9+\-\s()]+$/, `${field.label} must be a valid phone number.`);
      break;
    case 'NUMBER':
      schema = z.coerce.number(`${field.label} must be a number.`);
      break;
    case 'DATE':
      schema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, `${field.label} must be a valid date.`);
      break;
    case 'SELECT': {
      const options = Array.isArray(field.options)
        ? (field.options as unknown[]).filter((o): o is string => typeof o === 'string')
        : [];
      schema =
        options.length > 0
          ? z.enum(options as [string, ...string[]], `Choose a valid ${field.label}.`)
          : z.string().trim();
      break;
    }
    case 'TEXTAREA':
      schema = z.string().trim().max(5000);
      break;
    case 'TEXT':
    default:
      schema = z.string().trim().max(1000);
      break;
  }

  if (!field.required) {
    schema = schema.optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));
  }

  return schema;
}

/**
 * Composes the base delegate fields with the current set of active
 * delegate_form_fields rows. Pass the rows fetched via
 * lib/queries/settings.ts (or wherever the caller sources them) — this
 * function does no I/O itself so it stays testable and reusable from both
 * server actions and any future client-side pre-validation.
 */
export function buildDelegateApplicationSchema(extraFields: DelegateFormFieldRow[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of extraFields.filter((f) => f.is_active)) {
    shape[field.key] = zodForField(field);
  }

  return delegateApplicationBaseSchema.extend({
    extra: z.object(shape).catchall(z.unknown()).default({}),
  });
}

export type DelegateApplicationInput = DelegateApplicationBaseInput & {
  extra: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Save-application action input (id-less; the action resolves the current
// user's row via requireUser()).
// ---------------------------------------------------------------------------
export const saveDelegateApplicationSchema = delegateApplicationBaseSchema.extend({
  extra: z.record(z.string(), z.unknown()).default({}),
});
export type SaveDelegateApplicationInput = z.infer<typeof saveDelegateApplicationSchema>;
