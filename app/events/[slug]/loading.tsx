import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EventDetailLoading() {
  return (
    <PageContainer className="flex flex-col gap-6 pt-4 pb-24">
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
        <Skeleton className="size-11 rounded-md" />
        <Skeleton className="mx-auto h-5 w-32" />
        <Skeleton className="size-11 rounded-md" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-20 w-full rounded-md" />
      <Skeleton className="h-[52px] w-full rounded-md" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </PageContainer>
  );
}
