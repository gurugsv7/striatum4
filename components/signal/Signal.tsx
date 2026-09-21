"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export type SignalVariant = "dormant" | "travelling" | "arrived" | "pulse";
export type SignalOrientation = "horizontal" | "vertical";

export interface SignalProps {
  /** Motion state of the point along the line. */
  variant?: SignalVariant;
  /** Axis the line/point travels along. */
  orientation?: SignalOrientation;
  /** Length of the structural line in px. */
  length?: number;
  className?: string;
}

/**
 * The Signal — a tiny cyan bioluminescent point travelling along a thin
 * structural line. Never an ECG waveform: a single straight hairline, a
 * single point, a soft bloom. See docs/01-DESIGN-SYSTEM.md §4.
 */
export function Signal({
  variant = "dormant",
  orientation = "horizontal",
  length = 64,
  className,
}: SignalProps) {
  const id = useId();
  const bloomId = `signal-bloom-${id}`;
  const isHorizontal = orientation === "horizontal";

  const thickness = 8; // px, cross-axis span for the bloom
  const width = isHorizontal ? length : thickness;
  const height = isHorizontal ? thickness : length;
  const mid = thickness / 2;

  const atEnd = variant === "arrived" || variant === "pulse";
  const pointStyle = {
    "--sig-len": `${length - thickness}px`,
    transform: atEnd
      ? `translate${isHorizontal ? "X" : "Y"}(${length - thickness}px)`
      : undefined,
  } as React.CSSProperties;

  const pointAnimationClass =
    variant === "travelling"
      ? isHorizontal
        ? "[animation:signal-travel-x_900ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
        : "[animation:signal-travel-y_900ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
      : "";

  const bloomAnimationClass =
    variant === "pulse"
      ? "[animation:signal-pulse-bloom_1200ms_ease-out_1]"
      : "";

  const dormant = variant === "dormant";

  return (
    <svg
      role="img"
      aria-label={`Signal: ${variant}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <radialGradient id={bloomId}>
          <stop offset="0%" stopColor="var(--signal-400)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--signal-400)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* structural hairline */}
      <line
        x1={isHorizontal ? mid : mid}
        y1={isHorizontal ? mid : mid}
        x2={isHorizontal ? width - mid : mid}
        y2={isHorizontal ? mid : height - mid}
        stroke="var(--line-200)"
        strokeWidth={1}
      />

      {/* travelling group: bloom + point share the same transform */}
      <g style={pointStyle} className={pointAnimationClass}>
        <circle
          cx={mid}
          cy={mid}
          r={6}
          fill={`url(#${bloomId})`}
          opacity={dormant ? 0.15 : 0.5}
          className={bloomAnimationClass}
        />
        <circle
          cx={mid}
          cy={mid}
          r={dormant ? 1.5 : 2}
          fill="var(--signal-500)"
          opacity={dormant ? 0.4 : 1}
        />
      </g>
    </svg>
  );
}
