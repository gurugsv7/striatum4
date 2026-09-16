import { SymposiumEvent, EventPricing, PASS_TIER_RANK } from '../data/eventTypes.ts';

/**
 * Registration pricing phase.
 *
 * The brochure states early-bird and late-bird fees but does NOT state the cutoff
 * date between them, so the phase cannot be derived from the clock without
 * inventing a fact. It is a single explicit switch here; move it to remote config
 * once organisers confirm the cutoff.
 */
export type PricingPhase = 'early' | 'late' | 'spot';

export const CURRENT_PRICING_PHASE: PricingPhase = 'early';

export type Participation = 'individual' | 'team';

export interface ResolvedPrice {
  /** null when the brochure does not state a fee. */
  amount: number | null;
  /** Display string, e.g. "₹1,200". */
  display: string;
  /** What the amount buys, e.g. "Early bird · per person". */
  basis: string;
  unspecified: boolean;
}

export function formatINR(value: number): string {
  // A published fee of nothing is free, and saying "₹0" makes a reader wonder
  // whether the number failed to load. An unpriced event is a separate case
  // and already reports itself as "Not specified".
  if (value === 0) return 'Free';
  return '₹' + value.toLocaleString('en-IN');
}

function unitLabel(pricing: EventPricing): string {
  if (pricing.unit === 'per_team') return 'per team';
  if (pricing.unit === 'per_person') return 'per person';
  return '';
}

function withUnit(base: string, pricing: EventPricing): string {
  const unit = unitLabel(pricing);
  return unit ? `${base} · ${unit}` : base;
}

/**
 * Resolves the single payable amount for one registration of an event.
 * Never collapses the pricing model — it selects from it.
 */
export function resolvePrice(
  event: SymposiumEvent,
  participation: Participation = defaultParticipation(event),
  phase: PricingPhase = CURRENT_PRICING_PHASE
): ResolvedPrice {
  const p = event.pricing;

  // Entering an abstract-first event costs nothing. Its published fee is what a
  // selected entry pays the organisers later, so it stays on the event for the
  // page to quote — it is simply not what this registration charges. The server
  // prices these lines at zero too; this only keeps the screen honest before
  // the order exists.
  if (event.abstractFirst) {
    return { amount: 0, display: formatINR(0), basis: 'Abstract submission', unspecified: false };
  }

  if (p.unspecified) {
    return { amount: null, display: 'Not specified', basis: '', unspecified: true };
  }

  // Workshop-style early / late fees.
  if (p.earlyBird !== undefined || p.lateBird !== undefined) {
    const useLate = phase !== 'early' && p.lateBird !== undefined;
    const amount = (useLate ? p.lateBird : p.earlyBird) as number;
    return {
      amount,
      display: formatINR(amount),
      basis: withUnit(useLate ? 'Late bird' : 'Early bird', p),
      unspecified: false
    };
  }

  // Quiz-style entry / on-the-spot fees.
  if (p.entry !== undefined || p.spot !== undefined) {
    const useSpot = phase === 'spot' && p.spot !== undefined;
    const amount = (useSpot ? p.spot : p.entry) as number;
    return {
      amount,
      display: formatINR(amount),
      basis: withUnit(useSpot ? 'Spot entry' : 'Entry', p),
      unspecified: false
    };
  }

  // Participation-shaped fees.
  if (participation === 'team' && p.team !== undefined) {
    return { amount: p.team, display: formatINR(p.team), basis: withUnit('Team', p), unspecified: false };
  }
  if (participation === 'individual' && p.individual !== undefined) {
    return {
      amount: p.individual,
      display: formatINR(p.individual),
      basis: withUnit('Individual', p),
      unspecified: false
    };
  }
  if (p.team !== undefined) {
    return { amount: p.team, display: formatINR(p.team), basis: withUnit('Team', p), unspecified: false };
  }
  if (p.individual !== undefined) {
    return {
      amount: p.individual,
      display: formatINR(p.individual),
      basis: withUnit('Individual', p),
      unspecified: false
    };
  }
  if (p.flat !== undefined) {
    return { amount: p.flat, display: formatINR(p.flat), basis: withUnit('Registration', p), unspecified: false };
  }

  return { amount: null, display: 'Not specified', basis: '', unspecified: true };
}

/** The participation shape an event defaults to when the user has not chosen. */
export function defaultParticipation(event: SymposiumEvent): Participation {
  return event.participation === 'team' ? 'team' : 'individual';
}

/** Lowest payable amount, used for "₹1,300 onwards" on Explore cards. */
export function lowestPrice(event: SymposiumEvent): number | null {
  const p = event.pricing;
  const candidates = [p.earlyBird, p.lateBird, p.entry, p.spot, p.individual, p.team, p.flat].filter(
    (v): v is number => typeof v === 'number'
  );
  if (!candidates.length) return null;
  return Math.min(...candidates);
}

/**
 * "Tier 2 pass", for an event a pass tier unlocks.
 *
 * MEDMAZE costs nothing and reads as "Free" everywhere, which is true and
 * useless: it invited anyone to press Register and be refused at checkout for
 * a reason no card had mentioned. What gates it is the pass, so that is what
 * the fee position says.
 */
export function tierLabel(event: SymposiumEvent): string {
  return event.requiredTier ? `Tier ${PASS_TIER_RANK[event.requiredTier]} pass` : '';
}

/** Compact card price label. Returns '' when no fee is published. */
export function priceLabel(event: SymposiumEvent): string {
  const tier = tierLabel(event);
  const low = lowestPrice(event);
  if (low === null) return tier;
  if (low === 0 && tier) return tier;
  const p = event.pricing;
  const hasRange =
    (p.earlyBird !== undefined && p.lateBird !== undefined) ||
    (p.entry !== undefined && p.spot !== undefined) ||
    (p.individual !== undefined && p.team !== undefined);
  const suffix = p.unit === 'per_team' ? ' per team' : '';
  const base = hasRange ? `${formatINR(low)} onwards${suffix}` : `${formatINR(low)}${suffix}`;
  return tier ? `${base} \u00b7 ${tier}` : base;
}

/**
 * What the fee cell should say, which is not always an amount.
 *
 * Returns the tier where one gates the event and there is nothing to pay, so
 * the most prominent number on the page is not a "Free" that misleads.
 */
export function feeSummary(
  event: SymposiumEvent,
  participation: Participation = defaultParticipation(event),
  phase: PricingPhase = CURRENT_PRICING_PHASE
): { value: string; caption: string } {
  const price = resolvePrice(event, participation, phase);
  const tier = tierLabel(event);
  if (tier && price.amount === 0) {
    return { value: tier, caption: `${event.requiredTier} \u00b7 no entry fee` };
  }
  return { value: price.display, caption: tier ? `${price.basis} \u00b7 ${tier}` : price.basis };
}
