import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { getEventById } from '@/lib/queries/events';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { ResultsEditor, type RegistrationOption } from '@/components/admin/ResultsEditor';
import type { ResultEntryRow, ResultRow } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminResultsEditorPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'REVIEWER']);
  const { eventId } = await params;

  const event = await getEventById(eventId);
  if (!event) notFound();

  const supabase = await createSupabaseServerComponentClient();

  const [{ data: results }, { data: registrations }] = await Promise.all([
    supabase
      .from('results')
      .select('*, entries:result_entries(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('event_registrations')
      .select('id, delegate_id, team_id, team:teams(name)')
      .eq('event_id', eventId)
      .eq('status', 'CONFIRMED'),
  ]);

  const typedResults = (results ?? []) as unknown as Array<ResultRow & { entries: ResultEntryRow[] }>;
  const existingResult = typedResults[0] ?? null;
  const existingEntries = existingResult?.entries ?? [];

  const delegateIds = [...new Set((registrations ?? []).map((r) => r.delegate_id))];
  const { data: delegates } =
    delegateIds.length > 0
      ? await supabase.from('delegates').select('id, application_id').in('id', delegateIds)
      : { data: [] as { id: string; application_id: string }[] };
  const appIds = [...new Set((delegates ?? []).map((d) => d.application_id))];
  const { data: applications } =
    appIds.length > 0
      ? await supabase.from('delegate_applications').select('id, full_name, college').in('id', appIds)
      : { data: [] as { id: string; full_name: string; college: string }[] };

  const appById = new Map((applications ?? []).map((a) => [a.id, a]));
  const delegateById = new Map((delegates ?? []).map((d) => [d.id, d]));

  const registrationOptions: RegistrationOption[] = (registrations ?? []).map((r) => {
    const delegate = delegateById.get(r.delegate_id);
    const application = delegate ? appById.get(delegate.application_id) : undefined;
    const teamName = (r as unknown as { team: { name: string | null } | null }).team?.name ?? null;
    const label = teamName ? `${teamName} (team)` : application?.full_name ?? 'Unnamed participant';
    return {
      registrationId: r.id,
      label,
      institution: application?.college ?? null,
      participantName: teamName ?? application?.full_name ?? null,
      teamId: r.team_id,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/results" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-ice-500 hover:text-ice-100">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to results
      </Link>
      <ResultsEditor
        eventId={event.id}
        eventName={event.name}
        existingResult={existingResult}
        existingEntries={existingEntries}
        registrationOptions={registrationOptions}
      />
    </div>
  );
}
