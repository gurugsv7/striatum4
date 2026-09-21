import { cn } from "@/lib/utils/cn";

export interface WordmarkProps {
  /** Compact: single line "STRIATUM 4.0". Full: serif lockup with "4.0" in cyan. */
  variant?: "compact" | "full";
  className?: string;
}

/** The STRIATUM 4.0 wordmark. Identity strings are used verbatim — never rephrased. */
export function Wordmark({ variant = "compact", className }: WordmarkProps) {
  if (variant === "full") {
    return (
      <span className={cn("font-serif text-[28px] leading-none text-ice-100", className)}>
        STRIATUM <span className="text-signal-500">4.0</span>
      </span>
    );
  }
  return (
    <span className={cn("font-sans text-[15px] font-semibold leading-none text-ice-100", className)}>
      STRIATUM <span className="text-signal-500">4.0</span>
    </span>
  );
}
