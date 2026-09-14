/**
 * STRIATUM 4.0 combo offers.
 *
 * Source of truth: the organisers' Combo Offers document. It supplies the
 * composition, the combined amount, the discounted amount and the 27 Sep 2026
 * deadline. Event names, prices and dates come from the brochure catalogue, so
 * a combo never restates a fee — it names the events and the saving, and the
 * rest is read from EVENTS.
 *
 * PRICING IS NOT DECIDED HERE. public.create_order re-reads every price and
 * re-applies the matching discount rule server-side; these rows exist so the
 * page can show what is on offer and so the cart can assemble the right set of
 * events. The migration that seeds public.discount_rules is generated from this
 * same list, which is what keeps the two in step.
 */
import { EVENTS } from './events.ts';
import { resolvePrice } from '../services/pricing.ts';

export type ComboKind = 'workshop' | 'quiz';

export interface ComboOffer {
  /** Matches the discount_rules row id in Supabase. */
  id: string;
  kind: ComboKind;
  /** Event ids in the order the organisers list them. */
  eventIds: string[];
  /**
   * Number of team entries purchased per event. 1 for an ordinary combo; the
   * bulk quiz offers buy four distinct teams of a single quiz.
   */
  teamsPerEvent: number;
  /** Combined price the organisers published, used to verify our own maths. */
  publishedNormalTotal: number;
  /** Discounted price the organisers published. */
  publishedComboTotal: number;
}

/**
 * Early-bird combos close at the end of 27 September 2026, India time — the
 * same day early-bird pricing ends.
 */
export const COMBO_DEADLINE_ISO = '2026-09-27';
export const COMBO_DEADLINE_DISPLAY = '27 SEP 2026';

/** End of 27 Sep 2026 in Asia/Kolkata, expressed as a UTC instant. */
export const COMBO_DEADLINE_UTC = Date.UTC(2026, 8, 27, 18, 29, 59, 999);

export const COMBO_OFFERS: ComboOffer[] = [
  // ------------------------------------------------------------ workshops --
  {
    id: 'combo-bonefire-trauma',
    kind: 'workshop',
    eventIds: ['s4-07', 's4-08'],
    teamsPerEvent: 1,
    publishedNormalTotal: 3100,
    publishedComboTotal: 2800
  },
  {
    id: 'combo-genesis-sono',
    kind: 'workshop',
    eventIds: ['s4-05', 's4-01'],
    teamsPerEvent: 1,
    publishedNormalTotal: 2000,
    publishedComboTotal: 1800
  },
  {
    id: 'combo-stitchreef-trauma',
    kind: 'workshop',
    eventIds: ['s4-02', 's4-08'],
    teamsPerEvent: 1,
    publishedNormalTotal: 3000,
    publishedComboTotal: 2700
  },
  {
    id: 'combo-stitchreef-pleuralis',
    kind: 'workshop',
    eventIds: ['s4-02', 's4-09'],
    teamsPerEvent: 1,
    publishedNormalTotal: 1800,
    publishedComboTotal: 1600
  },
  {
    id: 'combo-genesis-stitchreef-pleuralis',
    kind: 'workshop',
    eventIds: ['s4-05', 's4-02', 's4-09'],
    teamsPerEvent: 1,
    publishedNormalTotal: 2600,
    publishedComboTotal: 2400
  },
  {
    id: 'combo-rythmica-glowcode',
    kind: 'workshop',
    eventIds: ['s4-10', 's4-06'],
    teamsPerEvent: 1,
    publishedNormalTotal: 1200,
    publishedComboTotal: 1000
  },
  {
    id: 'combo-rythmica-penumbra-paedopraxis',
    kind: 'workshop',
    eventIds: ['s4-10', 's4-04', 's4-03'],
    teamsPerEvent: 1,
    publishedNormalTotal: 2000,
    publishedComboTotal: 1800
  },

  // ----------------------------------------------------------- quiz pairs --
  {
    id: 'combo-oceanic-glandswars',
    kind: 'quiz',
    eventIds: ['s4-11', 's4-13'],
    teamsPerEvent: 1,
    publishedNormalTotal: 900,
    publishedComboTotal: 750
  },
  {
    id: 'combo-aquaquest-glandswars',
    kind: 'quiz',
    eventIds: ['s4-12', 's4-13'],
    teamsPerEvent: 1,
    publishedNormalTotal: 1000,
    publishedComboTotal: 800
  },

  // ------------------------------------------------------ bulk team packs --
  // "Group of 4 Teams" means four distinct teams entering the same quiz, not a
  // four-person team. Each team keeps that quiz's own team-size rules.
  {
    id: 'combo-glandswars-4-teams',
    kind: 'quiz',
    eventIds: ['s4-13'],
    teamsPerEvent: 4,
    publishedNormalTotal: 1200,
    publishedComboTotal: 1000
  },
  {
    id: 'combo-oceanic-4-teams',
    kind: 'quiz',
    eventIds: ['s4-11'],
    teamsPerEvent: 4,
    publishedNormalTotal: 2400,
    publishedComboTotal: 2200
  },
  {
    id: 'combo-aquaquest-4-teams',
    kind: 'quiz',
    eventIds: ['s4-12'],
    teamsPerEvent: 4,
    publishedNormalTotal: 2800,
    publishedComboTotal: 2500
  }
];

/** Savings the organisers published for a combo. */
export function comboSavings(combo: ComboOffer): number {
  return combo.publishedNormalTotal - combo.publishedComboTotal;
}

export interface ComboEventView {
  id: string;
  name: string;
  code: string;
  date?: string;
  startTime?: string;
  price: number | null;
}

/** The events in a combo, resolved against the live catalogue. */
export function comboEvents(combo: ComboOffer): ComboEventView[] {
  return combo.eventIds.map(id => {
    const event = EVENTS.find(candidate => candidate.id === id);
    if (!event) return { id, name: id, code: id, price: null };
    const price = resolvePrice(event, event.participation === 'team' ? 'team' : 'individual');
    return {
      id,
      name: event.name,
      code: event.code,
      date: event.date,
      startTime: event.startTime,
      price: price.unspecified ? null : price.amount
    };
  });
}

/**
 * What the same selection costs at catalogue prices right now.
 *
 * Returns null when any event has no published fee. This is a display value and
 * a consistency check — the server computes the amount that is actually owed.
 */
export function comboNormalTotal(combo: ComboOffer): number | null {
  const prices = comboEvents(combo).map(event => event.price);
  if (prices.some(price => price === null)) return null;
  return prices.reduce((sum: number, price) => sum + (price as number), 0) * combo.teamsPerEvent;
}

/** True while the offer is still open, in Asia/Kolkata. */
export function isComboOpen(now: number = Date.now()): boolean {
  return now <= COMBO_DEADLINE_UTC;
}

export function combosOfKind(kind: ComboKind): ComboOffer[] {
  return COMBO_OFFERS.filter(combo => combo.kind === kind);
}

/** Human label for a combo, built from the live event names. */
export function comboTitle(combo: ComboOffer): string {
  const events = comboEvents(combo);
  if (combo.teamsPerEvent > 1) {
    return `${combo.teamsPerEvent} TEAMS · ${events[0]?.name ?? ''}`;
  }
  return events.map(event => event.name).join(' + ');
}
