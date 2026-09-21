import { Skeleton } from '@/components/ui/Skeleton';

export interface AdminLoadingSkeletonProps {
  rows?: number;
}

/** Shared loading placeholder for admin list/detail routes. */
export function AdminLoadingSkeleton({ rows = 6 }: AdminLoadingSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
