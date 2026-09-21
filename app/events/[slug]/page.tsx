import { notFound } from "next/navigation";
import { BottomNav } from "@/components/shell/BottomNav";
import { PageContainer } from "@/components/shell/PageContainer";
import { Panel } from "@/components/ui/Panel";
import { Divider } from "@/components/ui/Divider";
import { StatusChip } from "@/components/ui/StatusChip";
import { EventDetailHeader } from "@/components/event/EventDetailHeader";
import { EventDetailTabs, type DetailTab } from "@/components/event/EventDetailSections";
import { RegisterCta, type EventCta } from "@/components/event/RegisterCta";
import { EventResultsPanel } from "@/components/event/EventResultsPanel";
import { getEventBySlug, listEventTypes } from "@/lib/queries/events";
import { getPublishedResultForEvent } from "@/lib/queries/results";
import { listMyRegistrations, getRemainingCapacity } from "@/lib/queries/registrations";
import { getOptionalUser, getDelegateState } from "@/lib/auth/guards";
import { formatEventDate, formatDayName, formatTimeRange } from "@/lib/format/date";
import { feeLabel } from "@/lib/format/currency";
import type { Json } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface SpeakerEntry {
  name: string;
  title?: string | null;
  bio?: string | null;
}
interface ScheduleEntry {
  time: string;
  label: string;
}
interface FaqEntry {
  question: string;
  answer: string;
}

function asArray<T>(value: Json | null): T[] {
  return Array.isArray(value) ? (value as unknown as T[]) : [];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [eventTypes, publishedResult, user] = await Promise.all([
    listEventTypes(),
    getPublishedResultForEvent(event.id),
    getOptionalUser(),
  ]);

  const typeLabel = event.type_id ? eventTypes.find((t) => t.id === event.type_id)?.label ?? null : null;

  const nextPath = `/events/${event.slug}`;
  let cta: EventCta = { kind: "sign_in" };
  const remainingCapacity = event.capacity != null ? await getRemainingCapacity(event.id) : null;

  if (!user) {
    cta = { kind: "sign_in" };
  } else {
    const delegateState = await getDelegateState(user.id);
    if (delegateState.status === "PAYMENT_UNDER_REVIEW") {
      cta = { kind: "delegate_pending" };
    } else if (delegateState.status === "PAYMENT_REJECTED") {
      cta = { kind: "delegate_rejected" };
    } else if (delegateState.status !== "ACTIVE") {
      cta = { kind: "no_delegate" };
    } else {
      const myRegistrations = await listMyRegistrations(user.id);
      const existing = myRegistrations.find((r) => r.event_id === event.id);
      if (existing) {
        cta = { kind: "already_registered", registrationId: existing.id, status: existing.status };
      } else if (!event.registration_open) {
        cta = { kind: "registration_closed" };
      } else if (event.capacity != null && remainingCapacity !== null && remainingCapacity <= 0) {
        cta = { kind: "event_full" };
      } else {
        cta = { kind: "register" };
      }
    }
  }

  const tabs: DetailTab[] = [];

  if (event.about) {
    tabs.push({
      value: "about",
      label: "About",
      panel: <p className="whitespace-pre-line text-[15px] leading-[1.55] text-ice-300">{event.about}</p>,
    });
  }

  if (event.format) {
    const teamRange =
      event.format === "TEAM"
        ? [event.min_team_size, event.max_team_size].some((v) => v != null)
          ? `Team size: ${event.min_team_size ?? "—"}–${event.max_team_size ?? "—"} members`
          : "Team size not announced"
        : null;
    tabs.push({
      value: "format",
      label: "Format",
      panel: (
        <div className="flex flex-col gap-2 text-[15px] text-ice-300">
          <p>{event.format === "TEAM" ? "Team event" : "Individual event"}</p>
          {teamRange ? <p className="text-ice-500">{teamRange}</p> : null}
        </div>
      ),
    });
  }

  if (event.rules) {
    tabs.push({
      value: "rules",
      label: "Rules",
      panel: <p className="whitespace-pre-line text-[15px] leading-[1.55] text-ice-300">{event.rules}</p>,
    });
  }

  const speakers = asArray<SpeakerEntry>(event.speakers);
  if (speakers.length > 0) {
    tabs.push({
      value: "speakers",
      label: "Speakers",
      panel: (
        <ul className="flex flex-col gap-4">
          {speakers.map((speaker, i) => (
            <li key={`${speaker.name}-${i}`} className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-abyss-600 font-mono text-sm text-signal-400">
                {initials(speaker.name)}
              </span>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-ice-100">{speaker.name}</span>
                {speaker.title ? <span className="text-[13px] text-ice-500">{speaker.title}</span> : null}
                {speaker.bio ? (
                  <p className="mt-1 text-[13px] leading-[1.55] text-ice-300">{speaker.bio}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ),
    });
  }

  const schedule = asArray<ScheduleEntry>(event.schedule);
  if (schedule.length > 0) {
    tabs.push({
      value: "schedule",
      label: "Schedule",
      panel: (
        <ul className="flex flex-col divide-y divide-line-100">
          {schedule.map((item, i) => (
            <li key={i} className="flex items-center gap-4 py-3">
              <span className="w-20 shrink-0 font-mono text-[13px] text-signal-500">{item.time}</span>
              <span className="text-[15px] text-ice-100">{item.label}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (event.venue) {
    tabs.push({
      value: "venue",
      label: "Venue",
      panel: <p className="text-[15px] leading-[1.55] text-ice-300">{event.venue}</p>,
    });
  }

  const faqs = asArray<FaqEntry>(event.faqs);
  if (faqs.length > 0) {
    tabs.push({
      value: "faqs",
      label: "FAQs",
      panel: (
        <ul className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <li key={i} className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold text-ice-100">{faq.question}</span>
              <span className="text-[15px] leading-[1.55] text-ice-300">{faq.answer}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <PageContainer className="flex flex-col gap-6 pt-4">
        <EventDetailHeader eventName={event.name} shareUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${nextPath}`} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {typeLabel ? (
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">{typeLabel}</span>
            ) : null}
            {cta.kind === "already_registered" ? <StatusChip status={cta.status} /> : null}
          </div>
          <h1 className="font-serif text-[32px] leading-tight text-ice-100">{event.name}</h1>
          {event.summary ? <p className="text-[16px] text-ice-300">{event.summary}</p> : null}
          {event.description ? (
            <p className="whitespace-pre-line text-[15px] leading-[1.55] text-ice-500">{event.description}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 divide-x divide-line-100 rounded-md border border-line-100">
          <MetaCell primary={formatEventDate(event.event_date)} secondary={formatDayName(event.event_date) || undefined} />
          <MetaCell primary={formatTimeRange(event.start_time, event.end_time)} secondary={event.session ?? undefined} />
          <MetaCell primary={event.venue ?? "Not announced yet"} secondary="Venue" />
        </div>

        <p className="text-center text-[16px] font-semibold text-ice-100">{feeLabel(event.fee_inr, event.is_paid)}</p>

        {event.capacity != null ? (
          <p className="text-center text-[13px] text-ice-500">
            {remainingCapacity !== null && remainingCapacity > 0
              ? `${remainingCapacity} of ${event.capacity} seats remaining`
              : "No seats remaining"}
          </p>
        ) : null}

        <RegisterCta cta={cta} eventSlug={event.slug} nextPath={nextPath} />

        {event.eligibility ? (
          <Panel>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">Who can attend?</span>
            <p className="mt-2 text-[15px] leading-[1.55] text-ice-300">{event.eligibility}</p>
          </Panel>
        ) : null}

        {tabs.length > 0 ? (
          <>
            <Divider />
            <EventDetailTabs tabs={tabs} />
          </>
        ) : null}

        <Divider />
        <EventResultsPanel result={publishedResult} />
      </PageContainer>
      <BottomNav />
    </div>
  );
}

function MetaCell({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-3 text-center">
      <span className="text-[15px] font-medium text-ice-100">{primary}</span>
      {secondary ? <span className="text-[12px] text-ice-500">{secondary}</span> : null}
    </div>
  );
}
