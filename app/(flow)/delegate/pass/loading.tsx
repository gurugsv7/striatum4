import { AppHeader } from "@/components/shell/AppHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-abyss-900 pb-24">
      <AppHeader />
      <PageContainer className="flex flex-col gap-8 py-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-11 w-full" />
      </PageContainer>
    </div>
  );
}
