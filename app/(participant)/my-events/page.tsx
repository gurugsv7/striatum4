import Link from "next/link";
import { PageContainer } from "@/components/shell/PageContainer";
import { AppHeader } from "@/components/shell/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MyEventRow } from "@/components/event/MyEventRow";
import { requireUser } from "@/lib/auth/guards";
import { listMyRegistrations } from "@/lib/queries/registrations";
import { unreadCount } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export default async function MyEventsPage() {
  const user = await requireUser();
  const [registrations, unread] = await Promise.all([
    listMyRegistrations(user.id),
    unreadCount(user.id),
  ]);

  const sorted = [...registrations].sort((a, b) => {
    const da = a.event?.event_date;
    const db = b.event?.event_date;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  });

  return (
    <div className="flex flex-col">
      <AppHeader unread={unread > 0} />
      <PageContainer className="flex flex-col gap-6 pt-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">MY EVENTS</span>
          <h1 className="font-serif text-[28px] text-ice-100">Your registrations</h1>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            title="Nothing registered yet."
            description="Find an event that interests you."
            action={
              <Link
                href="/explore"
                className="inline-flex h-11 items-center rounded-md bg-signal-500 px-5 text-[15px] font-semibold text-abyss-900 hover:bg-signal-400"
              >
                EXPLORE EVENTS →
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((registration) => (
              <MyEventRow key={registration.id} registration={registration} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
