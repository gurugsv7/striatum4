import { Bell, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/brand/LogoMark";

export interface AppHeaderProps {
  unread?: boolean;
  onNotificationsClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

/** Compact app header: logo + lockup, notification bell, avatar. */
export function AppHeader({
  unread = false,
  onNotificationsClick,
  onAvatarClick,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-3 border-b border-line-100 px-4",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <LogoMark size={32} />
        <div className="flex flex-col leading-none">
          <span className="font-sans text-[15px] font-semibold text-ice-100">
            STRIATUM <span className="text-signal-500">4.0</span>
          </span>
          <span className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ice-500">
            IGMCRI · SIGMA 2026
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative inline-flex size-11 items-center justify-center rounded-md text-ice-300 hover:bg-abyss-700 hover:text-ice-100"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unread ? (
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-signal-500" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="Profile"
          className="inline-flex size-11 items-center justify-center rounded-full border border-line-200 text-ice-300 hover:border-signal-500 hover:text-signal-400"
        >
          <User className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
