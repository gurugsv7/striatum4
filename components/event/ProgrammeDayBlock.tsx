import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Signal } from "@/components/signal/Signal";
import { formatTimeRange } from "@/lib/format/date";
import type { EventRow, ISODate } from "@/lib/types/database";

export interface ProgrammeDayBlockProps {
  date: ISODate;
  events: EventRow[];
  typeLabelById: Record<string, string>;
  isLast: boolean;
}

/** One day on the programme's vertical spine. Signal travels to arrived once the day has events. */
export function ProgrammeDayBlock({ date, events, typeLabelById, isLast }: ProgrammeDayBlockProps) {
  const d = parseISO(date);
  const hasEvents = events.length > 0;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-full border border-line-200 bg-abyss-700">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-signal-500">{format(d, "MMM")}</span>
          <span className="font-serif text-base leading-none text-ice-100">{format(d, "d")}</span>
        </div>
        {!isLast ? (
          <Signal
            variant={hasEvents ? "arrived" : "dormant"}
            orientation="vertical"
            length={hasEvents ? 96 : 64}
            className="my-1"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 pb-8">
        <span className="pt-2 text-[13px] font-medium text-ice-500">{format(d, "EEEE")}</span>
        {!hasEvents ? (
          <p className="rounded-md border border-dashed border-line-200 px-4 py-3 text-[14px] text-ice-700">
            To be announced
          </p>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="flex flex-col gap-0.5 rounded-md border border-line-100 bg-abyss-700 px-4 py-3 transition-colors hover:border-signal-500/60"
            >
              <div className="flex items-center gap-2">
                {event.type_id && typeLabelById[event.type_id] ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ice-500">
                    {typeLabelById[event.type_id]}
                  </span>
                ) : null}
              </div>
              <span className="text-[18px] font-semibold text-ice-100">{event.name}</span>
              {event.session || event.start_time ? (
                <span className="text-[13px] text-ice-500">
                  {[event.session, formatTimeRange(event.start_time, event.end_time) !== "Time not announced" ? formatTimeRange(event.start_time, event.end_time) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              ) : null}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
