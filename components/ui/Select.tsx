import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, invalid, className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-line-200 bg-abyss-600 px-3.5 pr-10 text-[15px] text-ice-100",
            "outline-none transition-colors focus:border-signal-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-danger focus:border-danger",
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 size-4 text-ice-500"
          aria-hidden="true"
        />
      </div>
    );
  },
);
Select.displayName = "Select";
