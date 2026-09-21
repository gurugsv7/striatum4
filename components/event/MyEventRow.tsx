import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatEventDate, formatTimeRange } from "@/lib/format/date";
import type { RegistrationWithEvent } from "@/lib/queries/registrations";

export interface MyEventRowProps {
  registration: RegistrationWithEvent;
}

/** One row on /my-events. Every branch reflects the registration's real status — never a fake "confirmed" look. */
export function MyEventRow({ registration }: MyEventRowProps) {
  const event = registration.event;
  if (!event) return null;

  const status = registration.status;

  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[17px] font-semibold text-ice-100">{event.name}</span>
          <span className="text-[13px] text-ice-500">
            {formatEventDate(event.event_date)} · {formatTimeRange(event.start_time, event.end_time)}
          </span>
          {event.venue ? <span className="text-[13px] text-ice-500">{event.venue}</span> : null}
        </div>
        <StatusChip status={status} />
      </div>

      {status === "CONFIRMED" ? (
        <Link
          href={`/my-events/${registration.id}`}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-md border border-signal-500/60 px-4 text-[14px] font-semibold text-signal-400 hover:bg-signal-500/10"
        >
          VIEW PASS
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : status === "PAYMENT_REJECTED" ? (
        <Link
          href={`/events/${event.slug}/register/payment`}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-md border border-danger/50 px-4 text-[14px] font-semibold text-danger hover:bg-danger/10"
        >
          RESUBMIT PAYMENT PROOF
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : status === "PAYMENT_PENDING" ? (
        <Link
          href={`/events/${event.slug}/register/payment`}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-md border border-line-200 px-4 text-[14px] font-semibold text-ice-100 hover:border-signal-500"
        >
          COMPLETE PAYMENT
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : status === "PAYMENT_UNDER_REVIEW" ? (
        <p className="text-[13px] text-ice-500">Your payment proof has been received and is under review.</p>
      ) : status === "PENDING_APPROVAL" ? (
        <p className="text-[13px] text-ice-500">Awaiting organizer approval.</p>
      ) : null}
    </Panel>
  );
}
