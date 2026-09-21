'use client';

/**
 * STRIATUM 4.0 admin — per-event registration question editor
 * (event_form_fields), so organizers can add fields without a redeploy.
 */
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { deleteEventFormField, upsertEventFormField } from '@/app/admin/events/_actions';
import type { EventFormFieldRow } from '@/lib/types/database';
import { FIELD_TYPES, FIELD_TYPE_LABELS } from '@/lib/types/enums';
import { Panel } from '@/components/ui/Panel';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Field } from '@/components/ui/Field';

export interface EventFormFieldsEditorProps {
  eventId: string;
  fields: EventFormFieldRow[];
}

interface Draft {
  key: string;
  label: string;
  fieldType: (typeof FIELD_TYPES)[number];
  required: boolean;
}

const EMPTY_DRAFT: Draft = { key: '', label: '', fieldType: 'TEXT', required: false };

export function EventFormFieldsEditor({ eventId, fields }: EventFormFieldsEditorProps) {
  const [items, setItems] = useState(fields);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!draft.key.trim() || !draft.label.trim()) {
      setError('Key and label are required.');
      return;
    }
    setPending(true);
    setError(null);
    const result = await upsertEventFormField({
      eventId,
      key: draft.key.trim(),
      label: draft.label.trim(),
      fieldType: draft.fieldType,
      required: draft.required,
      sortOrder: items.length,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => [...prev, result.data]);
    setDraft(EMPTY_DRAFT);
  };

  const handleDelete = async (id: string) => {
    setPending(true);
    setError(null);
    const result = await deleteEventFormField({ id, eventId });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <Panel className="flex flex-col gap-3">
      <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">
        Registration questions (event_form_fields)
      </h3>

      {error ? <p className="text-[13px] text-danger">{error}</p> : null}

      {items.length === 0 ? (
        <p className="text-[13px] text-ice-500">No extra questions configured for this event.</p>
      ) : (
        <div className="flex flex-col divide-y divide-line-100">
          {items.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex flex-col">
                <span className="text-[14px] text-ice-100">
                  {f.label}
                  {f.required ? <span className="text-signal-500"> *</span> : null}
                </span>
                <span className="font-mono text-[11px] text-ice-500">
                  {f.key} · {FIELD_TYPE_LABELS[f.field_type]}
                </span>
              </div>
              <IconButton
                icon={<Trash2 className="size-4" />}
                label={`Remove ${f.label}`}
                onClick={() => handleDelete(f.id)}
                disabled={pending}
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 rounded-md border border-line-100 p-3 sm:grid-cols-4">
        <Field label="Key" htmlFor="new-field-key">
          <Input
            id="new-field-key"
            placeholder="dietary_pref"
            value={draft.key}
            onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
          />
        </Field>
        <Field label="Label" htmlFor="new-field-label">
          <Input
            id="new-field-label"
            placeholder="Dietary preference"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          />
        </Field>
        <Field label="Type" htmlFor="new-field-type">
          <Select
            id="new-field-type"
            value={draft.fieldType}
            onChange={(e) => setDraft((d) => ({ ...d, fieldType: e.target.value as Draft['fieldType'] }))}
            options={FIELD_TYPES.map((t) => ({ value: t, label: FIELD_TYPE_LABELS[t] }))}
          />
        </Field>
        <div className="flex items-end gap-2">
          <Checkbox
            id="new-field-required"
            checked={draft.required}
            onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))}
            label="Required"
          />
        </div>
      </div>
      <div>
        <Button type="button" variant="secondary" size="sm" loading={pending} onClick={handleAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add question
        </Button>
      </div>
    </Panel>
  );
}
