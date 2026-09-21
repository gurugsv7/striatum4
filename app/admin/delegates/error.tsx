'use client';

import { AdminErrorState } from '@/components/admin/AdminErrorState';

export default function AdminDelegatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminErrorState error={error} reset={reset} title="Could not load delegate applications." />;
}
