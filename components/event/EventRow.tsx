import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { StatusChip } from "@/components/ui/StatusChip";
import { feeLabel } from "@/lib/format/currency";
import type { EventRow as EventRowData } from "@/lib/types/database";
import type { EventRegistrationStatus } from "@/lib/types/enums";

export interface EventRowProps {
  event: EventRowData;
  typeLabel: string | null;
  registrationStatus?: EventRegistrationStatus | null;
  className?: string;
}

/** Date block: month over day. Renders a hairline placeholder when unscheduled. */
function DateBlock({ isoDate }: { isoDate: string | null }) {
  if (!isoDate) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-line-200 py-1.5 text-ice-700">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]">TBA</span>
      </div>
    );
  }
  const d = parseISO(isoDate);
  return (
    <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-md border border-line-100 bg-abyss-700 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-signal-500">
        {format(d, "MMM")}
      </span>
      <span className="font-serif text-xl leading-none text-ice-100">{format(d, "d")}</span>
    </div>
  );
}

/** One row of the Explore event index: date + type chip + name + session/venue + arrow. */
export function EventRow({ event, typeLabel, registrationStatus, className }: EventRowProps) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "flex items-center gap-3.5 rounded-md border border-line-100 bg-abyss-700 p-3.5 transition-colors hover:border-signal-500/60",
        className,
      )}
    >
      <DateBlock isoDate={event.event_date} />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {typeLabel ? (
            <span className="rounded-full border border-line-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ice-500">
              {typeLabel}
            </span>
          ) : null}
          {registrationStatus ? <StatusChip status={registrationStatus} /> : null}
        </div>
        <p className="truncate text-[17px] font-semibold text-ice-100">{event.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-ice-500">
          {[event.session, event.venue].filter(Boolean).join(" · ") || "Details not announced yet"}
        </p>
        {event.is_paid ? (
          <p className="mt-1 text-[13px] font-medium text-signal-400">
            {feeLabel(event.fee_inr, event.is_paid)}
          </p>
        ) : null}
      </div>

      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line-200 text-ice-300">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
