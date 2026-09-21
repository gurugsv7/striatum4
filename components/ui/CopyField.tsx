"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CopyFieldProps {
  label?: string;
  value: string;
  className?: string;
}

/** A read-only value (UPI ID, Delegate ID, token) with a one-tap copy affordance. */
export function CopyField({ label, value, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently no-op, value remains selectable
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <span className="text-[13px] font-medium text-ice-300">{label}</span> : null}
      <div className="flex h-11 items-center justify-between gap-2 rounded-md border border-line-200 bg-abyss-600 pl-3.5 pr-1.5">
        <span className="truncate font-mono text-sm text-ice-100">{value}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded text-ice-500 hover:bg-abyss-700 hover:text-signal-400"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
