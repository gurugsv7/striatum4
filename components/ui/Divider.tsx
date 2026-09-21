import { cn } from "@/lib/utils/cn";

export interface DividerProps {
  label?: string;
  className?: string;
}

/** A plain hairline rule, optionally carrying a centered label (e.g. "or"). */
export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={cn("border-t border-line-100", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-line-100" />
      <span className="text-[13px] text-ice-500">{label}</span>
      <span className="h-px flex-1 bg-line-100" />
    </div>
  );
}
