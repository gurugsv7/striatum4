"use client";

import { useEffect, useState } from "react";

export interface ComingSoonCountdownProps {
  /** ISO datetime string — app_settings.launch_date. */
  launchDate: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeRemaining(target: number): Remaining | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * A restrained numeric countdown, rendered only when app_settings.launch_date
 * is configured. Ticks client-side once mounted; server render shows the
 * initial computed value to avoid a layout jump.
 */
export function ComingSoonCountdown({ launchDate }: ComingSoonCountdownProps) {
  const target = new Date(launchDate).getTime();
  const [remaining, setRemaining] = useState<Remaining | null>(() => computeRemaining(target));

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(computeRemaining(target));
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!remaining) return null;

  const units: Array<[string, number]> = [
    ["Days", remaining.days],
    ["Hrs", remaining.hours],
    ["Min", remaining.minutes],
    ["Sec", remaining.seconds],
  ];

  return (
    <div className="flex items-center gap-4" role="timer" aria-label="Time until launch">
      {units.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <span className="font-mono text-xl text-ice-100">{String(value).padStart(2, "0")}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ice-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
