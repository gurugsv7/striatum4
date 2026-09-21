import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
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
            type="checkbox"
            className={cn(
              "peer size-5 shrink-0 appearance-none rounded-[5px] border border-line-200 bg-abyss-600",
              "checked:border-signal-500 checked:bg-signal-500",
              "outline-none focus-visible:ring-2 focus-visible:ring-signal-400",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          />
          <Check
            className="pointer-events-none absolute size-3.5 text-abyss-900 opacity-0 peer-checked:opacity-100"
            aria-hidden="true"
          />
        </span>
        <span>{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
