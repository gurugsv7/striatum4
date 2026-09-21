import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireFinanceAdmin } from '@/lib/auth/guards';
import { listPaymentQueue } from '@/lib/queries/admin';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { getSignedScreenshotUrl } from '@/lib/actions/storage';
import { StatusChip } from '@/components/ui/StatusChip';
import { ScreenshotViewer } from '@/components/admin/ScreenshotViewer';
import { PaymentReviewPanel } from '@/components/admin/PaymentReviewPanel';
import { formatDateTime } from '@/lib/format/date';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFinanceAdmin();
  const { id } = await params;

  const supabase = await createSupabaseServerComponentClient();
  const { data: submission } = await supabase
    .from('payment_submissions')
    .select(
      '*, delegate_application:delegate_applications(full_name, email), event_registration:event_registrations(delegate_id, event:events(name))'
    )
    .eq('id', id)
    .maybeSingle();

  if (!submission) notFound();

  const sub = submission as unknown as {
    id: string;
    payment_type: 'DELEGATE' | 'EVENT';
    status: string;
    expected_amount_inr: number | null;
    transaction_reference: string | null;
    submitted_at: string;
    delegate_application: { full_name: string; email: string } | null;
    event_registration: { delegate_id: string; event: { name: string } | null } | null;
  };

  let delegateId: string | null = null;
  let applicantName = sub.delegate_application?.full_name ?? null;
  let applicantEmail = sub.delegate_application?.email ?? null;

  if (sub.payment_type === 'DELEGATE') {
    const { data: delegate } = await supabase
      .from('delegates')
      .select('delegate_id')
      .eq('application_id', id)
      .maybeSingle();
    delegateId = delegate?.delegate_id ?? null;
  } else if (sub.event_registration) {
    const { data: delegate } = await supabase
      .from('delegates')
      .select('delegate_id, user_id')
      .eq('id', sub.event_registration.delegate_id)
      .maybeSingle();
    delegateId = delegate?.delegate_id ?? null;
    if (delegate?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', delegate.user_id)
        .maybeSingle();
      applicantName = profile?.full_name ?? applicantName;
      applicantEmail = profile?.email ?? applicantEmail;
    }
  }

  const isPending = sub.status === 'PENDING_REVIEW' || sub.status === 'NEEDS_RESUBMISSION';

  if (!isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/payments" className="text-[13px] text-ice-500 hover:text-ice-100">
          ← Back to queue
        </Link>
        <div className="rounded-lg border border-line-100 bg-abyss-700 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="font-serif text-[22px] text-ice-100">{applicantName ?? 'Submission'}</h1>
            <StatusChip status={sub.status} />
          </div>
          <p className="text-[14px] text-ice-500">
            This submission was already reviewed
            {sub.status === 'APPROVED' ? ' and approved' : sub.status === 'REJECTED' ? ' and rejected' : ''} at{' '}
            {formatDateTime(sub.submitted_at)}. No further action is needed here.
          </p>
          <div className="mt-4">
            <ScreenshotViewer submissionId={sub.id} label={`${applicantName ?? 'Participant'} — payment screenshot`} />
          </div>
        </div>
      </div>
    );
  }

  const [remaining, signedUrlResult] = await Promise.all([
    listPaymentQueue({ status: 'PENDING_REVIEW', page: 1, pageSize: 1 }),
    getSignedScreenshotUrl(id),
  ]);

  return (
    <PaymentReviewPanel
      submission={{
        id: sub.id,
        paymentType: sub.payment_type,
        applicantName,
        applicantEmail,
        eventName: sub.event_registration?.event?.name ?? null,
        delegateId,
        expectedAmountInr: sub.expected_amount_inr,
        transactionReference: sub.transaction_reference,
        submittedAt: sub.submitted_at,
        status: sub.status,
      }}
      screenshotUrl={signedUrlResult.ok ? signedUrlResult.data : null}
      screenshotError={signedUrlResult.ok ? null : signedUrlResult.error}
      remainingCount={remaining.total}
    />
  );
}
