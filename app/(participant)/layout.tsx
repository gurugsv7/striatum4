import { BottomNav } from "@/components/shell/BottomNav";

/**
 * Shared shell for the participant surfaces this deliverable owns (Explore,
 * My Events, Programme, Results): fixed BottomNav with safe-area padding
 * reserved below the content. Each page renders its own top header — Explore
 * uses the back/lockup/search header from the mockup, the others use the
 * compact AppHeader — since docs/01-DESIGN-SYSTEM.md §7 gives Explore a
 * distinct header rather than the generic one.
 */
export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
