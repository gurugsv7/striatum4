'use client';

/**
 * STRIATUM 4.0 admin — operations sidebar.
 *
 * Persistent on desktop; collapses to a drawer under 1024px. Current
 * section is marked with a Signal accent, per docs/01-DESIGN-SYSTEM.md §10.
 */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  Wallet,
  CalendarDays,
  ClipboardList,
  ScanLine,
  Trophy,
  Settings,
  ShieldCheck,
  Download,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/delegates', label: 'Delegates', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: Wallet },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/event-registrations', label: 'Event Registrations', icon: ClipboardList },
  { href: '/admin/checkin', label: 'Check-In', icon: ScanLine },
  { href: '/admin/results', label: 'Results', icon: Trophy },
  { href: '/admin/settings/payments', label: 'Settings', icon: Settings },
  { href: '/admin/settings/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/admin/exports', label: 'Exports', icon: Download },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate, isFinance }: { pathname: string; onNavigate?: () => void; isFinance: boolean }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.filter((item) => isFinance || !['/admin/payments', '/admin/settings/payments', '/admin/exports'].some((p) => item.href === p || item.href.startsWith(`${p}/`))).map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group relative flex h-10 items-center gap-3 rounded-md px-3 text-[14px] font-medium transition-colors',
              active
                ? 'bg-abyss-700 text-ice-100'
                : 'text-ice-500 hover:bg-abyss-700/60 hover:text-ice-300'
            )}
          >
            <span
              className={cn(
                'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-signal-500 transition-opacity',
                active ? 'opacity-100' : 'opacity-0'
              )}
              aria-hidden="true"
            />
            <Icon
              className={cn('size-4 shrink-0', active ? 'text-signal-400' : 'text-ice-500')}
              aria-hidden="true"
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ isFinance }: { isFinance: boolean }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line-100 bg-abyss-800 lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-line-100 px-4">
          <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-signal-500">
            STRIATUM 4.0
          </span>
        </div>
        <NavLinks pathname={pathname} isFinance={isFinance} />
        <div className="border-t border-line-100 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.1em] text-ice-700">
            Operations Console
          </p>
        </div>
      </aside>

      {/* Narrow screens: menu button + drawer */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex size-10 items-center justify-center rounded-md border border-line-200 bg-abyss-800 text-ice-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-abyss-900/80"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-line-100 bg-abyss-800">
            <div className="flex h-14 items-center justify-between border-b border-line-100 px-4">
              <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-signal-500">
                STRIATUM 4.0
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="inline-flex size-8 items-center justify-center rounded-md text-ice-300 hover:bg-abyss-700"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <NavLinks pathname={pathname} isFinance={isFinance} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
