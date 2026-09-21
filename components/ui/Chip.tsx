import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  selected?: boolean;
}

export function Chip({ icon, selected, className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium",
        selected
          ? "border-signal-500 bg-signal-500/10 text-signal-400"
          : "border-line-200 text-ice-300",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
