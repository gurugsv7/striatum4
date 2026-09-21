import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ResultsLoading() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-16 w-full rounded-none" />
      <PageContainer className="flex flex-col gap-6 pt-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
