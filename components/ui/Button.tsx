"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Signal } from "@/components/signal/Signal";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Show a trailing arrow, per the "CTA →" convention used throughout copy. */
  trailingArrow?: boolean;
  children: ReactNode;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-[52px] px-6 text-base gap-2",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-signal-500 text-abyss-900 hover:bg-signal-400 active:bg-signal-600 disabled:bg-line-200 disabled:text-ice-700",
  secondary:
    "bg-transparent text-ice-100 border border-line-200 hover:border-signal-500 hover:text-signal-400 disabled:border-line-100 disabled:text-ice-700",
  ghost:
    "bg-transparent text-ice-300 hover:text-ice-100 hover:bg-abyss-700 disabled:text-ice-700",
  destructive:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger/10 disabled:border-line-100 disabled:text-ice-700",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      trailingArrow = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex min-w-11 items-center justify-center rounded-md font-sans font-semibold transition-colors",
          "disabled:cursor-not-allowed",
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {variant === "primary" && !loading ? (
          <Signal variant="dormant" length={14} className="shrink-0" />
        ) : null}
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : null}
        <span className="truncate">{children}</span>
        {trailingArrow && !loading ? (
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        ) : null}
      </button>
    );
  },
);
Button.displayName = "Button";
