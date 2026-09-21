/**
 * STRIATUM 4.0 — event catalogue read queries (Explore, Programme, Event detail).
 */
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { SYMPOSIUM_DAY_SPINE } from '@/lib/format/date';
import type { EventRow, EventTypeRow, ISODate } from '@/lib/types/database';

export interface ListEventsFilters {
  search?: string;
  typeId?: string;
  eventDate?: ISODate;
  featuredOnly?: boolean;
}

export async function listEvents(filters: ListEventsFilters = {}): Promise<EventRow[]> {
  const supabase = await createSupabaseServerComponentClient();
  let query = supabase.from('events').select('*').order('sort_order', { ascending: true });

  if (filters.typeId) {
    query = query.eq('type_id', filters.typeId);
  }
  if (filters.eventDate) {
    query = query.eq('event_date', filters.eventDate);
  }
  if (filters.featuredOnly) {
    query = query.eq('is_featured', true);
  }
  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim().replace(/[%_]/g, '');
    query = query.or(`name.ilike.%${term}%,summary.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
  return data ?? null;
}

export async function getEventById(eventId: string): Promise<EventRow | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
  return data ?? null;
}

export async function listEventTypes(): Promise<EventTypeRow[]> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('event_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return data ?? [];
}

/**
 * Groups events by the six symposium days (13–18 OCT), in day order.
 * Events with no event_date are returned separately under `unscheduled`
 * rather than dropped — "not announced" is a valid state, not an error.
 */
export interface ProgrammeDay {
  date: ISODate;
  events: EventRow[];
}
export interface Programme {
  days: ProgrammeDay[];
  unscheduled: EventRow[];
}

export async function getProgrammeByDay(): Promise<Programme> {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })
    .order('sort_order', { ascending: true });

  const events = error ? [] : data ?? [];

  const byDate = new Map<string, EventRow[]>();
  const unscheduled: EventRow[] = [];

  for (const event of events) {
    if (!event.event_date) {
      unscheduled.push(event);
      continue;
    }
    const bucket = byDate.get(event.event_date) ?? [];
    bucket.push(event);
    byDate.set(event.event_date, bucket);
  }

  const days: ProgrammeDay[] = SYMPOSIUM_DAY_SPINE.map((date) => ({
    date,
    events: byDate.get(date) ?? [],
  }));

  return { days, unscheduled };
}
