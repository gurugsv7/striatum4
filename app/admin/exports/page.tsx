import { requireAdmin } from '@/lib/auth/guards';
import { listEvents } from '@/lib/queries/events';
import { ExportCard } from '@/components/admin/ExportCard';
import { EventExportCard } from '@/components/admin/EventExportCard';

export const dynamic = 'force-dynamic';

export default async function AdminExportsPage() {
  await requireAdmin();
  const events = await listEvents();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Exports</h1>
        <p className="mt-1 text-[14px] text-ice-500">
          Normalized CSV downloads — real column headers, ISO timestamps, no UI formatting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ExportCard title="All Delegates" description="Every delegate application on file." type="all-delegates" />
        <ExportCard title="Approved Delegates" description="Applications with an issued Delegate ID." type="approved-delegates" />
        <ExportCard title="Pending Payments" description="Delegate and event submissions awaiting review." type="pending-payments" />
        <ExportCard title="All Event Registrations" description="Every registration across every event." type="all-registrations" />
        <ExportCard title="Check-In / Attendance" description="Every successful QR redemption." type="checkins" />
        <ExportCard title="Published Results" description="Only results currently visible to participants." type="published-results" />
      </div>

      <EventExportCard events={events} />
    </div>
  );
}
