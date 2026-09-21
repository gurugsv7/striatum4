'use client';

/**
 * STRIATUM 4.0 admin — per-event results entry, draft -> publish.
 *
 * result_entries are free-form (position/label/score) per docs/02-SCHEMA.md
 * — nothing here forces a shape the schema doesn't have. Saves go through
 * saveResults (upsert-and-replace-entries), publish/unpublish through the
 * idempotent SQL-backed actions — never reimplemented here.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { publishResults, saveResults, unpublishResults } from '@/lib/actions/admin';
import type { ResultEntryRow, ResultRow } from '@/lib/types/database';
import { Panel } from '@/components/ui/Panel';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Field } from '@/components/ui/Field';
import { StatusChip } from '@/components/ui/StatusChip';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export interface RegistrationOption {
  registrationId: string;
  label: string;
  institution: string | null;
  participantName: string | null;
  teamId: string | null;
}

export interface ResultsEditorProps {
  eventId: string;
  eventName: string;
  existingResult: ResultRow | null;
  existingEntries: ResultEntryRow[];
  registrationOptions: RegistrationOption[];
}

interface EntryDraft {
  id?: string;
  position: string;
  label: string;
  eventRegistrationId: string;
  participantName: string;
  institution: string;
  score: string;
}

function toDrafts(entries: ResultEntryRow[]): EntryDraft[] {
  return entries.map((e) => ({
    id: e.id,
    position: e.position?.toString() ?? '',
    label: e.label ?? '',
    eventRegistrationId: e.event_registration_id ?? '',
    participantName: e.participant_name ?? '',
    institution: e.institution ?? '',
    score: e.score ?? '',
  }));
}

const EMPTY_ENTRY: EntryDraft = {
  position: '',
  label: '',
  eventRegistrationId: '',
  participantName: '',
  institution: '',
  score: '',
};

export function ResultsEditor({
  eventId,
  eventName,
  existingResult,
  existingEntries,
  registrationOptions,
}: ResultsEditorProps) {
  const router = useRouter();
  const [resultId, setResultId] = useState(existingResult?.id ?? null);
  const [status, setStatus] = useState(existingResult?.status ?? 'DRAFT');
  const [notes, setNotes] = useState(existingResult?.notes ?? '');
  const [entries, setEntries] = useState<EntryDraft[]>(
    existingEntries.length > 0 ? toDrafts(existingEntries) : [EMPTY_ENTRY]
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);

  const registrationByEntry = (regId: string) => registrationOptions.find((r) => r.registrationId === regId);

  const handleSave = async () => {
    setPending(true);
    setError(null);
    const result = await saveResults({
      eventId,
      resultId: resultId ?? undefined,
      notes: notes || undefined,
      entries: entries
        .filter((e) => e.participantName.trim() || e.eventRegistrationId)
        .map((e, i) => {
          const reg = registrationByEntry(e.eventRegistrationId);
          return {
            id: e.id,
            position: e.position ? Number(e.position) : undefined,
            label: e.label || undefined,
            eventRegistrationId: e.eventRegistrationId || undefined,
            teamId: reg?.teamId ?? undefined,
            participantName: e.participantName || reg?.participantName || undefined,
            institution: e.institution || reg?.institution || undefined,
            score: e.score || undefined,
            sortOrder: i,
          };
        }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setResultId(result.data.id);
    setStatus(result.data.status);
    router.refresh();
  };

  const handlePublish = async () => {
    if (!resultId) return;
    const result = await publishResults({ resultId });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(result.data.status);
    setPublishOpen(false);
    router.refresh();
  };

  const handleUnpublish = async () => {
    if (!resultId) return;
    const result = await unpublishResults({ resultId });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(result.data.status);
    setUnpublishOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-[26px] text-ice-100">{eventName}</h1>
          <p className="mt-1 text-[13px] text-ice-500">Result entries for this event.</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip status={status} />
          {status === 'PUBLISHED' ? (
            <span className="text-[13px] text-signal-400">Visible to participants</span>
          ) : (
            <span className="text-[13px] text-ice-500">Not visible to participants</span>
          )}
        </div>
      </div>

      {error ? <p className="text-[13px] text-danger">{error}</p> : null}

      <Panel className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Entries</h3>
          <IconButton
            icon={<Plus className="size-4" />}
            label="Add entry"
            onClick={() => setEntries((arr) => [...arr, { ...EMPTY_ENTRY }])}
          />
        </div>

        {entries.map((entry, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-md border border-line-100 p-3 sm:grid-cols-6">
            <Input
              placeholder="Position"
              type="number"
              min={1}
              className="sm:col-span-1"
              value={entry.position}
              onChange={(e) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, position: e.target.value } : x)))}
            />
            <Select
              className="sm:col-span-2"
              value={entry.eventRegistrationId}
              onChange={(e) => {
                const reg = registrationByEntry(e.target.value);
                setEntries((arr) =>
                  arr.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          eventRegistrationId: e.target.value,
                          participantName: reg?.participantName ?? x.participantName,
                          institution: reg?.institution ?? x.institution,
                        }
                      : x
                  )
                );
              }}
              placeholder="Select confirmed registration (optional)"
              options={registrationOptions.map((r) => ({ value: r.registrationId, label: r.label }))}
            />
            <Input
              placeholder="Participant / team name"
              className="sm:col-span-2"
              value={entry.participantName}
              onChange={(e) =>
                setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, participantName: e.target.value } : x)))
              }
            />
            <Input
              placeholder="Institution"
              value={entry.institution}
              onChange={(e) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, institution: e.target.value } : x)))}
            />
            <Input
              placeholder="Score (optional)"
              value={entry.score}
              onChange={(e) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, score: e.target.value } : x)))}
            />
            <Input
              placeholder="Label (optional)"
              value={entry.label}
              onChange={(e) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
            <div className="flex items-center justify-end sm:col-span-6">
              <IconButton
                icon={<Trash2 className="size-4" />}
                label="Remove entry"
                onClick={() => setEntries((arr) => arr.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        ))}

        <Field label="Notes (optional)" htmlFor="results-notes">
          <Textarea id="results-notes" value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" loading={pending} onClick={handleSave}>
          Save as draft
        </Button>
        {status === 'PUBLISHED' ? (
          <Button type="button" variant="destructive" onClick={() => setUnpublishOpen(true)} disabled={!resultId}>
            Unpublish results
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={() => setPublishOpen(true)} disabled={!resultId}>
            Publish results
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish results?"
        description="Participants will immediately be able to see these results on the Results page and the event detail page."
        confirmLabel="Publish"
        onConfirm={handlePublish}
      />

      <ConfirmDialog
        open={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        title="Unpublish results?"
        tone="destructive"
        description="Participants will no longer be able to see these results until you publish again."
        confirmLabel="Unpublish"
        onConfirm={handleUnpublish}
      />
    </div>
  );
}
