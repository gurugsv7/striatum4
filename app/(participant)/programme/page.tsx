import Link from "next/link";
import { PageContainer } from "@/components/shell/PageContainer";
import { AppHeader } from "@/components/shell/AppHeader";
import { ProgrammeDayBlock } from "@/components/event/ProgrammeDayBlock";
import { getProgrammeByDay, listEventTypes } from "@/lib/queries/events";
import { getOptionalUser } from "@/lib/auth/guards";
import { unreadCount } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export default async function ProgrammePage() {
  const [programme, eventTypes, user] = await Promise.all([
    getProgrammeByDay(),
    listEventTypes(),
    getOptionalUser(),
  ]);

  const unread = user ? await unreadCount(user.id) : 0;
  const typeLabelById: Record<string, string> = {};
  for (const t of eventTypes) typeLabelById[t.id] = t.label;

  return (
    <div className="flex flex-col">
      <AppHeader unread={unread > 0} />
      <PageContainer className="flex flex-col gap-6 pt-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">PROGRAMME</span>
          <h1 className="font-serif text-[28px] text-ice-100">13 — 18 OCT 2026</h1>
        </div>

        <div className="flex flex-col">
          {programme.days.map((day, i) => (
            <ProgrammeDayBlock
              key={day.date}
              date={day.date}
              events={day.events}
              typeLabelById={typeLabelById}
              isLast={i === programme.days.length - 1 && programme.unscheduled.length === 0}
            />
          ))}
        </div>

        {programme.unscheduled.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-line-100 pt-5">
            <span className="text-[13px] font-medium text-ice-500">Date not yet announced</span>
            <div className="flex flex-col gap-2.5">
              {programme.unscheduled.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="rounded-md border border-line-100 bg-abyss-700 px-4 py-3 text-[15px] font-medium text-ice-100 hover:border-signal-500/60"
                >
                  {event.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </PageContainer>
    </div>
  );
}
