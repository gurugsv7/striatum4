"use client";

import { cn } from "@/lib/utils/cn";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex h-11 items-center gap-1 rounded-md border border-line-100 bg-abyss-700 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-full items-center rounded-[6px] px-3.5 text-[13px] font-semibold transition-colors",
              active
                ? "bg-signal-500 text-abyss-900"
                : "text-ice-500 hover:text-ice-100",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
