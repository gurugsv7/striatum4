import { PageContainer } from "@/components/shell/PageContainer";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventRow } from "@/components/event/EventRow";
import { ExploreControls, type ExploreMode, type ExploreSort } from "@/components/event/ExploreControls";
import { listEvents, listEventTypes } from "@/lib/queries/events";
import { listMyRegistrations } from "@/lib/queries/registrations";
import { getOptionalUser } from "@/lib/auth/guards";
import type { EventRegistrationStatus } from "@/lib/types/enums";

export const dynamic = "force-dynamic";

interface ExplorePageProps {
  searchParams: Promise<{ q?: string; type?: string; mode?: string; sort?: string }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const typeId = params.type ?? null;
  const mode: ExploreMode = params.mode === "SCHEDULE" ? "SCHEDULE" : "EVENTS";
  const sort: ExploreSort = params.sort === "name" ? "name" : "date";

  const [allEvents, eventTypes, filteredEvents, user] = await Promise.all([
    listEvents({}),
    listEventTypes(),
    listEvents({ search: search || undefined, typeId: typeId || undefined }),
    getOptionalUser(),
  ]);

  const typeLabelById: Record<string, string> = {};
  for (const t of eventTypes) typeLabelById[t.id] = t.label;

  let registrationByEvent: Record<string, EventRegistrationStatus> = {};
  if (user) {
    const registrations = await listMyRegistrations(user.id);
    registrationByEvent = Object.fromEntries(
      registrations.map((r) => [r.event_id, r.status]),
    );
  }

  const sorted = [...filteredEvents].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (!a.event_date && !b.event_date) return 0;
    if (!a.event_date) return 1;
    if (!b.event_date) return -1;
    if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
    return (a.start_time ?? "").localeCompare(b.start_time ?? "");
  });

  const hasAnyEvents = allEvents.length > 0;
  const hasFilters = search.length > 0 || !!typeId;

  return (
    <PageContainer className="flex flex-col gap-6 pt-4">
      <ExploreControls eventTypes={eventTypes} search={search} typeId={typeId} mode={mode} sort={sort} />

      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">EXPLORE</span>
        <h1 className="font-serif text-[32px] leading-tight text-ice-100">
          The catalogue <span className="text-signal-500">4.0</span>
        </h1>
      </div>

      <div className="abyss-wash flex flex-col gap-2 rounded-lg border border-line-100 bg-abyss-700 px-5 py-5 text-center">
        <p className="font-serif text-lg italic leading-snug text-ice-100">
          SAME CURIOSITY
          <br />A DEEPER TOMORROW
        </p>
        <div className="mx-auto flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-ice-500">
          <span>13 OCT — 18 OCT 2026</span>
          <span className="text-line-200">/</span>
          <span>IGMCRI</span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ice-100">
            {mode === "SCHEDULE" ? "Chronological order" : "All Events"}
          </h2>
          <span className="text-[13px] text-ice-500">{sorted.length} event{sorted.length === 1 ? "" : "s"}</span>
        </div>

        {!hasAnyEvents ? (
          <EmptyState
            title="No events published yet"
            description="The STRIATUM programme is being finalized. Check back soon."
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No events match"
            description="Try a different search term or clear the active filter."
            action={
              hasFilters ? (
                <Link
                  href="/explore"
                  className="inline-flex h-10 items-center rounded-md border border-line-200 px-4 text-[15px] font-semibold text-ice-100 hover:border-signal-500 hover:text-signal-400"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                typeLabel={event.type_id ? typeLabelById[event.type_id] ?? null : null}
                registrationStatus={registrationByEvent[event.id] ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
