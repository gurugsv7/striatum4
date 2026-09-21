import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getDelegateApplicationById } from '@/lib/queries/admin';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format/date';
import { formatInr } from '@/lib/format/currency';
import { Panel } from '@/components/ui/Panel';
import { StatusChip } from '@/components/ui/StatusChip';
import { ScreenshotViewer } from '@/components/admin/ScreenshotViewer';
import { CopyableId } from '@/components/admin/CopyableId';
import { DelegateReviewActions } from '@/components/admin/DelegateReviewActions';

export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line-100 py-2.5 last:border-b-0">
      <span className="text-[13px] text-ice-500">{label}</span>
      <span className="text-[14px] text-ice-100">{value}</span>
    </div>
  );
}

export default async function AdminDelegateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getDelegateApplicationById(id);
  if (!application) notFound();

  const supabase = await createSupabaseServerComponentClient();

  const [{ data: fields }, { data: submissions }, { data: delegate }] = await Promise.all([
    supabase.from('delegate_form_fields').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase
      .from('payment_submissions')
      .select('*')
      .eq('delegate_application_id', id)
      .eq('payment_type', 'DELEGATE')
      .order('submitted_at', { ascending: false }),
    supabase.from('delegates').select('*').eq('application_id', id).maybeSingle(),
  ]);

  const latestSubmission = submissions?.[0] ?? null;
  const canReview =
    !delegate && latestSubmission && ['PENDING_REVIEW', 'NEEDS_RESUBMISSION'].includes(latestSubmission.status);

  const extra = (application.extra ?? {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/delegates"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-ice-500 hover:text-ice-100"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to delegate applications
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-[26px] text-ice-100">{application.full_name}</h1>
            <p className="mt-1 flex items-center gap-2 text-[13px] text-ice-500">
              Application <CopyableId value={application.id} truncateTo={12} />
            </p>
          </div>
          <StatusChip status={application.status} />
        </div>
      </div>

      {delegate ? (
        <Panel className="border-signal-500/40 bg-signal-500/5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-signal-400">
            Delegate active
          </p>
          <p className="mt-1 font-mono text-[22px] text-ice-100">{delegate.delegate_id}</p>
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="flex flex-col gap-1">
          <h2 className="mb-2 font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">
            Personal Information
          </h2>
          <Row label="Full name" value={application.full_name} />
          <Row label="Email" value={application.email} />
          <Row label="Mobile" value={application.mobile} />
        </Panel>

        <Panel className="flex flex-col gap-1">
          <h2 className="mb-2 font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">
            Academic Information
          </h2>
          <Row label="College / Institution" value={application.college} />
          <Row label="Year of study" value={application.year_of_study} />
          <Row label="Student ID" value={application.student_id ?? '—'} />
          {(fields ?? [])
            .filter((f) => !['full_name', 'email', 'mobile', 'college', 'year_of_study', 'student_id'].includes(f.key))
            .map((f) => (
              <Row
                key={f.id}
                label={f.label}
                value={extra[f.key] != null && extra[f.key] !== '' ? String(extra[f.key]) : '—'}
              />
            ))}
        </Panel>

        <Panel className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Payment</h2>
          {latestSubmission ? (
            <>
              <div className="flex flex-col divide-y divide-line-100">
                <Row
                  label="Expected amount"
                  value={
                    latestSubmission.expected_amount_inr != null
                      ? formatInr(latestSubmission.expected_amount_inr)
                      : 'Not set'
                  }
                />
                <Row label="Transaction reference" value={latestSubmission.transaction_reference ?? '—'} />
                <Row label="Submitted at" value={formatDateTime(latestSubmission.submitted_at)} />
                <Row label="Status" value={<StatusChip status={latestSubmission.status} />} />
                {latestSubmission.rejection_reason ? (
                  <Row label="Rejection reason" value={latestSubmission.rejection_reason} />
                ) : null}
                {latestSubmission.admin_note ? <Row label="Admin note" value={latestSubmission.admin_note} /> : null}
              </div>

              <ScreenshotViewer submissionId={latestSubmission.id} label={`${application.full_name} — payment screenshot`} />

              {canReview ? (
                <div className="mt-2 border-t border-line-100 pt-4">
                  <DelegateReviewActions submissionId={latestSubmission.id} />
                </div>
              ) : delegate ? null : (
                <p className="text-[13px] text-ice-500">
                  This submission has already been reviewed ({latestSubmission.status.toLowerCase().replace(/_/g, ' ')}
                  ).
                </p>
              )}
            </>
          ) : (
            <p className="text-[14px] text-ice-500">No payment proof has been submitted yet.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
