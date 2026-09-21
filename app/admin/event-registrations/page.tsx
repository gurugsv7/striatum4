import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/guards';
import { listEventRegistrations } from '@/lib/queries/admin';
import { listEvents } from '@/lib/queries/events';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { FilterBar } from '@/components/admin/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { RegistrationRow } from '@/components/admin/RegistrationRow';
import { cn } from '@/lib/utils/cn';

export const dynamic = 'force-dynamic';

export default async function AdminEventRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const eventId = typeof sp.event === 'string' && sp.event ? sp.event : undefined;
  const status = typeof sp.status === 'string' && sp.status ? sp.status : undefined;
  const page = typeof sp.page === 'string' ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;
  const pageSize = 50;

  const [{ rows, total }, events] = await Promise.all([
    listEventRegistrations({ eventId, status: status as never, page, pageSize }),
    listEvents(),
  ]);

  const supabase = await createSupabaseServerComponentClient();

  const delegateIds = [...new Set(rows.map((r) => r.delegate_id))];
  const registrationIds = rows.map((r) => r.id);

  const { data: delegates } =
    delegateIds.length > 0
      ? await supabase.from('delegates').select('id, delegate_id, application_id').in('id', delegateIds)
      : { data: [] as { id: string; delegate_id: string; application_id: string }[] };

  const { data: qrCreds } =
    registrationIds.length > 0
      ? await supabase.from('qr_credentials').select('id, event_registration_id').in('event_registration_id', registrationIds)
      : { data: [] as { id: string; event_registration_id: string }[] };

  const qrIds = (qrCreds ?? []).map((q) => q.id);
  const { data: checkInRows } =
    qrIds.length > 0
      ? await supabase.from('check_ins').select('qr_credential_id, checked_in_at').in('qr_credential_id', qrIds)
      : { data: [] as { qr_credential_id: string; checked_in_at: string }[] };

  const applicationIds = [...new Set((delegates ?? []).map((d) => d.application_id))];
  const { data: applications } =
    applicationIds.length > 0
      ? await supabase.from('delegate_applications').select('id, college, full_name').in('id', applicationIds)
      : { data: [] as { id: string; college: string; full_name: string }[] };

  const applicationById = new Map((applications ?? []).map((a) => [a.id, a]));
  const delegateById = new Map((delegates ?? []).map((d) => [d.id, d]));
  const qrByRegId = new Map((qrCreds ?? []).map((q) => [q.event_registration_id, q.id]));
  const checkInByQrId = new Map((checkInRows ?? []).map((c) => [c.qr_credential_id, c.checked_in_at]));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildHref = (nextPage: number) => {
    const usp = new URLSearchParams();
    if (eventId) usp.set('event', eventId);
    if (status) usp.set('status', status);
    usp.set('page', String(nextPage));
    return `/admin/event-registrations?${usp.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Event Registrations</h1>
        <p className="mt-1 text-[14px] text-ice-500">
          {total} registration{total === 1 ? '' : 's'}
          {eventId ? ' for the selected event' : ' across all events'}.
        </p>
      </div>

      <FilterBar
        tabParam="status"
        tabs={[
          { value: '', label: 'All' },
          { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
          { value: 'CONFIRMED', label: 'Confirmed' },
          { value: 'PAYMENT_UNDER_REVIEW', label: 'Payment Under Review' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
        searchParam=""
        selects={[
          {
            param: 'event',
            placeholder: 'All events',
            options: events.map((e) => ({ value: e.id, label: e.name })),
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No registrations yet."
          description="Event registrations will appear here once participants start signing up."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line-100">
            <table className="w-full min-w-[1000px] border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-10 bg-abyss-800">
                <tr>
                  {[
                    'Registration ID',
                    'Participant',
                    'Delegate ID',
                    'College',
                    'Team / Individual',
                    'Event',
                    'Registration Status',
                    'QR Status',
                    'Check-In',
                    'Registered At',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-line-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const delegate = delegateById.get(r.delegate_id);
                  const application = delegate ? applicationById.get(delegate.application_id) : undefined;
                  const qrId = qrByRegId.get(r.id);
                  const checkedInAt = qrId ? checkInByQrId.get(qrId) ?? null : null;
                  return (
                    <RegistrationRow
                      key={r.id}
                      registration={r}
                      delegateIdText={delegate?.delegate_id ?? '—'}
                      participantName={application?.full_name ?? '—'}
                      college={application?.college ?? '—'}
                      qrIssued={!!qrId}
                      checkedInAt={checkedInAt}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between text-[13px] text-ice-500">
              <span>
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={buildHref(Math.max(1, page - 1))}
                  className={cn(
                    'inline-flex h-9 items-center rounded-md border border-line-200 px-3',
                    page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-signal-500 hover:text-signal-400'
                  )}
                >
                  Previous
                </Link>
                <Link
                  href={buildHref(Math.min(totalPages, page + 1))}
                  className={cn(
                    'inline-flex h-9 items-center rounded-md border border-line-200 px-3',
                    page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-signal-500 hover:text-signal-400'
                  )}
                >
                  Next
                </Link>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
