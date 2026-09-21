import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { getEventById, listEventTypes } from '@/lib/queries/events';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { EventForm } from '@/components/admin/EventForm';
import { EventFormFieldsEditor } from '@/components/admin/EventFormFieldsEditor';
import { EventQrOverride } from '@/components/admin/EventQrOverride';
import type { EventFormFieldRow } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === 'new';

  const [event, eventTypes] = await Promise.all([
    isNew ? Promise.resolve(null) : getEventById(id),
    listEventTypes(),
  ]);

  if (!isNew && !event) notFound();

  let formFields: EventFormFieldRow[] = [];
  let qrPublicUrl: string | null = null;

  if (event) {
    const supabase = await createSupabaseServerComponentClient();
    const { data } = await supabase
      .from('event_form_fields')
      .select('*')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true });
    formFields = data ?? [];

    if (event.payment_qr_storage_path) {
      const { data: pub } = supabase.storage.from('brand-assets').getPublicUrl(event.payment_qr_storage_path);
      qrPublicUrl = pub.publicUrl;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/events" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-ice-500 hover:text-ice-100">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to events
        </Link>
        <h1 className="font-serif text-[26px] text-ice-100">{isNew ? 'New event' : event?.name}</h1>
      </div>

      <EventForm event={event} eventTypes={eventTypes} />

      {event ? (
        <>
          <EventFormFieldsEditor eventId={event.id} fields={formFields} />
          {event.is_paid ? <EventQrOverride eventId={event.id} currentQrUrl={qrPublicUrl} /> : null}
        </>
      ) : null}
    </div>
  );
}

