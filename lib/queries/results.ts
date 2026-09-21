/**
 * STRIATUM 4.0 — participant-facing results read queries.
 *
 * HARD RULE: these must never return a DRAFT result row, enforced here at
 * the query layer (explicit .eq('status', 'PUBLISHED')) in addition to RLS
 * — belt and suspenders, per the "draft results are unreachable by
 * participants at the query layer, not just the UI" requirement. Admin
 * result queries (which do need DRAFT rows) live in lib/queries/admin.ts
 * using the service-role client, never this module.
 */
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type { EventRow, ResultEntryRow, ResultRow } from '@/lib/types/database';

export interface PublishedResult extends ResultRow {
  event: EventRow | null;
  entries: ResultEntryRow[];
}

export async function listPublishedResults(): Promise<PublishedResult[]> {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('results')
    .select('*, event:events(*), entries:result_entries(*)')
    .eq('status', 'PUBLISHED')
    .order('published_at', { ascending: false })
    .order('sort_order', { referencedTable: 'result_entries', ascending: true });

  if (error || !data) return [];
  return data as unknown as PublishedResult[];
}

export async function getPublishedResultForEvent(eventId: string): Promise<PublishedResult | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('results')
    .select('*, event:events(*), entries:result_entries(*)')
    .eq('event_id', eventId)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PublishedResult;
}
