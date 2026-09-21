import { cn } from "@/lib/utils/cn";
import { Signal, type SignalVariant } from "./Signal";

export interface SignalRuleProps {
  /** Optional label rendered above the rule, e.g. a stepper caption. */
  label?: string;
  variant?: SignalVariant;
  className?: string;
}

/**
 * A hairline section divider carrying a dormant (or active) Signal dot.
 * Used between numbered sections and as a lightweight stepper segment.
 */
export function SignalRule({
  label,
  variant = "dormant",
  className,
}: SignalRuleProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label ? (
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ice-500">
          {label}
        </span>
      ) : null}
      <div className="flex w-full items-center gap-2">
        <Signal variant={variant} orientation="horizontal" length={20} />
        <span className="h-px flex-1 bg-line-100" />
      </div>
    </div>
  );
}
