"use client";

import { AppHeader } from "@/components/shell/AppHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-dvh bg-abyss-900">
      <AppHeader />
      <PageContainer className="flex min-h-[60dvh] items-center justify-center py-8">
        <ErrorState
          title="Couldn't load your pass"
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
