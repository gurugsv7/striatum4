'use client';

/**
 * STRIATUM 4.0 admin — event create/edit form.
 *
 * Every descriptive field is genuinely optional, matching the nullable
 * columns on `events` (docs/02-SCHEMA.md) — nothing here is prefilled with
 * an invented value; an admin who leaves a field blank keeps the
 * participant-facing "not announced" state. Submits through the existing
 * idempotent upsertEvent server action in lib/actions/admin.ts.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { upsertEvent } from '@/lib/actions/admin';
import type { EventRow, EventTypeRow } from '@/lib/types/database';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { IconButton } from '@/components/ui/IconButton';

export interface EventFormProps {
  event: EventRow | null;
  eventTypes: EventTypeRow[];
}

interface Speaker {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
}
interface ScheduleItem {
  time: string;
  label: string;
}
interface Faq {
  question: string;
  answer: string;
}

function toSpeakers(json: unknown): Speaker[] {
  if (!Array.isArray(json)) return [];
  return json.map((s) => {
    const o = s as Record<string, unknown>;
    return {
      name: typeof o.name === 'string' ? o.name : '',
      title: typeof o.title === 'string' ? o.title : '',
      bio: typeof o.bio === 'string' ? o.bio : '',
      photoUrl: typeof o.photoUrl === 'string' ? o.photoUrl : '',
    };
  });
}
function toSchedule(json: unknown): ScheduleItem[] {
  if (!Array.isArray(json)) return [];
  return json.map((s) => {
    const o = s as Record<string, unknown>;
    return { time: typeof o.time === 'string' ? o.time : '', label: typeof o.label === 'string' ? o.label : '' };
  });
}
function toFaqs(json: unknown): Faq[] {
  if (!Array.isArray(json)) return [];
  return json.map((s) => {
    const o = s as Record<string, unknown>;
    return {
      question: typeof o.question === 'string' ? o.question : '',
      answer: typeof o.answer === 'string' ? o.answer : '',
    };
  });
}

export function EventForm({ event, eventTypes }: EventFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState(event?.slug ?? '');
  const [name, setName] = useState(event?.name ?? '');
  const [typeId, setTypeId] = useState(event?.type_id ?? '');
  const [summary, setSummary] = useState(event?.summary ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [about, setAbout] = useState(event?.about ?? '');
  const [eventDate, setEventDate] = useState(event?.event_date ?? '');
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? '');
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? '');
  const [session, setSession] = useState(event?.session ?? '');
  const [venue, setVenue] = useState(event?.venue ?? '');
  const [format, setFormat] = useState<'INDIVIDUAL' | 'TEAM'>(event?.format ?? 'INDIVIDUAL');
  const [minTeamSize, setMinTeamSize] = useState(event?.min_team_size?.toString() ?? '');
  const [maxTeamSize, setMaxTeamSize] = useState(event?.max_team_size?.toString() ?? '');
  const [isPaid, setIsPaid] = useState(event?.is_paid ?? false);
  const [feeInr, setFeeInr] = useState(event?.fee_inr?.toString() ?? '');
  const [capacity, setCapacity] = useState(event?.capacity?.toString() ?? '');
  const [registrationOpen, setRegistrationOpen] = useState(event?.registration_open ?? false);
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(event?.requires_admin_approval ?? false);
  const [eligibility, setEligibility] = useState(event?.eligibility ?? '');
  const [rules, setRules] = useState(event?.rules ?? '');
  const [paymentUpiId, setPaymentUpiId] = useState(event?.payment_upi_id ?? '');
  const [paymentPayeeName, setPaymentPayeeName] = useState(event?.payment_payee_name ?? '');
  const [isFeatured, setIsFeatured] = useState(event?.is_featured ?? false);
  const [sortOrder, setSortOrder] = useState(event?.sort_order?.toString() ?? '0');

  const [speakers, setSpeakers] = useState<Speaker[]>(toSpeakers(event?.speakers));
  const [schedule, setSchedule] = useState<ScheduleItem[]>(toSchedule(event?.schedule));
  const [faqs, setFaqs] = useState<Faq[]>(toFaqs(event?.faqs));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await upsertEvent({
      id: event?.id,
      slug,
      name,
      typeId: typeId || null,
      summary: summary || null,
      description: description || null,
      eventDate: eventDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      session: session || null,
      venue: venue || null,
      format,
      minTeamSize: minTeamSize === '' ? null : Number(minTeamSize),
      maxTeamSize: maxTeamSize === '' ? null : Number(maxTeamSize),
      isPaid,
      feeInr: feeInr === '' ? null : Number(feeInr),
      capacity: capacity === '' ? null : Number(capacity),
      registrationOpen,
      requiresAdminApproval,
      eligibility: eligibility || null,
      rules: rules || null,
      about: about || null,
      faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
      speakers: speakers.filter((s) => s.name.trim()),
      schedule: schedule.filter((s) => s.time.trim() && s.label.trim()),
      paymentUpiId: paymentUpiId || null,
      paymentPayeeName: paymentPayeeName || null,
      isFeatured,
      sortOrder: Number(sortOrder) || 0,
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (!event) {
      router.push(`/admin/events/${result.data.id}`);
    } else {
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}

      <Panel className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Event name" htmlFor="ev-name" required>
          <Input id="ev-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Slug" htmlFor="ev-slug" required hint="lowercase-with-hyphens">
          <Input id="ev-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </Field>
        <Field label="Event type" htmlFor="ev-type">
          <Select
            id="ev-type"
            value={typeId ?? ''}
            onChange={(e) => setTypeId(e.target.value)}
            placeholder="Not set"
            options={eventTypes.map((t) => ({ value: t.id, label: t.label }))}
          />
        </Field>
        <Field label="Session" htmlFor="ev-session" hint="e.g. Forenoon, Afternoon, Evening">
          <Input id="ev-session" value={session ?? ''} onChange={(e) => setSession(e.target.value)} />
        </Field>
        <Field label="Summary" htmlFor="ev-summary" className="sm:col-span-2">
          <Textarea id="ev-summary" value={summary ?? ''} onChange={(e) => setSummary(e.target.value)} rows={2} />
        </Field>
        <Field label="Description" htmlFor="ev-description" className="sm:col-span-2">
          <Textarea id="ev-description" value={description ?? ''} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Field>
        <Field label="About" htmlFor="ev-about" className="sm:col-span-2">
          <Textarea id="ev-about" value={about ?? ''} onChange={(e) => setAbout(e.target.value)} rows={4} />
        </Field>
      </Panel>

      <Panel className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Date" htmlFor="ev-date">
          <Input id="ev-date" type="date" value={eventDate ?? ''} onChange={(e) => setEventDate(e.target.value)} />
        </Field>
        <Field label="Start time" htmlFor="ev-start">
          <Input id="ev-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="End time" htmlFor="ev-end">
          <Input id="ev-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
        <Field label="Venue" htmlFor="ev-venue" className="sm:col-span-3">
          <Input id="ev-venue" value={venue ?? ''} onChange={(e) => setVenue(e.target.value)} />
        </Field>
      </Panel>

      <Panel className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Format" htmlFor="ev-format">
          <Select
            id="ev-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'INDIVIDUAL' | 'TEAM')}
            options={[
              { value: 'INDIVIDUAL', label: 'Individual' },
              { value: 'TEAM', label: 'Team' },
            ]}
          />
        </Field>
        {format === 'TEAM' ? (
          <>
            <Field label="Min team size" htmlFor="ev-min-team">
              <Input id="ev-min-team" type="number" min={1} value={minTeamSize} onChange={(e) => setMinTeamSize(e.target.value)} />
            </Field>
            <Field label="Max team size" htmlFor="ev-max-team">
              <Input id="ev-max-team" type="number" min={1} value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} />
            </Field>
          </>
        ) : null}
        <Field label="Capacity" htmlFor="ev-capacity" hint="Blank = unlimited">
          <Input id="ev-capacity" type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </Field>
        <div className="flex flex-col gap-2 sm:col-span-3">
          <Checkbox
            id="ev-registration-open"
            checked={registrationOpen}
            onChange={(e) => setRegistrationOpen(e.target.checked)}
            label="Registration is open"
          />
          <Checkbox
            id="ev-requires-approval"
            checked={requiresAdminApproval}
            onChange={(e) => setRequiresAdminApproval(e.target.checked)}
            label="Requires admin approval (free events)"
          />
          <Checkbox
            id="ev-featured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            label="Featured"
          />
        </div>
        <Field label="Sort order" htmlFor="ev-sort">
          <Input id="ev-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </Field>
      </Panel>

      <Panel className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Checkbox id="ev-paid" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} label="This event is paid" />
        </div>
        {isPaid ? (
          <>
            <Field label="Fee (INR)" htmlFor="ev-fee">
              <Input id="ev-fee" type="number" min={0} value={feeInr} onChange={(e) => setFeeInr(e.target.value)} />
            </Field>
            <div />
            <Field label="Payment override — UPI ID" htmlFor="ev-upi" hint="Blank falls back to the global payment settings">
              <Input id="ev-upi" value={paymentUpiId ?? ''} onChange={(e) => setPaymentUpiId(e.target.value)} />
            </Field>
            <Field label="Payment override — Payee name" htmlFor="ev-payee">
              <Input id="ev-payee" value={paymentPayeeName ?? ''} onChange={(e) => setPaymentPayeeName(e.target.value)} />
            </Field>
          </>
        ) : null}
      </Panel>

      <Panel className="flex flex-col gap-3">
        <Field label="Eligibility" htmlFor="ev-eligibility">
          <Textarea id="ev-eligibility" value={eligibility ?? ''} onChange={(e) => setEligibility(e.target.value)} rows={2} />
        </Field>
        <Field label="Rules" htmlFor="ev-rules">
          <Textarea id="ev-rules" value={rules ?? ''} onChange={(e) => setRules(e.target.value)} rows={4} />
        </Field>
      </Panel>

      <Panel className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Speakers</h3>
          <IconButton
            icon={<Plus className="size-4" />}
            label="Add speaker"
            onClick={() => setSpeakers((s) => [...s, { name: '', title: '', bio: '', photoUrl: '' }])}
          />
        </div>
        {speakers.map((sp, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-md border border-line-100 p-3 sm:grid-cols-2">
            <Input
              placeholder="Name"
              value={sp.name}
              onChange={(e) =>
                setSpeakers((arr) => arr.map((s, j) => (j === i ? { ...s, name: e.target.value } : s)))
              }
            />
            <Input
              placeholder="Title"
              value={sp.title}
              onChange={(e) =>
                setSpeakers((arr) => arr.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)))
              }
            />
            <Textarea
              placeholder="Bio"
              className="sm:col-span-2"
              rows={2}
              value={sp.bio}
              onChange={(e) => setSpeakers((arr) => arr.map((s, j) => (j === i ? { ...s, bio: e.target.value } : s)))}
            />
            <div className="flex items-center justify-end sm:col-span-2">
              <IconButton
                icon={<Trash2 className="size-4" />}
                label="Remove speaker"
                onClick={() => setSpeakers((arr) => arr.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        ))}
      </Panel>

      <Panel className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Schedule</h3>
          <IconButton
            icon={<Plus className="size-4" />}
            label="Add schedule item"
            onClick={() => setSchedule((s) => [...s, { time: '', label: '' }])}
          />
        </div>
        {schedule.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Time"
              className="w-40"
              value={it.time}
              onChange={(e) => setSchedule((arr) => arr.map((s, j) => (j === i ? { ...s, time: e.target.value } : s)))}
            />
            <Input
              placeholder="Label"
              value={it.label}
              onChange={(e) => setSchedule((arr) => arr.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)))}
            />
            <IconButton
              icon={<Trash2 className="size-4" />}
              label="Remove schedule item"
              onClick={() => setSchedule((arr) => arr.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </Panel>

      <Panel className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">FAQs</h3>
          <IconButton
            icon={<Plus className="size-4" />}
            label="Add FAQ"
            onClick={() => setFaqs((f) => [...f, { question: '', answer: '' }])}
          />
        </div>
        {faqs.map((f, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-line-100 p-3">
            <Input
              placeholder="Question"
              value={f.question}
              onChange={(e) => setFaqs((arr) => arr.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
            />
            <Textarea
              placeholder="Answer"
              rows={2}
              value={f.answer}
              onChange={(e) => setFaqs((arr) => arr.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
            />
            <div className="flex justify-end">
              <IconButton
                icon={<Trash2 className="size-4" />}
                label="Remove FAQ"
                onClick={() => setFaqs((arr) => arr.filter((_, j) => j !== i))}
              />
            </div>
          </div>
        ))}
      </Panel>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/events')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={pending}>
          {event ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  );
}
