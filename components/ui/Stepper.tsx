import { cn } from "@/lib/utils/cn";
import { Signal } from "@/components/signal/Signal";

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the current step. */
  currentIndex: number;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

/** Numbered stepper with the Signal travelling the connecting line between steps. */
export function Stepper({
  steps,
  currentIndex,
  orientation = "vertical",
  className,
}: StepperProps) {
  const vertical = orientation === "vertical";
  return (
    <ol
      className={cn(
        "flex",
        vertical ? "flex-col gap-0" : "flex-row items-start gap-0",
        className,
      )}
    >
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <li
            key={step.label}
            className={cn("flex", vertical ? "flex-row gap-3" : "flex-1 flex-col gap-3")}
          >
            <div className={cn("flex items-center", vertical ? "flex-col" : "flex-row w-full")}>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                  done && "border-signal-500 bg-signal-500 text-abyss-900",
                  active && "border-signal-500 text-signal-400",
                  !done && !active && "border-line-200 text-ice-700",
                )}
              >
                {i + 1}
              </span>
              {!isLast ? (
                <Signal
                  variant={done ? "arrived" : "dormant"}
                  orientation={vertical ? "vertical" : "horizontal"}
                  length={vertical ? 40 : 64}
                  className={vertical ? "my-1" : "mx-1 flex-1"}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "pb-6 text-[13px] font-medium",
                active ? "text-ice-100" : "text-ice-500",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
