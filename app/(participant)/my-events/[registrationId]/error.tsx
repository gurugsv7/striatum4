"use client";

import { useEffect } from "react";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";

export default function EventPassError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-1 flex-col pt-16">
        <ErrorState
          title="Couldn't load this pass"
          description="Something went wrong. Check your connection and try again."
          action={
            <Button variant="secondary" onClick={reset}>
              Try again
            </Button>
          }
        />
      </PageContainer>
    </div>
  );
}
