/**
 * STRIATUM 4.0 — event registration read queries.
 */
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type { EventRegistrationRow, EventRow, QrCredentialRow } from '@/lib/types/database';

export interface RegistrationWithEvent extends EventRegistrationRow {
  event: EventRow | null;
}

export async function listMyRegistrations(userId: string): Promise<RegistrationWithEvent[]> {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, event:events(*)')
    .eq('user_id', userId)
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as unknown as RegistrationWithEvent[];
}

export interface RegistrationWithPass extends EventRegistrationRow {
  event: EventRow | null;
  qrCredential: QrCredentialRow | null;
}

export async function getRegistrationWithPass(
  registrationId: string,
  userId: string
): Promise<RegistrationWithPass | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, event:events(*), qrCredential:qr_credentials(*)')
    .eq('id', registrationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as RegistrationWithPass;
}

/** Does this delegate already have a non-cancelled registration for this event? */
export async function hasRegistered(eventId: string, delegateId: string): Promise<boolean> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('delegate_id', delegateId)
    .neq('status', 'CANCELLED')
    .maybeSingle();
  return !!data;
}

/**
 * Remaining capacity for an event, or null when the event has no capacity
 * cap (unlimited) or capacity is not yet announced. Counts registrations in
 * CONFIRMED or PENDING_APPROVAL — mirrors the counting rule used inside
 * confirm_free_event_registration() so the UI never shows a number the DB
 * function would disagree with.
 */
export async function getRemainingCapacity(eventId: string): Promise<number | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data: event } = await supabase
    .from('events')
    .select('capacity')
    .eq('id', eventId)
    .maybeSingle();

  if (!event || event.capacity == null) return null;

  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['CONFIRMED', 'PENDING_APPROVAL']);

  return Math.max(0, event.capacity - (count ?? 0));
}
