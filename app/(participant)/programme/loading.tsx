import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProgrammeLoading() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-16 w-full rounded-none" />
      <PageContainer className="flex flex-col gap-6 pt-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
