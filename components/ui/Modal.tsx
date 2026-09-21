"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./IconButton";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Centered dialog. Keyboard-operable: Esc closes, focus is trapped by the browser's dialog element. */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      aria-label={title}
      className={cn(
        "m-auto w-[min(92vw,480px)] rounded-lg border border-line-100 bg-abyss-700 p-0 text-ice-100",
        "backdrop:bg-abyss-900/80",
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
      <div className="p-5">{children}</div>
    </dialog>
  );
}
