'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CopyableIdProps {
  value: string;
  className?: string;
  /** Truncate long UUIDs to their first N characters for dense table cells. */
  truncateTo?: number;
}

/** A mono-styled identifier with a one-tap copy affordance, for dense table cells. */
export function CopyableId({ value, className, truncateTo }: CopyableIdProps) {
  const [copied, setCopied] = useState(false);
  const display = truncateTo && value.length > truncateTo ? `${value.slice(0, truncateTo)}…` : value;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={value}
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[13px] text-ice-300 hover:text-signal-400',
        className
      )}
    >
      {display}
      {copied ? (
        <Check className="size-3 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3 opacity-50" aria-hidden="true" />
      )}
    </button>
  );
}
