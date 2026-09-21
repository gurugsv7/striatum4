"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface MembraneTransitionProps {
  /** Set true to trigger the expansion once. */
  active: boolean;
  /** Called after the ripple finishes (~650-850ms). */
  onComplete?: () => void;
  className?: string;
}

/**
 * A full-viewport translucent cyan membrane/ripple expansion, used for the
 * Welcome → Auth transition. Fixed-position overlay, one-shot, never a
 * cartoon bubble. Duration 650-850ms (collapses to a short fade under
 * prefers-reduced-motion via the global animation-duration override).
 */
export function MembraneTransition({
  active,
  onComplete,
  className,
}: MembraneTransitionProps) {
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!active) return;
    const node = ringRef.current;
    if (!node) return;
    const handle = () => onComplete?.();
    node.addEventListener("animationend", handle);
    return () => node.removeEventListener("animationend", handle);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      <span
        ref={ringRef}
        className="block h-[60vmax] w-[60vmax] rounded-full bg-signal-500/25 [animation:membrane-expand_750ms_cubic-bezier(0.16,1,0.3,1)_1]"
        style={{
          boxShadow: "0 0 120px 40px var(--signal-400)",
        }}
      />
    </div>
  );
}
