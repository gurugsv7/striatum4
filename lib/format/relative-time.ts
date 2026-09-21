/**
 * STRIATUM 4.0 — relative time formatting for admin queues.
 */
import { formatDistanceToNow } from 'date-fns';

/** ISO timestamp -> "3 minutes ago" / "2 days ago". */
export function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
