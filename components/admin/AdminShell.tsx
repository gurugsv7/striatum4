import type { ReactNode } from 'react';
import { ADMIN_ROLE_LABELS, type AdminRole } from '@/lib/types/enums';
import { AdminSidebar } from './AdminSidebar';
import { SignOutButton } from './SignOutButton';

export interface AdminShellProps {
  adminEmail: string;
  adminRole: AdminRole;
  children: ReactNode;
}

/** The operations shell: persistent sidebar + compact top bar + dense content area. */
export function AdminShell({ adminEmail, adminRole, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-abyss-900 text-ice-100">
      <AdminSidebar adminRole={adminRole} isFinance={adminEmail.toLowerCase() === 'financesigma26@gmail.com'} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line-100 bg-abyss-900/95 px-4 pl-16 backdrop-blur lg:pl-6">
          <p className="truncate text-[13px] text-ice-500">
            <span className="hidden sm:inline">STRIATUM 4.0 · </span>Operations Console
          </p>
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="truncate text-[13px] font-medium text-ice-100">{adminEmail}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-signal-500">
                {ADMIN_ROLE_LABELS[adminRole]}
              </span>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
