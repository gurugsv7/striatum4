import { redirect } from "next/navigation";
import Link from "next/link";

import { requireUser, getDelegateState } from "@/lib/auth/guards";
import { listMyRegistrations } from "@/lib/queries/registrations";
import { listMine, unreadCount } from "@/lib/queries/notifications";
import { HomeHeader } from "@/components/home/HomeHeader";
import { DelegateAccessCard } from "@/components/home/DelegateAccessCard";
import { YourEventsSection } from "@/components/home/YourEventsSection";
import { PageContainer } from "@/components/shell/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Signal } from "@/components/signal/Signal";

export default async function HomePage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/signin?next=/home");
  }

  const [delegateState, registrations, notifications, unread] = await Promise.all([
    getDelegateState(user.id),
    listMyRegistrations(user.id),
    listMine(user.id, 20),
    unreadCount(user.id),
  ]);

  const firstName = user.profile.full_name?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="min-h-dvh bg-abyss-900">
      <HomeHeader unread={unread > 0} notifications={notifications} />

      <PageContainer className="flex flex-col gap-10 py-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ice-500">
            {firstName ? "Welcome back" : "Welcome"}
          </p>
          {firstName ? (
            <h1 className="mt-1 font-serif text-[28px] leading-tight text-ice-100">
              <span className="text-signal-400">{firstName}</span>
            </h1>
          ) : (
            <h1 className="mt-1 font-serif text-[28px] leading-tight text-ice-100">
              Good to see you.
            </h1>
          )}
        </div>

        <DelegateAccessCard state={delegateState} fullName={user.profile.full_name} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="flex flex-col gap-4">
            <SectionHeader index="02" eyebrow="EXPLORE" heading="See what awaits." />
            <Panel className="flex flex-col gap-3">
              <p className="text-[15px] leading-[1.55] text-ice-500">
                Browse the full STRIATUM 4.0 catalogue — no Delegate ID required.
              </p>
              <Link href="/explore" className="w-fit">
                <Button variant="secondary" trailingArrow>
                  Explore events
                </Button>
              </Link>
            </Panel>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader index="03" eyebrow="PROGRAMME" heading="Six days." />
            <Panel className="flex flex-col gap-3">
              <p className="text-[15px] leading-[1.55] text-ice-500">
                13 OCT — 18 OCT 2026 · 6 days
              </p>
              <Link href="/programme" className="w-fit">
                <Button variant="secondary" trailingArrow>
                  View schedule
                </Button>
              </Link>
            </Panel>
          </section>
        </div>

        <YourEventsSection registrations={registrations} />

        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Signal orientation="horizontal" variant="dormant" length={40} />
          <p className="max-w-[36ch] font-serif text-xl italic leading-[1.5] text-ice-300">
            &ldquo;A familiar journey, a deeper dive.&rdquo;
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice-700">
            IGMCRI · SIGMA 2026
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
