import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-abyss-900 pb-24">
      <div className="flex h-16 items-center justify-between border-b border-line-100 px-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-11 rounded-md" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>

      <PageContainer className="flex flex-col gap-10 py-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-44 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </PageContainer>
    </div>
  );
}
