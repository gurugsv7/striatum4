/**
 * STRIATUM 4.0 — Event domain model.
 *
 * Sourced exclusively from STRIATUM_4.0_Website_Event_Master_Data.md (the brochure
 * extract). Category, specialty and format are deliberately separate fields.
 *
 * RULE: never invent a symposium fact. A field that the brochure does not state is
 * simply omitted, and the UI hides it. `TBA` is reserved for values organisers have
 * confirmed as pending.
 */

export type EventCategory =
  | 'workshop'
  | 'quiz'
  | 'presentation'
  | 'research'
  | 'innovation'
  | 'creative'
  | 'game'
  | 'exhibition';

export type DelegatePassRequirement =
  | 'required'
  | 'not_required'
  | 'not_required_for_submission'
  | 'unspecified';

export type EventStatus = 'open' | 'closed' | 'coming_soon' | 'full' | 'not_registerable';

/** How a participant enters the event. */
export type ParticipationMode = 'individual' | 'team' | 'either';

export interface TeamSize {
  min: number;
  max: number;
}

/**
 * Pricing is intentionally multi-dimensional. Never collapse this to `price: number`.
 *
 *  - earlyBird / lateBird — workshop early & late registration fees (per person)
 *  - entry / spot         — quiz pre-registration & on-the-spot fees (per team)
 *  - individual / team    — presentation-style events priced by participation shape
 *  - flat                 — single fee regardless of participation shape
 */
export interface EventPricing {
  earlyBird?: number;
  lateBird?: number;
  entry?: number;
  spot?: number;
  individual?: number;
  team?: number;
  flat?: number;
  /** What one unit of the fee buys. */
  unit?: 'per_person' | 'per_team';
  /** Fee exists but the brochure does not state it. */
  unspecified?: boolean;
  /** Brochure-stated qualification, e.g. "payable after abstract selection". */
  note?: string;
}

export interface Coordinator {
  name: string;
  phone?: string;
}

export interface EventPrizes {
  totalValue?: number;
  notes?: string;
}

/** A titled block of brochure detail, rendered as a collapsible section. */
export interface EventSection {
  /** Uppercase section heading, e.g. "SKILLS COVERED". */
  title: string;
  /** Prose paragraph. */
  body?: string;
  /** Bullet list. */
  items?: string[];
  /** Label/value pairs, e.g. Prelims → Online · 3 Oct 2026. */
  facts?: { label: string; value: string }[];
  /** Open by default on Event Detail. */
  defaultOpen?: boolean;
}

export interface SymposiumEvent {
  id: string;
  /** Display code, e.g. "S4 / 07". */
  code: string;
  /** Official branded event name, used as the headline everywhere. */
  name: string;
  tagline?: string;
  /** One-line summary for cards. */
  summary?: string;
  /** Longer editorial description for Event Detail. */
  description?: string;

  category: EventCategory;
  /** Department / clinical topic tags. Drives the secondary filter sheet + search. */
  specialties: string[];
  /** Human-readable format, e.g. "Workshop", "Junior Quiz", "Reel Creation". */
  format: string;
  /** Online / offline / hybrid, when the brochure states it. */
  mode?: 'online' | 'offline' | 'hybrid';

  date?: string;
  /** ISO date used for the Programme timeline & conflict detection. */
  isoDate?: string;
  startTime?: string;
  endTime?: string;
  reportingTime?: string;
  venue?: string;

  slots?: number;

  participation: ParticipationMode;
  teamSize?: TeamSize;

  pricing: EventPricing;
  delegatePassRequirement: DelegatePassRequirement;

  eligibility?: string[];
  skills?: string[];
  rules?: string[];

  abstractDeadline?: string;
  submissionDeadline?: string;
  submissionEmail?: string;
  submissionInstructions?: string[];

  prizes?: EventPrizes;
  coordinators?: Coordinator[];

  /** Adaptive detail sections, ordered as they should render. */
  sections?: EventSection[];

  status: EventStatus;
  /** Registration is handled off-platform / not applicable (e.g. an exhibition). */
  registerable: boolean;

  /**
   * Brochure contradictions flagged for organiser confirmation. Never rendered as
   * public copy — used only to keep unverified values out of production surfaces.
   */
  needsConfirmation?: string[];

  /** Extra search keywords (abbreviations, synonyms) indexed by Explore. */
  keywords?: string[];
}

/** Primary Explore filters → categories they include. */
export const CATEGORY_FILTERS: { id: string; label: string; categories: EventCategory[] }[] = [
  { id: 'ALL', label: 'ALL', categories: [] },
  { id: 'WORKSHOPS', label: 'WORKSHOPS', categories: ['workshop'] },
  { id: 'QUIZZES', label: 'QUIZZES', categories: ['quiz'] },
  { id: 'RESEARCH', label: 'RESEARCH', categories: ['presentation', 'research', 'innovation'] },
  { id: 'CREATIVE', label: 'CREATIVE', categories: ['creative'] },
  { id: 'GAMES', label: 'GAMES', categories: ['game', 'exhibition'] }
];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  workshop: 'Workshop',
  quiz: 'Quiz',
  presentation: 'Presentation',
  research: 'Research',
  innovation: 'Innovation',
  creative: 'Creative',
  game: 'Experience',
  exhibition: 'Exhibition'
};
