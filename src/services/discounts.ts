import { EventCategory } from '../data/eventTypes.ts';
import { COMBO_OFFERS, COMBO_DEADLINE_UTC, comboSavings, comboTitle } from '../data/combos.ts';

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
  /** Minimum total team entries across the eligible lines. */
  minQuantity?: number;
  /** Offer window, as epoch milliseconds. Mirrors starts_at / ends_at in SQL. */
  startsAt?: number;
  endsAt?: number;
  active: boolean;
  /** Lower number wins when several rules match. */
  priority?: number;
}

/**
 * Combo offers as discount rules.
 *
 * Projected from the combo catalogue so this list, the Combos page and the
 * seeded public.discount_rules rows all describe the same offers. The server
 * still decides the money; this mirror exists so the cart can show the discount
 * before checkout instead of surprising the delegate at the total.
 */
const COMBO_RULES: DiscountRule[] = COMBO_OFFERS.map(combo => ({
  id: combo.id,
  name: comboTitle(combo),
  label: 'COMBO · ' + comboTitle(combo),
  eligibleEventIds: combo.eventIds,
  minEligibleItems: combo.eventIds.length,
  minQuantity: combo.teamsPerEvent > 1 ? combo.teamsPerEvent : undefined,
  discountType: 'fixed' as const,
  discountValue: comboSavings(combo),
  endsAt: COMBO_DEADLINE_UTC,
  active: true,
  // Bulk packs are checked before pair combos so the larger saving is reached
  // first; evaluateDiscount still keeps whichever is worth most.
  priority: combo.teamsPerEvent > 1 ? 10 : 20
}));

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

/** Every rule the cart evaluates: the configurable rules plus the combos. */
export const ALL_DISCOUNT_RULES: DiscountRule[] = [...DISCOUNT_RULES, ...COMBO_RULES];

export interface DiscountLineInput {
  eventId: string;
  category: EventCategory;
  /** Unit price. The line total is amount x quantity. */
  amount: number;
  /** Team entries bought on this line. 1 for an individual place. */
  quantity?: number;
}

export interface DiscountResult {
  ruleId: string | null;
  label: string | null;
  amount: number;
}

function unitsOf(line: DiscountLineInput): number {
  return line.quantity ?? 1;
}

function ruleMatches(
  rule: DiscountRule,
  lines: DiscountLineInput[],
  now: number
): DiscountLineInput[] | null {
  if (!rule.active) return null;
  // Combos close at a published date; an expired offer must never still apply.
  if (rule.endsAt !== undefined && now > rule.endsAt) return null;
  if (rule.startsAt !== undefined && now < rule.startsAt) return null;

  let eligible = lines;
  if (rule.eligibleEventIds?.length) {
    eligible = eligible.filter(l => rule.eligibleEventIds!.includes(l.eventId));
  }
  if (rule.eligibleCategories?.length) {
    eligible = eligible.filter(l => rule.eligibleCategories!.includes(l.category));
  }
  if (!eligible.length) return null;
  if (rule.minEligibleItems && eligible.length < rule.minEligibleItems) return null;
  if (rule.minQuantity) {
    const units = eligible.reduce((sum, line) => sum + unitsOf(line), 0);
    if (units < rule.minQuantity) return null;
  }
  return eligible;
}

/**
 * Evaluates the active rules against a set of priced lines and returns the single
 * best discount. Always rounded down to whole rupees and clamped to the eligible
 * subtotal so a discount can never exceed what is being discounted.
 */
export function evaluateDiscount(
  lines: DiscountLineInput[],
  rules: DiscountRule[] = ALL_DISCOUNT_RULES,
  now: number = Date.now()
): DiscountResult {
  const none: DiscountResult = { ruleId: null, label: null, amount: 0 };
  if (!lines.length) return none;

  const ordered = [...rules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  let best: DiscountResult = none;

  for (const rule of ordered) {
    const eligible = ruleMatches(rule, lines, now);
    if (!eligible) continue;

    const eligibleSubtotal = eligible.reduce((sum, l) => sum + l.amount * unitsOf(l), 0);
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
