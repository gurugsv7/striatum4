/**
 * Brochure clock times ("9 AM", "10:30 AM") as minutes past midnight, for
 * sorting and for "what is on next". Returns null for anything the brochure
 * has not published in that shape, so callers can tell "unknown" from midnight.
 */
export function minutesOf(time?: string): number | null {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10) % 12;
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  if (/pm/i.test(match[3])) hours += 12;
  return hours * 60 + mins;
}
