"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  /** Required — IconButton has no visible label, so this drives aria-label. */
  label: string;
  variant?: "ghost" | "outline";
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = "ghost", active = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-md transition-colors",
          variant === "outline" && "border border-line-200",
          active
            ? "text-signal-500 bg-abyss-700"
            : "text-ice-300 hover:text-ice-100 hover:bg-abyss-700",
          "disabled:cursor-not-allowed disabled:text-ice-700",
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
