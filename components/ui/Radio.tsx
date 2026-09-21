import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ice-100"
      >
        <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="radio"
            className={cn(
              "peer size-5 shrink-0 appearance-none rounded-full border border-line-200 bg-abyss-600",
              "checked:border-signal-500",
              "outline-none focus-visible:ring-2 focus-visible:ring-signal-400",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          />
          <span className="pointer-events-none absolute size-2.5 scale-0 rounded-full bg-signal-500 transition-transform peer-checked:scale-100" />
        </span>
        <span>{label}</span>
      </label>
    );
  },
);
Radio.displayName = "Radio";
