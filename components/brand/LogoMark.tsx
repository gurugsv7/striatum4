"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** A neutral hairline mark used if the official logo asset fails to load. */
function FallbackMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="STRIATUM 4.0">
      <circle cx="24" cy="24" r="21" stroke="var(--signal-500)" strokeWidth={1} opacity={0.6} />
      <circle cx="24" cy="24" r="14" stroke="var(--line-200)" strokeWidth={1} strokeDasharray="1 5" />
      <line x1={24} y1={8} x2={24} y2={40} stroke="var(--signal-500)" strokeWidth={1} opacity={0.8} />
      <circle cx={24} cy={24} r={2.5} fill="var(--signal-500)" />
    </svg>
  );
}

/**
 * Renders the official logo asset if present at /public/brand/striatum-logo.svg,
 * otherwise falls back to a neutral hairline mark. The asset slot is swappable
 * without any code change.
 */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <FallbackMark size={size} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/striatum-logo.svg"
          alt="STRIATUM 4.0"
          width={size}
          height={size}
          className="h-full w-full"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
