import Link from 'next/link';
import { listPaymentQueue } from '@/lib/queries/admin';
import { requireFinanceAdmin } from '@/lib/auth/guards';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type { PaymentSubmissionStatus, PaymentType } from '@/lib/types/enums';
import { PAYMENT_TYPE_LABELS } from '@/lib/types/enums';
import { formatDateTime } from '@/lib/format/date';
import { formatInr } from '@/lib/format/currency';
import { cn } from '@/lib/utils/cn';
import { StatusChip } from '@/components/ui/StatusChip';
import { ScreenshotViewer } from '@/components/admin/ScreenshotViewer';
import { CopyableId } from '@/components/admin/CopyableId';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';

export const dynamic = 'force-dynamic';

const TYPE_TABS: { value: string; label: string; type?: PaymentType }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DELEGATE', label: 'Delegate', type: 'DELEGATE' },
  { value: 'EVENT', label: 'Event', type: 'EVENT' },
];

const STATUS_TABS: { value: string; label: string; status: PaymentSubmissionStatus }[] = [
  { value: 'PENDING_REVIEW', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved', status: 'APPROVED' },
  { value: 'REJECTED', label: 'Rejected', status: 'REJECTED' },
  { value: 'NEEDS_RESUBMISSION', label: 'Needs Resubmission', status: 'NEEDS_RESUBMISSION' },
].map((t) => ({ ...t, status: (t.status ?? 'PENDING_REVIEW') as PaymentSubmissionStatus }));

interface PaymentQueueTableRow {
  id: string;
  applicantName: string | null;
  applicantEmail: string | null;
  paymentType: PaymentType;
  eventName: string | null;
  expectedAmountInr: number | null;
  transactionReference: string | null;
  submittedAt: string;
  status: string;
  delegateId: string | null;
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'relative flex h-9 items-center px-3 text-[13px] font-medium transition-colors',
        active ? 'text-ice-100' : 'text-ice-500 hover:text-ice-300'
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-signal-500" /> : null}
    </Link>
  );
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireFinanceAdmin();
  const sp = await searchParams;
  const type = typeof sp.type === 'string' ? sp.type : 'ALL';
  const status = typeof sp.status === 'string' ? sp.status : 'PENDING_REVIEW';
  const page = typeof sp.page === 'string' ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;
  const pageSize = 25;

  const typeTab = TYPE_TABS.find((t) => t.value === type) ?? TYPE_TABS[0];
  const statusTab = STATUS_TABS.find((t) => t.value === status) ?? STATUS_TABS[0];

  const { rows, total } = await listPaymentQueue({
    paymentType: typeTab.type,
    status: statusTab.status,
    page,
    pageSize,
  });

  // Enrich with Delegate ID — DELEGATE submissions via delegates.application_id,
  // EVENT submissions via event_registrations.delegate_id -> delegates.id.
  const supabase = await createSupabaseServerComponentClient();
  const delegateAppIds = rows.filter((r) => r.delegate_application_id).map((r) => r.delegate_application_id!);
  const eventRegIds = rows.filter((r) => r.event_registration_id).map((r) => r.event_registration_id!);

  const delegateIdByAppId = new Map<string, string>();
  const delegateIdByRegId = new Map<string, string>();

  if (delegateAppIds.length > 0) {
    const { data } = await supabase
      .from('delegates')
      .select('application_id, delegate_id')
      .in('application_id', delegateAppIds);
    for (const d of data ?? []) delegateIdByAppId.set(d.application_id, d.delegate_id);
  }
  if (eventRegIds.length > 0) {
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('id, delegate_id')
      .in('id', eventRegIds);
    const delegateRowIds = (regs ?? []).map((r) => r.delegate_id);
    if (delegateRowIds.length > 0) {
      const { data: delegates } = await supabase.from('delegates').select('id, delegate_id').in('id', delegateRowIds);
      const delegateById = new Map((delegates ?? []).map((d) => [d.id, d.delegate_id]));
      for (const r of regs ?? []) {
        const did = delegateById.get(r.delegate_id);
        if (did) delegateIdByRegId.set(r.id, did);
      }
    }
  }

  const tableRows: PaymentQueueTableRow[] = rows.map((row) => ({
    id: row.id,
    applicantName: row.applicantName,
    applicantEmail: row.applicantEmail,
    paymentType: row.payment_type,
    eventName: row.eventName,
    expectedAmountInr: row.expected_amount_inr,
    transactionReference: row.transaction_reference,
    submittedAt: row.submitted_at,
    status: row.status,
    delegateId:
      (row.delegate_application_id && delegateIdByAppId.get(row.delegate_application_id)) ||
      (row.event_registration_id && delegateIdByRegId.get(row.event_registration_id)) ||
      null,
  }));

  const buildHref = (params: { type?: string; status?: string }) => {
    const usp = new URLSearchParams();
    const t = params.type ?? type;
    const s = params.status ?? status;
    if (t !== 'ALL') usp.set('type', t);
    if (s !== 'PENDING_REVIEW') usp.set('status', s);
    const qs = usp.toString();
    return qs ? `/admin/payments?${qs}` : '/admin/payments';
  };

  const columns: DataTableColumn<PaymentQueueTableRow>[] = [
    {
      key: 'participant',
      header: 'Participant',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-ice-100">{r.applicantName ?? '—'}</span>
          <span className="text-[12px] text-ice-500">{r.applicantEmail ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'delegateId',
      header: 'Delegate ID',
      render: (r) => (r.delegateId ? <CopyableId value={r.delegateId} /> : '—'),
    },
    { key: 'type', header: 'Type', render: (r) => PAYMENT_TYPE_LABELS[r.paymentType] },
    { key: 'event', header: 'Event', render: (r) => r.eventName ?? '—' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => (r.expectedAmountInr != null ? formatInr(r.expectedAmountInr) : '—'),
    },
    { key: 'txnRef', header: 'Txn Ref', render: (r) => r.transactionReference ?? '—' },
    { key: 'submitted', header: 'Submitted', render: (r) => formatDateTime(r.submittedAt) },
    {
      key: 'screenshot',
      header: 'Screenshot',
      render: (r) => <ScreenshotViewer submissionId={r.id} variant="thumbnail" label={`${r.applicantName ?? 'Screenshot'}`} />,
    },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Link href={`/admin/payments/${r.id}`} className="text-[13px] font-semibold text-signal-500 hover:text-signal-400">
          Review →
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-[28px] text-ice-100">Payments</h1>
          <p className="mt-1 text-[14px] text-ice-500">
            {total} submission{total === 1 ? '' : 's'} in this view.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div role="tablist" className="flex items-center gap-1 border-b border-line-100">
          {TYPE_TABS.map((t) => (
            <TabLink key={t.value} href={buildHref({ type: t.value })} active={t.value === type}>
              {t.label}
            </TabLink>
          ))}
        </div>
        <div role="tablist" className="flex flex-wrap items-center gap-1">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.value}
              href={buildHref({ status: t.value })}
              className={cn(
                'inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-medium transition-colors',
                t.value === status
                  ? 'border-signal-500 bg-signal-500/10 text-signal-400'
                  : 'border-line-200 text-ice-500 hover:text-ice-300'
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={tableRows}
        getRowId={(r) => r.id}
        basePath="/admin/payments"
        baseParams={{ type: type === 'ALL' ? undefined : type, status: status === 'PENDING_REVIEW' ? undefined : status }}
        page={page}
        pageSize={pageSize}
        total={total}
        emptyTitle="No submissions in this view."
        emptyDescription="Payment submissions will appear here as participants upload proof of payment."
      />
    </div>
  );
}
