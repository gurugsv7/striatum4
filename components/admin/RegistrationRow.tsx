'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { approvePendingFreeRegistration, rejectPendingFreeRegistration } from '@/lib/actions/admin';
import { REJECTION_REASONS } from '@/lib/validation/admin';
import type { EventRegistrationWithTeam } from '@/lib/queries/admin';
import { formatDateTime } from '@/lib/format/date';
import { StatusChip } from '@/components/ui/StatusChip';
import { CopyableId } from '@/components/admin/CopyableId';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Field';

export interface RegistrationRowProps {
  registration: EventRegistrationWithTeam;
  delegateIdText: string;
  participantName: string;
  college: string;
  qrIssued: boolean;
  checkedInAt: string | null;
}

export function RegistrationRow({
  registration,
  delegateIdText,
  participantName,
  college,
  qrIssued,
  checkedInAt,
}: RegistrationRowProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0]);
  const [error, setError] = useState<string | null>(null);

  const hasTeam = !!registration.team;
  const isPendingApproval = registration.status === 'PENDING_APPROVAL';

  const handleApprove = async () => {
    setError(null);
    const result = await approvePendingFreeRegistration({ registrationId: registration.id });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setApproveOpen(false);
    router.refresh();
  };

  const handleReject = async () => {
    setError(null);
    const result = await rejectPendingFreeRegistration({
      registrationId: registration.id,
      reason: reason as (typeof REJECTION_REASONS)[number],
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRejectOpen(false);
    router.refresh();
  };

  return (
    <>
      <tr className="border-b border-line-100 last:border-b-0 hover:bg-abyss-700/50">
        <td className="px-3 py-2.5">
          <CopyableId value={registration.registration_code} />
        </td>
        <td className="px-3 py-2.5 text-ice-100">{participantName}</td>
        <td className="px-3 py-2.5">
          <CopyableId value={delegateIdText} />
        </td>
        <td className="px-3 py-2.5 text-ice-300">{college}</td>
        <td className="px-3 py-2.5">
          {hasTeam ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-ice-300 hover:text-signal-400"
            >
              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              Team{registration.team?.name ? ` — ${registration.team.name}` : ''}
            </button>
          ) : (
            'Individual'
          )}
        </td>
        <td className="px-3 py-2.5 text-ice-300">{registration.event?.name ?? '—'}</td>
        <td className="px-3 py-2.5">
          <StatusChip status={registration.status} />
        </td>
        <td className="px-3 py-2.5 text-ice-300">{qrIssued ? 'Issued' : 'Not issued'}</td>
        <td className="px-3 py-2.5 text-ice-300">{checkedInAt ? formatDateTime(checkedInAt) : 'Not checked in'}</td>
        <td className="px-3 py-2.5 text-ice-500">{formatDateTime(registration.registered_at)}</td>
        <td className="px-3 py-2.5 text-right">
          {isPendingApproval ? (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveOpen(true)}
                className="text-[13px] font-semibold text-signal-500 hover:text-signal-400"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="text-[13px] font-semibold text-danger hover:text-danger/80"
              >
                Reject
              </button>
            </div>
          ) : null}
        </td>
      </tr>

      {expanded && registration.team ? (
        <tr className="border-b border-line-100 bg-abyss-800/60">
          <td colSpan={11} className="px-6 py-3">
            {error ? <p className="mb-2 text-[13px] text-danger">{error}</p> : null}
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ice-500">
                Team members ({registration.team.members?.length ?? 0})
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-ice-500">
                      <th className="px-2 py-1">Name</th>
                      <th className="px-2 py-1">Role</th>
                      <th className="px-2 py-1">Email</th>
                      <th className="px-2 py-1">Mobile</th>
                      <th className="px-2 py-1">College</th>
                      <th className="px-2 py-1">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(registration.team.members ?? []).map((m) => (
                      <tr key={m.id} className="border-t border-line-100">
                        <td className="px-2 py-1.5 text-ice-100">{m.full_name}</td>
                        <td className="px-2 py-1.5 text-ice-500">{m.is_lead ? 'Team lead' : 'Member'}</td>
                        <td className="px-2 py-1.5 text-ice-300">{m.email ?? '—'}</td>
                        <td className="px-2 py-1.5 text-ice-300">{m.mobile ?? '—'}</td>
                        <td className="px-2 py-1.5 text-ice-300">{m.college ?? '—'}</td>
                        <td className="px-2 py-1.5 text-ice-300">{m.year ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      ) : null}

      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve this registration?"
        description="This confirms the registration and issues its event QR."
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject this registration?"
        tone="destructive"
        confirmLabel="Reject"
        onConfirm={handleReject}
      >
        <Field label="Reason" htmlFor={`reject-reason-${registration.id}`} required>
          <Select
            id={`reject-reason-${registration.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={REJECTION_REASONS.map((r) => ({ value: r, label: r }))}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
