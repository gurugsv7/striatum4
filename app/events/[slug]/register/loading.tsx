import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RegisterLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-1 flex-col gap-6 pt-6 pb-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-md" />
        <Skeleton className="h-[52px] w-full rounded-md" />
      </PageContainer>
    </div>
  );
}
