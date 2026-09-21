import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface SectionHeaderProps {
  /** e.g. "01" for a numbered eyebrow like "01 / DELEGATE ACCESS". */
  index?: string;
  eyebrow: string;
  heading: string;
  action?: ReactNode;
  className?: string;
}

/** Numbered eyebrow + serif heading, the recurring section marker across the product. */
export function SectionHeader({
  index,
  eyebrow,
  heading,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
          {index ? `${index} / ${eyebrow}` : eyebrow}
        </span>
        <h2 className="font-serif text-[22px] text-ice-100">{heading}</h2>
      </div>
      {action}
    </div>
  );
}
