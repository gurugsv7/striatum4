"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./IconButton";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Bottom sheet for mobile-first flows (filters, quick actions). */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-abyss-900/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[85dvh] w-full flex-col rounded-t-lg border-t border-line-100 bg-abyss-700",
          "pb-[env(safe-area-inset-bottom)] sm:w-[min(92vw,480px)] sm:rounded-lg sm:border",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-line-100 px-5 py-4">
          {title ? (
            <h2 className="font-sans text-[17px] font-semibold text-ice-100">{title}</h2>
          ) : (
            <span />
          )}
          <IconButton icon={<X className="size-4" />} label="Close" onClick={onClose} />
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
