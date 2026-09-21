"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/shell/PageContainer";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-dvh bg-abyss-900">
      <PageContainer className="flex min-h-dvh items-center justify-center py-8">
        <ErrorState
          title="Couldn't load Home"
          description="Check your connection and try again."
          action={
            <Button size="sm" variant="secondary" onClick={reset}>
              Retry
            </Button>
          }
        />
      </PageContainer>
    </div>
  );
}
