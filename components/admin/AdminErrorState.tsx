'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';

export interface AdminErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

/** Shared error boundary content for admin routes. */
export function AdminErrorState({
  error,
  reset,
  title = 'Something went wrong.',
  description = 'This screen could not load. Try again — if this keeps happening, check the network tab or Supabase status.',
}: AdminErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title={title}
      description={description}
      action={
        <Button variant="secondary" size="sm" onClick={() => reset()}>
          Try again
        </Button>
      }
    />
  );
}
