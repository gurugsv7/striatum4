/**
 * Registration intents.
 *
 * A cart item used to be an event id. It is now a completed registration: who
 * is taking part, in which role, plus whatever the event's schema requires.
 * This module owns the shape of that data and the validation applied to it.
 *
 * The same rules run again inside create_order. This layer exists so the form
 * can tell someone what is wrong before they queue for payment, not so the
 * server can trust it.
 */
import {
  EventRegistrationSchema,
  MemberField,
  YearValue,
  schemaFor,
  initialMemberCount
} from '../data/registrationSchemas.ts';
import { getEvent } from '../data/events.ts';
import type { LunchChoice } from './workshop.ts';

export interface Participant {
  /** 1 is the primary registrant / captain. */
  position: number;
  role: 'captain' | 'member';
  name: string;
  year?: string;
  college?: string;
  phone?: string;
  email?: string;
}

/** One team's roster. Single-entry events have exactly one of these. */
export interface TeamRoster {
  /** 1-based. Bulk quiz packs carry four. */
  teamIndex: number;
  participants: Participant[];
  /** Set when the schema asks the college once for the whole team. */
  teamCollege?: string;
}

export interface EventRegistrationIntent {
  eventId: string;
  teams: TeamRoster[];
  lunchChoice?: LunchChoice;
}

export function emptyParticipant(position: number): Participant {
  return { position, role: position === 1 ? 'captain' : 'member', name: '' };
}

/** A blank roster sized from the schema. */
export function blankTeam(schema: EventRegistrationSchema, teamIndex = 1): TeamRoster {
  const count = initialMemberCount(schema);
  return {
    teamIndex,
    participants: Array.from({ length: count }, (_, index) => emptyParticipant(index + 1))
  };
}

export interface PrefillSource {
  fullName?: string;
  phone?: string;
  email?: string;
  college?: string;
  yearOfStudy?: string;
}

/**
 * A fresh intent for one event, with the signed-in delegate already in the
 * captain slot. They still see and confirm it — this only saves the typing.
 */
export function blankIntent(
  eventId: string,
  prefill: PrefillSource,
  teamCount = 1
): EventRegistrationIntent | null {
  const schema = schemaFor(eventId);
  if (!schema) return null;

  const teams = Array.from({ length: teamCount }, (_, index) => {
    const team = blankTeam(schema, index + 1);
    // Only the first team of a bulk pack is prefilled; the buyer is one person
    // and the other teams are other people entirely.
    if (index === 0 && team.participants[0]) {
      team.participants[0] = {
        ...team.participants[0],
        name: prefill.fullName ?? '',
        phone: prefill.phone ?? '',
        email: prefill.email ?? '',
        college: prefill.college ?? '',
        year: prefill.yearOfStudy ?? ''
      };
      if (schema.sameCollege) team.teamCollege = prefill.college ?? '';
    }
    return team;
  });

  return { eventId, teams };
}

export interface ValidationIssue {
  /** Which team the problem is in, when there are several. */
  teamIndex: number;
  /** Member position, when the problem belongs to one member. */
  position?: number;
  field?: MemberField | 'teamCollege' | 'lunch' | 'roster';
  message: string;
}

function labelFor(field: MemberField): string {
  switch (field) {
    case 'name':
      return 'Name';
    case 'year':
      return 'Year of study';
    case 'college':
      return 'College';
    case 'phone':
      return 'Contact number';
    case 'email':
      return 'Email';
  }
}

function fieldsFor(schema: EventRegistrationSchema, position: number): MemberField[] {
  // The primary registrant always carries full contact details; other members
  // carry only what the event's schema asks for.
  const base = position === 1 ? (['name', 'year', 'phone', 'email'] as MemberField[]) : schema.memberFields;
  // A cross-college event needs each member's own college.
  if (!schema.sameCollege && !base.includes('college')) return [...base, 'college'];
  return base;
}

function isBlank(value: string | undefined): boolean {
  return !value || !value.trim();
}

/** Validates one roster against its schema. */
function validateTeam(
  schema: EventRegistrationSchema,
  team: TeamRoster,
  issues: ValidationIssue[]
): void {
  const people = team.participants;

  if (people.length < schema.minMembers || people.length > schema.maxMembers) {
    issues.push({
      teamIndex: team.teamIndex,
      field: 'roster',
      message:
        schema.minMembers === schema.maxMembers
          ? `This event needs exactly ${schema.minMembers} ${schema.minMembers === 1 ? 'participant' : 'members'}.`
          : `This event takes between ${schema.minMembers} and ${schema.maxMembers} members.`
    });
  }

  if (schema.sameCollege && isBlank(team.teamCollege)) {
    issues.push({
      teamIndex: team.teamIndex,
      field: 'teamCollege',
      message: 'Enter the college every member belongs to.'
    });
  }

  people.forEach(person => {
    for (const field of fieldsFor(schema, person.position)) {
      const value = person[field as keyof Participant] as string | undefined;
      if (isBlank(value)) {
        issues.push({
          teamIndex: team.teamIndex,
          position: person.position,
          field,
          message: `${labelFor(field)} is required.`
        });
      }
    }

    if (person.position === 1 && !isBlank(person.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email!.trim())) {
      issues.push({
        teamIndex: team.teamIndex,
        position: person.position,
        field: 'email',
        message: 'Enter a valid attendee email.'
      });
    }

    if (schema.allowedYears && !isBlank(person.year) && !schema.allowedYears.includes(person.year as YearValue)) {
      issues.push({
        teamIndex: team.teamIndex,
        position: person.position,
        field: 'year',
        message: `${person.year} is not eligible for this event.`
      });
    }
  });

  for (const limit of schema.yearLimits ?? []) {
    const count = people.filter(person => person.year === limit.year).length;
    if (count > limit.max) {
      issues.push({
        teamIndex: team.teamIndex,
        field: 'year',
        message: limit.reason
      });
    }
  }
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

/** Validates a whole intent, every team in it. */
export function validateIntent(intent: EventRegistrationIntent): ValidationResult {
  const schema = schemaFor(intent.eventId);
  const event = getEvent(intent.eventId);
  const issues: ValidationIssue[] = [];

  if (!schema || !event) {
    return { ok: false, issues: [{ teamIndex: 1, message: 'Unknown event.' }] };
  }

  if (schema.foodPreference && !intent.lunchChoice) {
    issues.push({
      teamIndex: 1,
      field: 'lunch',
      message: 'Choose a vegetarian or non-vegetarian lunch.'
    });
  }

  intent.teams.forEach(team => validateTeam(schema, team, issues));

  return { ok: issues.length === 0, issues };
}

/** Total people named across every team of an intent. */
export function participantCount(intent: EventRegistrationIntent): number {
  return intent.teams.reduce((sum, team) => sum + team.participants.length, 0);
}

/**
 * A one-line summary for the cart. Compact by design: the cart states that a
 * registration is complete, it does not reprint the form.
 */
export function intentSummary(intent: EventRegistrationIntent): string {
  const schema = schemaFor(intent.eventId);
  if (!schema) return '';

  const teams = intent.teams.length;
  const people = participantCount(intent);

  if (teams > 1) return `${teams} teams · ${people} participants`;
  if (schema.shape === 'individual' || people === 1) return 'Individual';
  return `Team of ${people}`;
}

/** Shape sent to the server. Mirrors the participants table columns. */
export function toServerTeams(intent: EventRegistrationIntent) {
  const schema = schemaFor(intent.eventId);
  return intent.teams.map(team => ({
    team_index: team.teamIndex,
    team_college: schema?.sameCollege ? team.teamCollege ?? null : null,
    participants: team.participants.map(person => ({
      position: person.position,
      role: person.role,
      name: person.name.trim(),
      year_of_study: person.year?.trim() || null,
      college: (schema?.sameCollege ? team.teamCollege : person.college)?.trim() || null,
      phone: person.phone?.trim() || null,
      email: person.email?.trim() || null
    }))
  }));
}
