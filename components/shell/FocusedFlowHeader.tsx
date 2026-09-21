"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Wordmark } from "@/components/brand/Wordmark";

export interface FocusedFlowHeaderProps {
  /** Called instead of router.back() when provided. */
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

/**
 * Back arrow + centered brand lockup, used where BottomNav is hidden: auth,
 * delegate registration/payment, event registration/payment.
 */
export function FocusedFlowHeader({ onBack, rightSlot, className }: FocusedFlowHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "grid h-16 grid-cols-[44px_1fr_44px] items-center border-b border-line-100 px-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => (onBack ? onBack() : router.back())}
        aria-label="Go back"
        className="inline-flex size-11 items-center justify-center rounded-md text-ice-300 hover:bg-abyss-700 hover:text-ice-100"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>
      <div className="flex justify-center">
        <Wordmark variant="compact" />
      </div>
      <div className="flex justify-end">{rightSlot}</div>
    </header>
  );
}
