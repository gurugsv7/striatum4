import { cn } from "@/lib/utils/cn";

export interface SkeletonProps {
  className?: string;
}

/** A deliberately designed loading placeholder — a soft hairline-bordered block with a slow shimmer. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md border border-line-100 bg-abyss-700",
        className,
      )}
    />
  );
}
