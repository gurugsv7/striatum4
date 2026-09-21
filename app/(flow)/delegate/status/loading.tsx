import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-abyss-900">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-col items-center gap-6 py-8">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </PageContainer>
    </div>
  );
}
