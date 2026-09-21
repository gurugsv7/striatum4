/**
 * STRIATUM 4.0 — date/time formatting.
 *
 * The symposium runs 13–18 OCT 2026 (see docs/00-PRODUCT.md, seeded in
 * app_settings). SYMPOSIUM_DAY_SPINE gives the six-day date spine used by
 * Programme (getProgrammeByDay) without hardcoding it more than once.
 */
import { format, parseISO } from 'date-fns';

import type { ISODate, ISOTime } from '@/lib/types/database';

export const SYMPOSIUM_DAY_SPINE: ISODate[] = [
  '2026-10-13',
  '2026-10-14',
  '2026-10-15',
  '2026-10-16',
  '2026-10-17',
  '2026-10-18',
];

/** '2026-10-14' -> '14 OCT 2026' */
export function formatEventDate(date: ISODate | null): string {
  if (!date) return 'Date not announced';
  return format(parseISO(date), 'dd MMM yyyy').toUpperCase();
}

/** '2026-10-14' -> 'Tuesday' */
export function formatDayName(date: ISODate | null): string {
  if (!date) return '';
  return format(parseISO(date), 'EEEE');
}

/** '09:00:00' -> '09:00 AM' */
export function formatTime(time: ISOTime | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(':');
  const parsed = new Date(2000, 0, 1, Number(h), Number(m ?? '0'));
  return format(parsed, 'hh:mm a');
}

/** ('09:00:00', '12:00:00') -> '09:00 AM – 12:00 PM' */
export function formatTimeRange(startTime: ISOTime | null, endTime: ISOTime | null): string {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (!start && !end) return 'Time not announced';
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? 'Time not announced';
}

/** Full datetime, e.g. for audit log / admin timestamps. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'dd MMM yyyy, hh:mm a');
}
