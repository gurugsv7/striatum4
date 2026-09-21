import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Signal } from "@/components/signal/Signal";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** A deliberately designed empty state — never a bare "nothing here" fallback. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "abyss-wash flex flex-col items-center gap-3 rounded-lg border border-line-100 px-6 py-12 text-center",
        className,
      )}
    >
      <Signal variant="dormant" orientation="vertical" length={28} />
      <h3 className="font-serif text-xl text-ice-100">{title}</h3>
      {description ? (
        <p className="max-w-[32ch] text-[15px] leading-[1.55] text-ice-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
