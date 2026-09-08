import { EventCategory } from '../data/eventTypes.ts';

/**
 * Configurable multi-event bundle discounts.
 *
 * IMPORTANT: the organisers have NOT finalised the discount rule. No percentage or
 * amount is invented here — the engine ships with every rule inactive, so the cart
 * currently shows no bundle discount. When the rule is confirmed, set `active: true`
 * on the matching rule (or add a new one); nothing else needs to change.
 */
export interface DiscountRule {
  id: string;
  name: string;
  /** Shown on the cart / order when the rule applies. */
  label: string;
  minEligibleItems?: number;
  eligibleEventIds?: string[];
  eligibleCategories?: EventCategory[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  /** Upper bound on the money taken off, for percentage rules. */
  maxDiscount?: number;
  active: boolean;
  /** Lower number wins when several rules match. */
  priority?: number;
}

export const DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 'bundle-placeholder',
    name: 'Multi-event bundle',
    label: 'BUNDLE DISCOUNT',
    minEligibleItems: 2,
    discountType: 'percentage',
    discountValue: 0,
    active: false,
    priority: 10
  }
];

export interface DiscountLineInput {
  eventId: string;
  category: EventCategory;
  amount: number;
}

export interface DiscountResult {
  ruleId: string | null;
  label: string | null;
  amount: number;
}

function ruleMatches(rule: DiscountRule, lines: DiscountLineInput[]): DiscountLineInput[] | null {
  if (!rule.active) return null;

  let eligible = lines;
  if (rule.eligibleEventIds?.length) {
    eligible = eligible.filter(l => rule.eligibleEventIds!.includes(l.eventId));
  }
  if (rule.eligibleCategories?.length) {
    eligible = eligible.filter(l => rule.eligibleCategories!.includes(l.category));
  }
  if (rule.minEligibleItems && eligible.length < rule.minEligibleItems) return null;
  if (!eligible.length) return null;
  return eligible;
}

/**
 * Evaluates the active rules against a set of priced lines and returns the single
 * best discount. Always rounded down to whole rupees and clamped to the eligible
 * subtotal so a discount can never exceed what is being discounted.
 */
export function evaluateDiscount(
  lines: DiscountLineInput[],
  rules: DiscountRule[] = DISCOUNT_RULES
): DiscountResult {
  const none: DiscountResult = { ruleId: null, label: null, amount: 0 };
  if (!lines.length) return none;

  const ordered = [...rules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  let best: DiscountResult = none;

  for (const rule of ordered) {
    const eligible = ruleMatches(rule, lines);
    if (!eligible) continue;

    const eligibleSubtotal = eligible.reduce((sum, l) => sum + l.amount, 0);
    let amount =
      rule.discountType === 'percentage'
        ? Math.floor((eligibleSubtotal * rule.discountValue) / 100)
        : rule.discountValue;

    if (rule.maxDiscount !== undefined) amount = Math.min(amount, rule.maxDiscount);
    amount = Math.max(0, Math.min(amount, eligibleSubtotal));

    if (amount > best.amount) {
      best = { ruleId: rule.id, label: rule.label, amount };
    }
  }

  return best;
}
