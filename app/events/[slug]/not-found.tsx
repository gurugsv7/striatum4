import Link from "next/link";
import { PageContainer } from "@/components/shell/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EventNotFound() {
  return (
    <PageContainer className="pt-16 pb-24">
      <EmptyState
        title="Event not found"
        description="This event doesn't exist or may have been removed from the programme."
        action={
          <Link
            href="/explore"
            className="inline-flex h-11 items-center rounded-md bg-signal-500 px-5 text-[15px] font-semibold text-abyss-900 hover:bg-signal-400"
          >
            Back to Explore
          </Link>
        }
      />
    </PageContainer>
  );
}
