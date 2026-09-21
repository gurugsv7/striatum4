import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EventPassLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-1 flex-col gap-4 pt-6 pb-10">
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </PageContainer>
    </div>
  );
}
