import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Raised ground vs. the default panel ground. */
  raised?: boolean;
  /** Apply the single-source radial depth wash. */
  wash?: boolean;
}

/** A hairline-bordered surface. Never a drop shadow, never a pill radius. */
export function Panel({ raised, wash, className, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line-100 p-5",
        raised ? "bg-abyss-600" : "bg-abyss-700",
        wash && "abyss-wash",
        className,
      )}
      {...props}
    />
  );
}
