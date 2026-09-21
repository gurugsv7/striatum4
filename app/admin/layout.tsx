import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AuthError, requireAdmin } from '@/lib/auth/guards';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Operations Console — STRIATUM 4.0',
};

/**
 * Auth guard #1 of 3 (see docs/03-ARCHITECTURE.md §3): every request that
 * reaches an /admin/** page passes through this layout. Middleware is a
 * first gate for navigation only — this call is independent and
 * authoritative for rendering. Every server action under this deliverable
 * additionally calls requireAdmin() itself before touching data.
 *
 * A participant who guesses an /admin URL is redirected to /signin with no
 * confirmation that admin data or the route itself exists.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.code === 'UNAUTHENTICATED') {
      redirect('/signin');
    }
    // NOT_ADMIN (or anything else): reveal nothing — redirect exactly like an
    // unauthenticated visitor would be, no "you are not allowed" message.
    redirect('/signin');
  }

  return (
    <AdminShell adminEmail={admin.email} adminRole={admin.role}>
      {children}
    </AdminShell>
  );
}
