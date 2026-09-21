import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** A deliberately designed error state, used for network failures and load errors. */
export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertTriangle className="size-6 text-danger" aria-hidden="true" />
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
