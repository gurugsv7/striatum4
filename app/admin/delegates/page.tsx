import Link from 'next/link';
import { listDelegateApplications } from '@/lib/queries/admin';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type { DelegateApplicationStatus } from '@/lib/types/enums';
import { formatEventDate } from '@/lib/format/date';
import { formatInr } from '@/lib/format/currency';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { CopyableId } from '@/components/admin/CopyableId';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

const TABS: { value: string; label: string; status?: DelegateApplicationStatus }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PAYMENT_UNDER_REVIEW', label: 'Pending Review', status: 'PAYMENT_UNDER_REVIEW' },
  { value: 'APPROVED', label: 'Approved', status: 'APPROVED' },
  { value: 'PAYMENT_REJECTED', label: 'Rejected', status: 'PAYMENT_REJECTED' },
  { value: 'NEEDS_RESUBMISSION', label: 'Needs Resubmission', status: 'PAYMENT_REJECTED' },
];

interface DelegateRowExtra {
  applicationId: string;
  fullName: string;
  email: string;
  mobile: string;
  college: string;
  yearOfStudy: string;
  studentId: string | null;
  submittedAt: string | null;
  status: string;
  expectedAmountInr: number | null;
  paymentStatus: string | null;
  delegateId: string | null;
}

export default async function AdminDelegatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tab = typeof sp.status === 'string' ? sp.status : 'ALL';
  const search = typeof sp.q === 'string' ? sp.q : undefined;
  const page = typeof sp.page === 'string' ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;
  const pageSize = 25;

  const activeTab = TABS.find((t) => t.value === tab) ?? TABS[0];

  const { rows, total } = await listDelegateApplications({
    page,
    pageSize,
    status: activeTab.status,
    paymentSubmissionStatus: activeTab.value === 'NEEDS_RESUBMISSION' ? 'NEEDS_RESUBMISSION' : undefined,
    search,
  });

  // Enrich with delegate id + latest DELEGATE payment submission — the
  // paginated query layer only returns the bare application rows.
  const supabase = await createSupabaseServerComponentClient();
  const appIds = rows.map((r) => r.id);

  let delegateByAppId = new Map<string, string>();
  const submissionByAppId = new Map<
    string,
    { expected_amount_inr: number | null; status: string; submitted_at: string; transaction_reference: string | null }
  >();

  if (appIds.length > 0) {
    const [{ data: delegates }, { data: submissions }] = await Promise.all([
      supabase.from('delegates').select('application_id, delegate_id').in('application_id', appIds),
      supabase
        .from('payment_submissions')
        .select('delegate_application_id, expected_amount_inr, status, submitted_at, transaction_reference')
        .eq('payment_type', 'DELEGATE')
        .in('delegate_application_id', appIds)
        .order('submitted_at', { ascending: false }),
    ]);

    delegateByAppId = new Map((delegates ?? []).map((d) => [d.application_id, d.delegate_id]));
    for (const s of submissions ?? []) {
      if (!s.delegate_application_id) continue;
      if (!submissionByAppId.has(s.delegate_application_id)) {
        submissionByAppId.set(s.delegate_application_id, {
          expected_amount_inr: s.expected_amount_inr,
          status: s.status,
          submitted_at: s.submitted_at,
          transaction_reference: s.transaction_reference,
        });
      }
    }
  }

  const tableRows: DelegateRowExtra[] = rows.map((r) => {
    const sub = submissionByAppId.get(r.id);
    return {
      applicationId: r.id,
      fullName: r.full_name,
      email: r.email,
      mobile: r.mobile,
      college: r.college,
      yearOfStudy: r.year_of_study,
      studentId: r.student_id,
      submittedAt: r.submitted_at,
      status: r.status,
      expectedAmountInr: sub?.expected_amount_inr ?? null,
      paymentStatus: sub?.status ?? null,
      delegateId: delegateByAppId.get(r.id) ?? null,
    };
  });

  const columns: DataTableColumn<DelegateRowExtra>[] = [
    {
      key: 'id',
      header: 'Application ID',
      render: (r) => <CopyableId value={r.applicationId} truncateTo={8} />,
    },
    { key: 'name', header: 'Participant', render: (r) => <span className="font-medium">{r.fullName}</span> },
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'mobile', header: 'Mobile', render: (r) => r.mobile },
    { key: 'college', header: 'College', render: (r) => r.college },
    { key: 'year', header: 'Year', render: (r) => r.yearOfStudy },
    { key: 'studentId', header: 'Student ID', render: (r) => r.studentId ?? '—' },
    { key: 'submitted', header: 'Submitted', render: (r) => (r.submittedAt ? formatEventDate(r.submittedAt.slice(0, 10)) : '—') },
    {
      key: 'amount',
      header: 'Expected Amount',
      align: 'right',
      render: (r) => (r.expectedAmountInr != null ? formatInr(r.expectedAmountInr) : '—'),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      render: (r) => (r.paymentStatus ? <StatusChip status={r.paymentStatus} /> : <span className="text-ice-700">—</span>),
    },
    { key: 'status', header: 'Delegate Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'delegateId',
      header: 'Delegate ID',
      render: (r) => (r.delegateId ? <CopyableId value={r.delegateId} /> : <span className="text-ice-700">—</span>),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Link
          href={`/admin/delegates/${r.applicationId}`}
          className="text-[13px] font-semibold text-signal-500 hover:text-signal-400"
        >
          Review →
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Delegate Applications</h1>
        <p className="mt-1 text-[14px] text-ice-500">
          {total} application{total === 1 ? '' : 's'} on file.
        </p>
      </div>

      <FilterBar
        tabParam="status"
        tabs={TABS.map((t) => ({ value: t.value, label: t.label }))}
        searchParam="q"
        searchPlaceholder="Search name, email, mobile, college…"
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No delegate applications yet."
          description="Applications will appear here once participants start registering as delegates."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={tableRows}
          getRowId={(r) => r.applicationId}
          basePath="/admin/delegates"
          baseParams={{ status: tab === 'ALL' ? undefined : tab, q: search }}
          page={page}
          pageSize={pageSize}
          total={total}
        />
      )}
    </div>
  );
}
