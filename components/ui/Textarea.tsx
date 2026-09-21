import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full resize-y rounded-md border border-line-200 bg-abyss-600 px-3.5 py-3 text-[15px] leading-[1.55] text-ice-100",
          "placeholder:text-ice-700",
          "outline-none transition-colors focus:border-signal-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-danger focus:border-danger",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
