import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-abyss-900">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-col gap-6 py-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-11 w-full" />
      </PageContainer>
    </div>
  );
}
