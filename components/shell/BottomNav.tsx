"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Signal } from "@/components/signal/Signal";

const ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/my-events", label: "My Events", icon: Ticket },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export interface BottomNavProps {
  className?: string;
}

/** Fixed bottom navigation. The Signal moves to whichever item is active. */
export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line-100 bg-abyss-900/95 backdrop-blur",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-[480px] items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-[12px] font-medium"
              >
                <Icon
                  className={cn("size-5", active ? "text-signal-500" : "text-ice-500")}
                  aria-hidden="true"
                />
                <span className={active ? "text-ice-100" : "text-ice-500"}>{item.label}</span>
                <Signal
                  variant={active ? "arrived" : "dormant"}
                  length={16}
                  className={cn("transition-opacity", active ? "opacity-100" : "opacity-0")}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
