/**
 * STRIATUM 4.0 — admin results entry validation.
 *
 * result_entries rows are deliberately free-form (position/label/score) to
 * fit quizzes, presentations, and team events alike — nothing here forces
 * a shape the product doesn't specify.
 */
import { z } from 'zod';

export const resultEntryInputSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.coerce.number().int().min(1).optional().nullable(),
  label: z.string().trim().max(200).optional().nullable(),
  eventRegistrationId: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  participantName: z.string().trim().max(300).optional().nullable(),
  delegateIdText: z.string().trim().max(50).optional().nullable(),
  institution: z.string().trim().max(300).optional().nullable(),
  score: z.string().trim().max(100).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});
export type ResultEntryInput = z.infer<typeof resultEntryInputSchema>;

export const saveResultsSchema = z.object({
  eventId: z.string().uuid(),
  resultId: z.string().uuid().optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
  entries: z.array(resultEntryInputSchema).default([]),
});
export type SaveResultsInput = z.infer<typeof saveResultsSchema>;

export const publishResultsSchema = z.object({
  resultId: z.string().uuid(),
});
export type PublishResultsInput = z.infer<typeof publishResultsSchema>;

export const unpublishResultsSchema = z.object({
  resultId: z.string().uuid(),
});
export type UnpublishResultsInput = z.infer<typeof unpublishResultsSchema>;
