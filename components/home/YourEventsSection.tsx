import Link from "next/link";

import type { RegistrationWithEvent } from "@/lib/queries/registrations";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { Panel } from "@/components/ui/Panel";
import { formatEventDate, formatTime } from "@/lib/format/date";

export interface YourEventsSectionProps {
  registrations: RegistrationWithEvent[];
}

/** `04 / YOUR EVENTS` — real registrations, never a fake pass. */
export function YourEventsSection({ registrations }: YourEventsSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader index="04" eyebrow="YOUR EVENTS" heading="What you're in" />
      {registrations.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Events you register for will appear here with their individual QR passes."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {registrations.map((reg) => (
            <Link key={reg.id} href={reg.status === "CONFIRMED" ? `/my-events/${reg.id}` : "/my-events"}>
              <Panel className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-[15px] font-semibold text-ice-100">
                    {reg.event?.name ?? "Event"}
                  </p>
                  <p className="text-[13px] text-ice-500">
                    {formatEventDate(reg.event?.event_date ?? null)}
                    {reg.event?.start_time ? ` · ${formatTime(reg.event.start_time)}` : ""}
                  </p>
                </div>
                <StatusChip status={reg.status} />
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
