/**
 * What each event needs collected before it can be registered.
 *
 * One configuration per event rather than one bespoke form per event. The
 * form view reads a schema and renders it; the cart validates against it; the
 * server re-validates the same rules. Adding an event means adding a schema,
 * not a screen.
 *
 * Every rule here comes from the brochure, from the existing catalogue data, or
 * is the identity information needed to register a person at all. Nothing is
 * added because it is "usual at conferences" — where the brochure is silent the
 * field is absent, and where it is ambiguous the schema says so in `notes` and
 * the ambiguity is reported rather than guessed.
 */
import { SymposiumEvent } from './eventTypes.ts';
import { getEvent } from './events.ts';
import { isFullDayWorkshop } from '../services/workshop.ts';
import type { PassTier } from '../state/appStore.ts';

/** Year values, matching the Delegate registration select exactly. */
export const YEAR_VALUES = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'CRRI / Intern'] as const;
export type YearValue = (typeof YEAR_VALUES)[number];

/** Per-member fields a schema can ask for. */
export type MemberField = 'name' | 'year' | 'college' | 'phone' | 'email';

export interface YearLimit {
  year: YearValue;
  max: number;
  /** Brochure wording, shown beside the roster so the rule is visible. */
  reason: string;
}

export type RosterShape = 'individual' | 'team' | 'individual_or_team';

export interface EventRegistrationSchema {
  eventId: string;
  shape: RosterShape;
  /** Team-size bounds. `min === max` is an exact-size event. */
  minMembers: number;
  maxMembers: number;
  /** How many member slots the form opens with. */
  defaultMembers: number;
  /**
   * True when the brochure requires one college for the whole team. The college
   * is then asked once at team level instead of per member.
   */
  sameCollege: boolean;
  /** Years permitted at all. Undefined means the brochure does not restrict. */
  allowedYears?: YearValue[];
  /** Per-team caps, e.g. only one CRRI. */
  yearLimits?: YearLimit[];
  /** Fields collected for each member beyond the primary registrant. */
  memberFields: MemberField[];
  /** Ask a Veg / Non-veg preference. Full-day workshops only. */
  foodPreference: boolean;
  /** Delegate tier the brochure names for this event. */
  requiredTier?: PassTier;
  /** Shown on the form. Never collected, never enforced. */
  notes: string[];
  /**
   * True when the team size is NOT stated in the brochure and the bounds here
   * are a system limit rather than an organiser rule.
   */
  teamSizeUnconfirmed?: boolean;
}

const QUIZ_MEMBER_FIELDS: MemberField[] = ['name', 'year'];
const CROSS_COLLEGE_MEMBER_FIELDS: MemberField[] = ['name', 'year', 'college', 'phone'];
const BASIC_MEMBER_FIELDS: MemberField[] = ['name', 'year'];

/**
 * Explicit schemas for events whose brochure entry states team rules.
 * Everything else is derived from the catalogue by `deriveSchema`.
 */
const EXPLICIT: Record<string, Partial<EventRegistrationSchema>> = {
  // ---------------------------------------------------------------- quizzes --
  // Junior quiz. Exactly three, one college, and two stated per-team year caps.
  's4-11': {
    shape: 'team',
    minMembers: 3,
    maxMembers: 3,
    defaultMembers: 3,
    sameCollege: true,
    allowedYears: ['1st Year', '2nd Year', '3rd Year'],
    yearLimits: [
      { year: '3rd Year', max: 1, reason: 'Only one third-year student (2023 batch) per team.' },
      { year: '2nd Year', max: 2, reason: 'Only two second-year students per team.' }
    ],
    memberFields: QUIZ_MEMBER_FIELDS,
    notes: [
      'Every team member must bring ID proof on the day.',
      'The brochure lists the third year as the 2024 batch while the per-team limit names the 2023 batch. Both are reproduced as written; organisers to confirm.'
    ]
  },

  // Senior quiz. Exactly three, one college, one CRRI and one final year.
  's4-12': {
    shape: 'team',
    minMembers: 3,
    maxMembers: 3,
    defaultMembers: 3,
    sameCollege: true,
    allowedYears: ['2nd Year', '3rd Year', 'Final Year', 'CRRI / Intern'],
    yearLimits: [
      { year: 'CRRI / Intern', max: 1, reason: 'Only one CRRI (2021 batch) per team.' },
      { year: 'Final Year', max: 1, reason: 'Only one final-year student (2022 batch) per team.' }
    ],
    memberFields: QUIZ_MEMBER_FIELDS,
    notes: ['All team members must bring ID proof on the day.']
  },

  // Online quiz. Cross-college teams are allowed, so each member carries their
  // own college, and the brochure names the details to collect explicitly.
  's4-13': {
    shape: 'team',
    minMembers: 1,
    maxMembers: 2,
    defaultMembers: 2,
    sameCollege: false,
    allowedYears: ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'CRRI / Intern'],
    yearLimits: [{ year: 'CRRI / Intern', max: 1, reason: 'Only one CRRI (2021 batch) per team.' }],
    memberFields: CROSS_COLLEGE_MEMBER_FIELDS,
    notes: [
      'Both team members must register with their correct name, year of study, college and contact details.',
      'Cross-college teams are allowed.',
      'The camera must remain on throughout the online preliminaries.'
    ]
  },

  // ----------------------------------------------------------- presentations --
  's4-14': {
    shape: 'team',
    minMembers: 2,
    maxMembers: 6,
    defaultMembers: 2,
    sameCollege: true,
    memberFields: BASIC_MEMBER_FIELDS,
    notes: ['All team members must belong to the same institution.']
  },

  // -------------------------------------------------------------- innovation --
  's4-18': {
    shape: 'individual_or_team',
    minMembers: 1,
    maxMembers: 3,
    defaultMembers: 1,
    sameCollege: false,
    memberFields: CROSS_COLLEGE_MEMBER_FIELDS,
    notes: [
      'The brochure recommends roughly three to four members but does not require it. Interdisciplinary teams are encouraged.'
    ]
  },

  // -------------------------------------------------------------------- games --
  's4-25': {
    shape: 'team',
    minMembers: 3,
    maxMembers: 3,
    defaultMembers: 3,
    sameCollege: false,
    memberFields: BASIC_MEMBER_FIELDS,
    notes: []
  },
  // Treasure hunt. The brochure names a Tier 2 (SYNEXA) Delegate Pass.
  's4-26': {
    shape: 'team',
    minMembers: 3,
    maxMembers: 3,
    defaultMembers: 3,
    sameCollege: false,
    memberFields: BASIC_MEMBER_FIELDS,
    requiredTier: 'SYNEXA',
    notes: ['A Tier 2 (SYNEXA) Delegate Pass is required for this event.']
  }
};

/** Upper bound used only where the brochure states no team size. */
const UNCONFIRMED_TEAM_MAX = 6;

function baseFor(event: SymposiumEvent): EventRegistrationSchema {
  const size = event.teamSize;
  const shape: RosterShape =
    event.participation === 'team'
      ? 'team'
      : event.participation === 'either'
      ? 'individual_or_team'
      : 'individual';

  // A team event with no published size: allow a roster without inventing a
  // brochure rule, and mark it so the UI and the report can say so.
  const unconfirmed = shape !== 'individual' && !size;

  const min = shape === 'individual' ? 1 : size?.min ?? 1;
  const max = shape === 'individual' ? 1 : size?.max ?? UNCONFIRMED_TEAM_MAX;

  return {
    eventId: event.id,
    shape,
    minMembers: min,
    maxMembers: max,
    defaultMembers: shape === 'individual' ? 1 : Math.max(min, 1),
    sameCollege: false,
    memberFields: BASIC_MEMBER_FIELDS,
    foodPreference: isFullDayWorkshop(event),
    notes: [],
    teamSizeUnconfirmed: unconfirmed || undefined
  };
}

const CACHE = new Map<string, EventRegistrationSchema>();

/** The registration schema for one event. */
export function schemaFor(eventId: string): EventRegistrationSchema | null {
  const cached = CACHE.get(eventId);
  if (cached) return cached;

  const event = getEvent(eventId);
  if (!event) return null;

  const base = baseFor(event);
  const explicit = EXPLICIT[eventId];
  const merged: EventRegistrationSchema = explicit
    ? { ...base, ...explicit, eventId, foodPreference: base.foodPreference }
    : base;

  // Submission deadlines are shown, never collected. The brochure sends those
  // to the organisers' inbox, and this app does not change that workflow.
  const deadlineNotes: string[] = [];
  if (event.abstractDeadline) deadlineNotes.push('Abstract deadline: ' + event.abstractDeadline);
  if (event.submissionDeadline) deadlineNotes.push('Submission deadline: ' + event.submissionDeadline);
  if (event.submissionEmail) deadlineNotes.push('Submit to ' + event.submissionEmail + ' — not through this site.');

  const withNotes: EventRegistrationSchema = {
    ...merged,
    notes: [...merged.notes, ...deadlineNotes]
  };

  CACHE.set(eventId, withNotes);
  return withNotes;
}

/** How many member slots a fresh form should show. */
export function initialMemberCount(schema: EventRegistrationSchema): number {
  return Math.min(Math.max(schema.defaultMembers, schema.minMembers), schema.maxMembers);
}
