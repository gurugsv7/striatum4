/**
 * STRIATUM 4.0 — settings read queries.
 */
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type { AppSettingsRow, PaymentSettingsRow } from '@/lib/types/database';

export async function getAppSettings(): Promise<AppSettingsRow | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase.from('app_settings').select('*').eq('id', true).maybeSingle();
  return data ?? null;
}

export async function getActivePaymentSettings(): Promise<PaymentSettingsRow | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  return data ?? null;
}

/**
 * The effective payment config a participant sees for a given event: the
 * event's own override fields when set (payment_qr_storage_path /
 * payment_upi_id / payment_payee_name), falling back field-by-field to the
 * global active payment_settings row otherwise. The fee itself always comes
 * from events.fee_inr (an event's fee is never inherited from the global
 * delegate fee — they are different fees for different things).
 */
export interface EventPaymentConfig {
  qrStoragePath: string | null;
  upiId: string | null;
  payeeName: string | null;
  instructions: string | null;
  requireTransactionRef: boolean;
}

export async function getEventPaymentConfig(eventId: string): Promise<EventPaymentConfig | null> {
  const supabase = await createSupabaseServerComponentClient();

  const [{ data: event }, { data: global }] = await Promise.all([
    supabase
      .from('events')
      .select('payment_qr_storage_path, payment_upi_id, payment_payee_name')
      .eq('id', eventId)
      .maybeSingle(),
    supabase
      .from('payment_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (!event && !global) return null;

  return {
    qrStoragePath: event?.payment_qr_storage_path ?? global?.qr_storage_path ?? null,
    upiId: event?.payment_upi_id ?? global?.upi_id ?? null,
    payeeName: event?.payment_payee_name ?? global?.payee_name ?? null,
    instructions: global?.instructions ?? null,
    requireTransactionRef: global?.require_transaction_ref ?? false,
  };
}

export async function listActiveDelegateFormFields() {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('delegate_form_fields')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export async function listActiveEventFormFields(eventId: string) {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('event_form_fields')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return data ?? [];
}
