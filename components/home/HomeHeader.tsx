"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/shell/AppHeader";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeTime } from "@/lib/format/relative-time";
import type { NotificationRow } from "@/lib/types/database";

export interface HomeHeaderProps {
  unread: boolean;
  notifications: NotificationRow[];
}

/** Client wrapper around <AppHeader> wiring the notification bell + avatar. */
export function HomeHeader({ unread, notifications }: HomeHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppHeader
        unread={unread}
        onNotificationsClick={() => setOpen(true)}
        onAvatarClick={() => router.push("/profile")}
      />
      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications">
        {notifications.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            description="Payment updates, delegate activation and event confirmations will show up here."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <li key={n.id} className="rounded-md border border-line-100 p-3">
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 text-left"
                  onClick={() => {
                    setOpen(false);
                    if (n.link) router.push(n.link);
                  }}
                >
                  <p className="text-[15px] font-medium text-ice-100">{n.title}</p>
                  {n.body ? <p className="text-[13px] text-ice-500">{n.body}</p> : null}
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ice-700">
                    {relativeTime(n.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}
