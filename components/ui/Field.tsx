import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Label + control + hint/error. Errors are always rendered at readable size
 * (13px) — never hidden in microtype.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ice-300">
        {label}
        {required ? <span className="text-signal-500"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-ice-500">{hint}</p>
      ) : null}
    </div>
  );
}
