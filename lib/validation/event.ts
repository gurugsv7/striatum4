/**
 * STRIATUM 4.0 — admin event CRUD validation.
 *
 * Almost every descriptive column on `events` is nullable (see
 * docs/02-SCHEMA.md) — the UI renders "not announced" rather than the DB
 * forcing a value. Every optional field here is genuinely optional /
 * nullable, matching the SQL exactly. No field is silently defaulted to an
 * invented value.
 */
import { z } from 'zod';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const nonNegativeIntOrNull = z
  .union([z.coerce.number().int().min(0), z.null(), z.literal('')])
  .optional()
  .transform((v) => (v === '' || v == null ? null : v));

export const eventFaqSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

export const eventSpeakerSchema = z.object({
  name: z.string().trim().min(1),
  title: optionalTrimmed(300),
  bio: optionalTrimmed(2000),
  photoUrl: optionalTrimmed(2000),
});

export const eventScheduleItemSchema = z.object({
  time: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

export const upsertEventSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required.')
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'Slug may contain only lowercase letters, numbers, and hyphens.'),
    name: z.string().trim().min(1, 'Event name is required.').max(300),
    typeId: z.string().uuid().optional().nullable(),
    summary: optionalTrimmed(500),
    description: optionalTrimmed(10000),
    eventDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    startTime: z.string().trim().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
    endTime: z.string().trim().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
    session: optionalTrimmed(100),
    venue: optionalTrimmed(300),
    format: z.enum(['INDIVIDUAL', 'TEAM']).default('INDIVIDUAL'),
    minTeamSize: nonNegativeIntOrNull,
    maxTeamSize: nonNegativeIntOrNull,
    isPaid: z.boolean().default(false),
    feeInr: nonNegativeIntOrNull,
    capacity: nonNegativeIntOrNull,
    registrationOpen: z.boolean().default(false),
    requiresAdminApproval: z.boolean().default(false),
    eligibility: optionalTrimmed(2000),
    rules: optionalTrimmed(10000),
    about: optionalTrimmed(10000),
    faqs: z.array(eventFaqSchema).optional().nullable(),
    speakers: z.array(eventSpeakerSchema).optional().nullable(),
    schedule: z.array(eventScheduleItemSchema).optional().nullable(),
    paymentUpiId: optionalTrimmed(200),
    paymentPayeeName: optionalTrimmed(200),
    isFeatured: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine(
    (data) =>
      data.minTeamSize == null || data.maxTeamSize == null || data.minTeamSize <= data.maxTeamSize,
    { message: 'Minimum team size cannot exceed maximum team size.', path: ['minTeamSize'] }
  );
export type UpsertEventInput = z.infer<typeof upsertEventSchema>;

export const upsertEventTypeSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(200),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type UpsertEventTypeInput = z.infer<typeof upsertEventTypeSchema>;

export const upsertEventTypesSchema = z.array(upsertEventTypeSchema);
export type UpsertEventTypesInput = z.infer<typeof upsertEventTypesSchema>;
