"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./IconButton";

export interface LightboxProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  /** Optional adjacent images to page through with arrow keys (admin screenshot review). */
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

/** Keyboard-operable image lightbox: Esc closes, ← → page, +/- zoom, open full size. */
export function Lightbox({ open, onClose, src, alt, onPrev, onNext, className }: LightboxProps) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setZoomed(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "+" || e.key === "=") setZoomed(true);
      if (e.key === "-") setZoomed(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className={cn(
        "fixed inset-0 z-[70] flex flex-col bg-abyss-900/95",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-line-100 px-4 py-3">
        <p className="truncate text-[13px] text-ice-500">{alt}</p>
        <div className="flex items-center gap-1.5">
          <IconButton
            icon={zoomed ? <ZoomOut className="size-4" /> : <ZoomIn className="size-4" />}
            label={zoomed ? "Zoom out" : "Zoom in"}
            onClick={() => setZoomed((z) => !z)}
          />
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex size-11 items-center justify-center rounded-md text-ice-300 hover:bg-abyss-700 hover:text-ice-100"
            aria-label="Open full size"
            title="Open full size"
          >
            <ExternalLink className="size-4" />
          </a>
          <IconButton icon={<X className="size-4" />} label="Close" onClick={onClose} />
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-auto p-4">
        {onPrev ? (
          <IconButton
            icon={<ChevronLeft className="size-5" />}
            label="Previous"
            onClick={onPrev}
            className="absolute left-3"
          />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "max-h-full max-w-full select-none rounded-md transition-transform",
            zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in",
          )}
          onClick={() => setZoomed((z) => !z)}
        />
        {onNext ? (
          <IconButton
            icon={<ChevronRight className="size-5" />}
            label="Next"
            onClick={onNext}
            className="absolute right-3"
          />
        ) : null}
      </div>
    </div>
  );
}
