/**
 * STRIATUM 4.0 — event registration validation.
 *
 * Two shapes: INDIVIDUAL (no team) and TEAM (team name + member roster,
 * size validated against the event's own min_team_size/max_team_size).
 * Callers build the schema with buildEventRegistrationSchema() once they
 * know the event's format and team-size bounds — those come from the DB,
 * never hardcoded here.
 */
import { z } from 'zod';

import type { EventFormat } from '@/lib/types/enums';

export const teamMemberInputSchema = z.object({
  fullName: z.string().trim().min(1, 'Member name is required.').max(200),
  email: z.string().trim().email('Enter a valid email address.').max(320).optional().or(z.literal('')).transform((v) => (v ? v : null)),
  mobile: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
  college: z.string().trim().max(300).optional().or(z.literal('')).transform((v) => (v ? v : null)),
  year: z.string().trim().max(50).optional().or(z.literal('')).transform((v) => (v ? v : null)),
  isLead: z.boolean().default(false),
});
export type TeamMemberInput = z.infer<typeof teamMemberInputSchema>;

const baseEventRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  extra: z.record(z.string(), z.unknown()).default({}),
});

/**
 * `format` and team-size bounds come from the target event row
 * (lib/queries/events.ts). For TEAM events, member count must fall within
 * [minTeamSize, maxTeamSize] when those bounds are set (either may be
 * null — the DB allows an event to leave them unannounced).
 */
export function buildEventRegistrationSchema(
  format: EventFormat,
  bounds: { minTeamSize: number | null; maxTeamSize: number | null }
) {
  if (format === 'INDIVIDUAL') {
    return baseEventRegistrationSchema;
  }

  return baseEventRegistrationSchema
    .extend({
      teamName: z.string().trim().max(200).optional().or(z.literal('')).transform((v) => (v ? v : null)),
      members: z.array(teamMemberInputSchema).min(1, 'Add at least one team member.'),
    })
    .refine(
      (data) => data.members.filter((m) => m.isLead).length === 1,
      { message: 'Exactly one team member must be marked as lead.', path: ['members'] }
    )
    .refine(
      (data) => (bounds.minTeamSize == null ? true : data.members.length >= bounds.minTeamSize),
      {
        message: bounds.minTeamSize != null ? `Team needs at least ${bounds.minTeamSize} member(s).` : '',
        path: ['members'],
      }
    )
    .refine(
      (data) => (bounds.maxTeamSize == null ? true : data.members.length <= bounds.maxTeamSize),
      {
        message: bounds.maxTeamSize != null ? `Team allows at most ${bounds.maxTeamSize} member(s).` : '',
        path: ['members'],
      }
    );
}

export type EventRegistrationInput = z.infer<ReturnType<typeof buildEventRegistrationSchema>>;

// ---------------------------------------------------------------------------
// cancelRegistration
// ---------------------------------------------------------------------------
export const cancelRegistrationSchema = z.object({
  registrationId: z.string().uuid(),
});
export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>;
