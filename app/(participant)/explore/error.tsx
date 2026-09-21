"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/shell/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";

export default function ExploreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="pt-16">
      <ErrorState
        title="Couldn't load Explore"
        description="Something went wrong loading the event catalogue. Check your connection and try again."
        action={
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
        }
      />
    </PageContainer>
  );
}
