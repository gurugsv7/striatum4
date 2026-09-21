'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setLaunched } from '@/lib/actions/admin';
import type { AppSettingsRow } from '@/lib/types/database';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export interface LaunchTogglePanelProps {
  settings: AppSettingsRow | null;
}

/** Flips the public site from Coming Soon to live. Confirmed, since it's a one-way visibility change. */
export function LaunchTogglePanel({ settings }: LaunchTogglePanelProps) {
  const router = useRouter();
  const [launched, setLaunchedState] = useState(settings?.launched ?? false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setError(null);
    const result = await setLaunched({ launched: !launched });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLaunchedState(result.data.launched);
    setConfirmOpen(false);
    router.refresh();
  };

  return (
    <Panel className="flex flex-col gap-3">
      <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Launch state</h3>
      <p className="text-[13px] text-ice-500">
        {launched
          ? 'The site is live — visitors see Welcome / Sign in.'
          : 'The site is showing Coming Soon to every visitor.'}
      </p>
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      <div>
        <Button
          type="button"
          variant={launched ? 'destructive' : 'primary'}
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          {launched ? 'Revert to Coming Soon' : 'Launch the site'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={launched ? 'Revert to Coming Soon?' : 'Launch the site?'}
        tone={launched ? 'destructive' : 'primary'}
        description={
          launched
            ? 'Visitors will immediately see the Coming Soon screen again instead of Welcome / Sign in.'
            : 'This makes the site publicly live immediately — every visitor will see Welcome / Sign in instead of Coming Soon.'
        }
        confirmLabel={launched ? 'Revert' : 'Launch'}
        onConfirm={handleToggle}
      />
    </Panel>
  );
}
