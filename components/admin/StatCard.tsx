import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Panel } from '@/components/ui/Panel';

export interface StatCardProps {
  label: string;
  value: number | string;
  href?: string;
  tone?: 'default' | 'warning' | 'signal' | 'danger';
  icon?: ReactNode;
  className?: string;
}

const TONE_VALUE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-ice-100',
  warning: 'text-warning',
  signal: 'text-signal-400',
  danger: 'text-danger',
};

/** A single operational counter. Every counter links to the filtered view that produced it. */
export function StatCard({ label, value, href, tone = 'default', icon, className }: StatCardProps) {
  const content = (
    <Panel className={cn('flex flex-col gap-2 transition-colors', href && 'hover:border-signal-500/50', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-ice-500">{label}</span>
        {icon ? <span className="text-ice-500">{icon}</span> : null}
      </div>
      <span className={cn('font-mono text-[28px] leading-none', TONE_VALUE_CLASSES[tone])}>{value}</span>
    </Panel>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
