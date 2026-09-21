'use server';

/**
 * STRIATUM 4.0 — private storage access (signed URLs).
 *
 * See docs/03-ARCHITECTURE.md §6. Signed URLs are minted server-side only,
 * after an explicit admin-or-owner check, using the service-role client —
 * never a public URL, ~60s TTL, never cached/persisted.
 */
import { getOptionalUser, requireFinanceAdmin } from '@/lib/auth/guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * Mints a ~60s signed URL for a payment_submissions screenshot. Allowed for
 * an admin (any submission) or the owning participant (their own
 * submission only). Never returns a public URL — the bucket has none.
 */
export async function getSignedScreenshotUrl(submissionId: string): Promise<ActionResult<string>> {
  const supabase = await createSupabaseServerClient();

  const { data: submission } = await supabase
    .from('payment_submissions')
    .select('id, user_id, screenshot_storage_path')
    .eq('id', submissionId)
    .maybeSingle();

  if (!submission) {
    return { ok: false, error: 'Submission not found.', code: 'NOT_FOUND' };
  }

  const user = await getOptionalUser();
  const isOwner = !!user && user.id === submission.user_id;

  if (!isOwner) {
    try {
      await requireFinanceAdmin();
    } catch {
      return { ok: false, error: 'Not authorized to view this screenshot.', code: 'NOT_AUTHORIZED' };
    }
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from('payment-screenshots')
    .createSignedUrl(submission.screenshot_storage_path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Could not create signed URL.', code: 'SIGN_FAILED' };
  }

  return { ok: true, data: data.signedUrl };
}
