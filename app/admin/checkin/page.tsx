import { requireAdmin } from '@/lib/auth/guards';
import { listEvents } from '@/lib/queries/events';
import { ScannerPanel } from '@/components/admin/ScannerPanel';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function AdminCheckinPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'SCANNER']);
  const events = await listEvents();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Check-In</h1>
        <p className="mt-1 text-[14px] text-ice-500">Scan or paste an event pass to redeem it at the venue.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events to scan for yet."
          description="Create an event first — check-in needs an event to redeem passes against."
        />
      ) : (
        <ScannerPanel events={events} />
      )}
    </div>
  );
}
