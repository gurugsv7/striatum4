import Link from "next/link";
import { PageContainer } from "@/components/shell/PageContainer";
import { AppHeader } from "@/components/shell/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventResultsPanel } from "@/components/event/EventResultsPanel";
import { requireUser } from "@/lib/auth/guards";
import { listPublishedResults } from "@/lib/queries/results";
import { unreadCount } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const user = await requireUser();
  const [results, unread] = await Promise.all([listPublishedResults(), unreadCount(user.id)]);

  return (
    <div className="flex flex-col">
      <AppHeader unread={unread > 0} />
      <PageContainer className="flex flex-col gap-6 pt-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">RESULTS</span>
          <h1 className="font-serif text-[28px] text-ice-100">Published results</h1>
        </div>

        {results.length === 0 ? (
          <EmptyState
            title="RESULTS NOT PUBLISHED"
            description="Results are published here as each event concludes."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {results.map((result) => (
              <div key={result.id} className="flex flex-col gap-2.5">
                {result.event ? (
                  <Link
                    href={`/events/${result.event.slug}`}
                    className="text-[17px] font-semibold text-ice-100 hover:text-signal-400"
                  >
                    {result.event.name}
                  </Link>
                ) : null}
                <EventResultsPanel result={result} />
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
