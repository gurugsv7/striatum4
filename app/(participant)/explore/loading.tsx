import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ExploreLoading() {
  return (
    <PageContainer className="flex flex-col gap-6 pt-4">
      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-2">
        <Skeleton className="size-11 rounded-md" />
        <Skeleton className="mx-auto h-5 w-32" />
        <Skeleton className="h-11 w-24 rounded-md" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[86px] w-full rounded-md" />
        ))}
      </div>
    </PageContainer>
  );
}
