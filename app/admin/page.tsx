import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getDashboardCounters, listPaymentQueue } from '@/lib/queries/admin';
import { PAYMENT_TYPE_LABELS } from '@/lib/types/enums';
import { relativeTime } from '@/lib/format/relative-time';
import { feeLabel } from '@/lib/format/currency';
import { StatCard } from '@/components/admin/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { requireAdmin, FINANCE_ADMIN_EMAIL } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const [counters, queueResult] = await Promise.all([
    getDashboardCounters(),
    admin.email.toLowerCase() === FINANCE_ADMIN_EMAIL
      ? listPaymentQueue({ status: 'PENDING_REVIEW', page: 1, pageSize: 12 })
      : Promise.resolve({ rows: [], total: 0, page: 1, pageSize: 12 }),
  ]);
  const queue = queueResult.rows;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Overview</h1>
        <p className="mt-1 text-[14px] text-ice-500">Operational counters and the live review queue.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Accounts" value={counters.totalAccounts} />
        <StatCard
          label="Delegate Applications"
          value={counters.delegateApplications}
          href="/admin/delegates"
        />
        <StatCard
          label="Pending Delegate Payments"
          value={counters.pendingDelegatePayments}
          href="/admin/delegates?status=PAYMENT_UNDER_REVIEW"
          tone="warning"
        />
        <StatCard
          label="Approved Delegates"
          value={counters.approvedDelegates}
          href="/admin/delegates?status=APPROVED"
          tone="signal"
        />
        <StatCard
          label="Rejected / Resubmission"
          value={counters.rejectedOrResubmissionDelegates}
          href="/admin/delegates?status=PAYMENT_REJECTED"
          tone="danger"
        />
        <StatCard
          label="Total Event Registrations"
          value={counters.totalEventRegistrations}
          href="/admin/event-registrations"
        />
        <StatCard
          label="Pending Event Payments"
          value={counters.pendingEventPayments}
          href="/admin/payments?type=EVENT"
          tone="warning"
        />
        <StatCard
          label="Confirmed Event Registrations"
          value={counters.confirmedEventRegistrations}
          href="/admin/event-registrations?status=CONFIRMED"
          tone="signal"
        />
        <StatCard label="Checked-In Participants" value={counters.checkedInParticipants} href="/admin/checkin" />
      </div>

      {admin.email.toLowerCase() === FINANCE_ADMIN_EMAIL ? <div className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="LIVE QUEUE"
          heading="Payments needing review"
          action={
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-signal-500 hover:text-signal-400"
            >
              Open payments queue
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />

        {queue.length === 0 ? (
          <EmptyState
            title="Queue is clear."
            description="There are no payment submissions waiting for review right now."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line-100">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead className="bg-abyss-800">
                <tr>
                  <th className="border-b border-line-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500">
                    Participant
                  </th>
                  <th className="border-b border-line-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500">
                    Type
                  </th>
                  <th className="border-b border-line-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500">
                    Event
                  </th>
                  <th className="border-b border-line-100 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500">
                    Amount
                  </th>
                  <th className="border-b border-line-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500">
                    Submitted
                  </th>
                  <th className="border-b border-line-100 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {queue.map((row) => (
                  <tr key={row.id} className="border-b border-line-100 last:border-b-0 hover:bg-abyss-700/50">
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-ice-100">{row.applicantName ?? '—'}</span>
                        <span className="text-[12px] text-ice-500">{row.applicantEmail ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ice-300">{PAYMENT_TYPE_LABELS[row.payment_type]}</td>
                    <td className="px-3 py-2.5 text-ice-300">{row.eventName ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right text-ice-100">
                      {row.expected_amount_inr != null ? feeLabel(row.expected_amount_inr, true) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-ice-500">{relativeTime(row.submitted_at)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/admin/payments/${row.id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-signal-500 hover:text-signal-400"
                      >
                        Review
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {queue.length > 12 ? (
          <p className="text-[13px] text-ice-500">
            Showing 12 of {queue.length} pending submissions.{' '}
            <Link href="/admin/payments" className="text-signal-500 hover:text-signal-400">
              View all →
            </Link>
          </p>
        ) : null}
      </div> : null}
    </div>
  );
}
