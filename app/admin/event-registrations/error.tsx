'use client';

import { AdminErrorState } from '@/components/admin/AdminErrorState';

export default function AdminEventRegistrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminErrorState error={error} reset={reset} title="Could not load event registrations." />;
}
