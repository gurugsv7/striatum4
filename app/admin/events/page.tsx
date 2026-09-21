import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { listEvents, listEventTypes } from '@/lib/queries/events';
import { formatEventDate } from '@/lib/format/date';
import { feeLabel } from '@/lib/format/currency';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { RegistrationOpenToggle } from '@/components/admin/RegistrationOpenToggle';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import type { EventRow } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  await requireAdmin();
  const [events, types] = await Promise.all([listEvents(), listEventTypes()]);
  const typeById = new Map(types.map((t) => [t.id, t.label]));

  const columns: DataTableColumn<EventRow>[] = [
    {
      key: 'name',
      header: 'Event',
      render: (e) => (
        <div className="flex flex-col">
          <span className="font-medium text-ice-100">{e.name}</span>
          <span className="text-[12px] text-ice-500">{e.slug}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (e) => (e.type_id ? typeById.get(e.type_id) ?? '—' : '—') },
    { key: 'date', header: 'Date', render: (e) => formatEventDate(e.event_date) },
    { key: 'format', header: 'Format', render: (e) => (e.format === 'TEAM' ? 'Team' : 'Individual') },
    { key: 'fee', header: 'Fee', render: (e) => feeLabel(e.fee_inr, e.is_paid) },
    { key: 'capacity', header: 'Capacity', render: (e) => e.capacity ?? 'Unlimited' },
    {
      key: 'featured',
      header: 'Featured',
      render: (e) => (e.is_featured ? <Chip selected>Featured</Chip> : <span className="text-ice-700">—</span>),
    },
    {
      key: 'registration',
      header: 'Registration',
      render: (e) => <RegistrationOpenToggle eventId={e.id} open={e.registration_open} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <Link href={`/admin/events/${e.id}`} className="text-[13px] font-semibold text-signal-500 hover:text-signal-400">
          Edit →
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-[28px] text-ice-100">Events</h1>
          <p className="mt-1 text-[14px] text-ice-500">{events.length} events in the programme catalogue.</p>
        </div>
        <Link href="/admin/events/new">
          <Button type="button" variant="primary" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            New event
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={events}
        getRowId={(e) => e.id}
        emptyTitle="No events yet."
        emptyDescription="Create the first event in the programme catalogue to get started."
        emptyAction={
          <Link href="/admin/events/new">
            <Button type="button" variant="primary" size="sm">
              New event
            </Button>
          </Link>
        }
      />
    </div>
  );
}
