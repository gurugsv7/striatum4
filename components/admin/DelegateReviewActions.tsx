'use client';

/**
 * STRIATUM 4.0 admin — delegate payment approve/reject controls.
 *
 * Calls the idempotent SQL-backed actions in lib/actions/admin.ts directly
 * (approveDelegatePayment / rejectDelegatePayment). Both are safe to call
 * twice: approving an already-APPROVED submission returns the existing
 * delegates row rather than erroring (no double Delegate ID issuance), and
 * the UI disables itself for the duration of the call to make
 * double-submission impossible from this side too.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveDelegatePayment, rejectDelegatePayment } from '@/lib/actions/admin';
import { REJECTION_REASONS } from '@/lib/validation/admin';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { CopyableId } from '@/components/admin/CopyableId';

export interface DelegateReviewActionsProps {
  submissionId: string;
  disabled?: boolean;
}

export function DelegateReviewActions({ submissionId, disabled }: DelegateReviewActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0]);
  const [allowResubmit, setAllowResubmit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuedDelegateId, setIssuedDelegateId] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);

  const handleApprove = async () => {
    setError(null);
    const result = await approveDelegatePayment({ submissionId, note: note || undefined });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIssuedDelegateId(result.data.delegate_id);
    setApproveOpen(false);
    router.refresh();
  };

  const handleReject = async () => {
    setError(null);
    const result = await rejectDelegatePayment({
      submissionId,
      reason: reason as (typeof REJECTION_REASONS)[number],
      note: note || undefined,
      allowResubmit,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRejected(true);
    setRejectOpen(false);
    router.refresh();
  };

  if (issuedDelegateId) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-signal-500/40 bg-signal-500/10 p-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-signal-400">
          Delegate ID issued
        </p>
        <CopyableId value={issuedDelegateId} className="text-[18px]" />
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-4">
        <p className="text-[14px] font-semibold text-danger">
          Payment {allowResubmit ? 'sent back for resubmission' : 'rejected'}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={disabled}
          onClick={() => {
            setNote('');
            setApproveOpen(true);
          }}
        >
          Approve payment
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={disabled}
          onClick={() => {
            setNote('');
            setReason(REJECTION_REASONS[0]);
            setAllowResubmit(true);
            setRejectOpen(true);
          }}
        >
          Reject / request resubmission
        </Button>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve delegate payment?"
        description="This issues a Delegate ID immediately and cannot be undone from here."
        confirmLabel="Approve payment"
        onConfirm={handleApprove}
      >
        <Field label="Admin note (optional)" htmlFor="approve-note">
          <Textarea id="approve-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject this payment?"
        tone="destructive"
        confirmLabel={allowResubmit ? 'Request resubmission' : 'Reject payment'}
        onConfirm={handleReject}
      >
        <div className="flex flex-col gap-3">
          <Field label="Reason" htmlFor="reject-reason" required>
            <Select
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={REJECTION_REASONS.map((r) => ({ value: r, label: r }))}
            />
          </Field>
          <Field label="Admin note (optional)" htmlFor="reject-note">
            <Textarea id="reject-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </Field>
          <Checkbox
            id="allow-resubmit"
            checked={allowResubmit}
            onChange={(e) => setAllowResubmit(e.target.checked)}
            label="Allow the participant to resubmit a new screenshot"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
