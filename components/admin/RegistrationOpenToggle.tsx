'use client';

import { useState, useTransition } from 'react';
import { toggleRegistrationOpen } from '@/lib/actions/admin';
import { cn } from '@/lib/utils/cn';

export interface RegistrationOpenToggleProps {
  eventId: string;
  open: boolean;
}

/** Fast Registration Open/Closed toggle from the events list view. */
export function RegistrationOpenToggle({ eventId, open }: RegistrationOpenToggleProps) {
  const [current, setCurrent] = useState(open);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const next = !current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleRegistrationOpen({ eventId, open: next });
      if (!result.ok) {
        setCurrent(!next);
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={current}
        disabled={pending}
        onClick={handleToggle}
        className={cn(
          'inline-flex h-7 w-12 items-center rounded-full border transition-colors disabled:opacity-60',
          current ? 'border-signal-500 bg-signal-500/20' : 'border-line-200 bg-abyss-600'
        )}
      >
        <span
          className={cn(
            'inline-block size-5 translate-x-0.5 rounded-full bg-ice-100 transition-transform',
            current && 'translate-x-[22px] bg-signal-400'
          )}
        />
      </button>
      <span className="text-[11px] text-ice-500">{current ? 'Open' : 'Closed'}</span>
      {error ? <span className="text-[11px] text-danger">{error}</span> : null}
    </div>
  );
}
