import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, invalid, className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3.5 flex size-4 items-center justify-center text-ice-500">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full rounded-md border border-line-200 bg-abyss-600 px-3.5 text-[15px] text-ice-100",
            "placeholder:text-ice-700",
            "outline-none transition-colors focus:border-signal-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-danger focus:border-danger",
            leadingIcon && "pl-10",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";
