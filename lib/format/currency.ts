/**
 * STRIATUM 4.0 — currency formatting.
 *
 * Never renders ₹0 or an invented number for an unset fee — feeLabel()
 * returns a designed "Fee not announced" string instead, per
 * docs/00-PRODUCT.md §0 ("invent nothing").
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Formats a known integer rupee amount, e.g. 1500 -> "₹1,500". */
export function formatInr(amountInr: number): string {
  return INR_FORMATTER.format(amountInr);
}

/**
 * Renders a fee that may be null (not yet announced by the organizers) or
 * a known amount, or explicitly free (0 or amountInr === 0 with isPaid
 * false is a distinct, valid "Free" state — pass isPaid to disambiguate).
 */
export function feeLabel(amountInr: number | null, isPaid: boolean): string {
  if (!isPaid) return 'Free';
  if (amountInr == null) return 'Fee not announced';
  return formatInr(amountInr);
}
