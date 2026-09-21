'use server';

/**
 * STRIATUM 4.0 admin — thin server-action wrapper so the client-side review
 * panel can ask "what's the next pending submission" without a full page
 * navigation through the list. getNextPendingSubmission() in
 * lib/queries/admin.ts already calls requireAdmin() itself; this action
 * gates independently too, matching the convention every server action
 * under app/admin/**\/_actions.ts follows (never rely solely on a callee to
 * enforce authorization).
 */
import { requireFinanceAdmin } from '@/lib/auth/guards';
import { getNextPendingSubmission, type PaymentQueueRow } from '@/lib/queries/admin';

export async function fetchNextPendingSubmission(afterId: string): Promise<PaymentQueueRow | null> {
  await requireFinanceAdmin();
  return getNextPendingSubmission(afterId);
}
