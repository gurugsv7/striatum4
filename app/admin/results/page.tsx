import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/guards';
import { listEvents } from '@/lib/queries/events';
import { formatEventDate } from '@/lib/format/date';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import type { EventRow } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  await requireAdmin();
  const events = await listEvents();

  const columns: DataTableColumn<EventRow>[] = [
    { key: 'name', header: 'Event', render: (e) => <span className="font-medium text-ice-100">{e.name}</span> },
    { key: 'date', header: 'Date', render: (e) => formatEventDate(e.event_date) },
    {
      key: 'status',
      header: 'Participant visibility',
      render: (e) => <StatusChip status={e.results_status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <Link href={`/admin/results/${e.id}`} className="text-[13px] font-semibold text-signal-500 hover:text-signal-400">
          Manage results →
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Results</h1>
        <p className="mt-1 text-[14px] text-ice-500">
          Draft results are never visible to participants — only PUBLISHED results are.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events yet." description="Create an event before entering its results." />
      ) : (
        <DataTable columns={columns} rows={events} getRowId={(e) => e.id} />
      )}
    </div>
  );
}
