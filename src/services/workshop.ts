import { SymposiumEvent } from '../data/eventTypes.ts';

export type LunchChoice = 'veg' | 'non_veg';

/** Full-day workshops are the sessions whose published window includes lunch. */
export function isFullDayWorkshop(event: SymposiumEvent): boolean {
  if (event.category !== 'workshop' || !event.startTime || !event.endTime) return false;
  const toMinutes = (value: string): number | null => {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === 'PM') hour += 12;
    return hour * 60 + Number(match[2]);
  };
  const start = toMinutes(event.startTime);
  const end = toMinutes(event.endTime);
  return start !== null && end !== null && end - start >= 7 * 60;
}
