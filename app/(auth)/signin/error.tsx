"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-abyss-900 px-6">
      <ErrorState
        title="Couldn't load this page"
        description="Check your connection and try again."
        action={
          <Button size="sm" variant="secondary" onClick={reset}>
            Retry
          </Button>
        }
      />
    </main>
  );
}
