"use client";

import { cn } from "@/lib/utils/cn";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Underline tab bar. Each tab meets the 44px touch target. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("flex items-center gap-6 border-b border-line-100", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative flex h-11 items-center text-[15px] font-medium transition-colors",
              active ? "text-ice-100" : "text-ice-500 hover:text-ice-300",
            )}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-signal-500" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
