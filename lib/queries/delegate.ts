/**
 * STRIATUM 4.0 — delegate application read queries.
 */
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type { DelegateApplicationRow, DelegateRow, PaymentSubmissionRow } from '@/lib/types/database';

export async function getDelegateApplication(userId: string): Promise<DelegateApplicationRow | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('delegate_applications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data ?? null;
}

export async function getDelegate(userId: string): Promise<DelegateRow | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase.from('delegates').select('*').eq('user_id', userId).maybeSingle();
  return data ?? null;
}

/**
 * The most recent payment_submissions row for this user's delegate
 * application (there may be several across reject/resubmit cycles —
 * "latest" is by submitted_at desc).
 */
export async function getLatestPaymentSubmission(
  userId: string
): Promise<PaymentSubmissionRow | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('payment_type', 'DELEGATE')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
