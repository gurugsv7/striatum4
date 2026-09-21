'use client';

/**
 * STRIATUM 4.0 admin — the payment review surface. The most important
 * screen in the console: large screenshot beside participant/payment
 * details, Approve/Reject controls, keyboard operation, and auto-advance to
 * the next pending submission on completion — no round trip through the
 * list.
 *
 * Keyboard: A approve · R toggle the reject panel (Enter inside it submits)
 * · J / → skip to the next pending item without deciding · K / ← go back.
 * Approve/reject go through the idempotent SQL-backed actions in
 * lib/actions/admin.ts — never reimplemented here.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, SkipForward, ArrowLeft } from 'lucide-react';
import {
  approveDelegatePayment,
  approveEventPayment,
  rejectDelegatePayment,
  rejectEventPayment,
} from '@/lib/actions/admin';
import { REJECTION_REASONS } from '@/lib/validation/admin';
import type { PaymentType } from '@/lib/types/enums';
import { PAYMENT_TYPE_LABELS } from '@/lib/types/enums';
import { formatDateTime } from '@/lib/format/date';
import { formatInr } from '@/lib/format/currency';
import { fetchNextPendingSubmission } from '@/app/admin/payments/_actions';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Field';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/components/ui/StatusChip';
import { CopyableId } from '@/components/admin/CopyableId';

export interface PaymentReviewSubmission {
  id: string;
  paymentType: PaymentType;
  applicantName: string | null;
  applicantEmail: string | null;
  eventName: string | null;
  delegateId: string | null;
  expectedAmountInr: number | null;
  transactionReference: string | null;
  submittedAt: string;
  status: string;
}

export interface PaymentReviewPanelProps {
  submission: PaymentReviewSubmission;
  screenshotUrl: string | null;
  screenshotError: string | null;
  remainingCount: number;
}

export function PaymentReviewPanel({
  submission,
  screenshotUrl,
  screenshotError,
  remainingCount,
}: PaymentReviewPanelProps) {
  const router = useRouter();
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0]);
  const [note, setNote] = useState('');
  const [allowResubmit, setAllowResubmit] = useState(true);
  const [nextId, setNextId] = useState<string | null>(null);
  const reasonRef = useRef<HTMLSelectElement>(null);

  const isEvent = submission.paymentType === 'EVENT';

  // Prefetch the next pending submission's route so advancing after a
  // decision is instant. TTL on the signed URL is ~60s (see
  // docs/03-ARCHITECTURE.md §6) — minted fresh when that route actually
  // renders, this only warms the route shell.
  useEffect(() => {
    let cancelled = false;
    fetchNextPendingSubmission(submission.id).then((next) => {
      if (cancelled || !next) return;
      setNextId(next.id);
      router.prefetch(`/admin/payments/${next.id}`);
    });
    return () => {
      cancelled = true;
    };
  }, [submission.id, router]);

  const advance = useCallback(() => {
    if (nextId) {
      router.push(`/admin/payments/${nextId}`);
    } else {
      router.push('/admin/payments');
    }
    router.refresh();
  }, [nextId, router]);

  const handleApprove = useCallback(async () => {
    if (pending) return;
    setPending('approve');
    setError(null);
    const result = isEvent
      ? await approveEventPayment({ submissionId: submission.id })
      : await approveDelegatePayment({ submissionId: submission.id });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    advance();
  }, [pending, isEvent, submission.id, advance]);

  const handleReject = useCallback(async () => {
    if (pending) return;
    setPending('reject');
    setError(null);
    const payload = {
      submissionId: submission.id,
      reason: reason as (typeof REJECTION_REASONS)[number],
      note: note || undefined,
      allowResubmit,
    };
    const result = isEvent ? await rejectEventPayment(payload) : await rejectDelegatePayment(payload);
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRejectOpen(false);
    advance();
  }, [pending, isEvent, submission.id, reason, note, allowResubmit, advance]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (typing && e.key !== 'Escape') return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (!rejectOpen) void handleApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setRejectOpen(true);
        window.setTimeout(() => reasonRef.current?.focus(), 0);
      } else if (e.key === 'Escape') {
        setRejectOpen(false);
      } else if ((e.key === 'j' || e.key === 'ArrowRight') && !rejectOpen) {
        e.preventDefault();
        advance();
      } else if ((e.key === 'k' || e.key === 'ArrowLeft') && !rejectOpen) {
        e.preventDefault();
        router.back();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [rejectOpen, handleApprove, advance, router]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/payments')}
          className="inline-flex items-center gap-1.5 text-[13px] text-ice-500 hover:text-ice-100"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to queue
        </button>
        <p className="font-mono text-[13px] text-ice-500">
          <span className="text-signal-400">{remainingCount}</span> pending remaining
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Screenshot — large, one side */}
        <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-line-100 bg-abyss-800 p-3">
          {screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={screenshotUrl}
              alt={`${submission.applicantName ?? 'Participant'} — payment screenshot`}
              className="max-h-[70vh] max-w-full rounded-md object-contain"
            />
          ) : (
            <p className="text-[14px] text-danger">{screenshotError ?? 'Screenshot unavailable.'}</p>
          )}
        </div>

        {/* Details + actions */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-line-100 bg-abyss-700 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-[20px] text-ice-100">{submission.applicantName ?? 'Unknown'}</h2>
              <StatusChip status={submission.status} />
            </div>
            <dl className="flex flex-col divide-y divide-line-100 text-[14px]">
              <div className="flex justify-between py-2">
                <dt className="text-ice-500">Email</dt>
                <dd className="text-ice-100">{submission.applicantEmail ?? '—'}</dd>
              </div>
              {submission.delegateId ? (
                <div className="flex justify-between py-2">
                  <dt className="text-ice-500">Delegate ID</dt>
                  <dd>
                    <CopyableId value={submission.delegateId} />
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between py-2">
                <dt className="text-ice-500">Payment type</dt>
                <dd className="text-ice-100">{PAYMENT_TYPE_LABELS[submission.paymentType]}</dd>
              </div>
              {submission.eventName ? (
                <div className="flex justify-between py-2">
                  <dt className="text-ice-500">Event</dt>
                  <dd className="text-ice-100">{submission.eventName}</dd>
                </div>
              ) : null}
              <div className="flex justify-between py-2">
                <dt className="text-ice-500">Expected amount</dt>
                <dd className="text-ice-100">
                  {submission.expectedAmountInr != null ? formatInr(submission.expectedAmountInr) : '—'}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ice-500">Transaction reference</dt>
                <dd className="text-ice-100">{submission.transactionReference ?? '—'}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ice-500">Submitted</dt>
                <dd className="text-ice-100">{formatDateTime(submission.submittedAt)}</dd>
              </div>
            </dl>
          </div>

          {error ? <p className="text-[13px] text-danger">{error}</p> : null}

          {!rejectOpen ? (
            <div className="flex flex-col gap-2">
              <Button type="button" variant="primary" loading={pending === 'approve'} onClick={handleApprove}>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Approve <span className="ml-1 font-mono text-[11px] opacity-70">(A)</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending !== null}
                onClick={() => {
                  setRejectOpen(true);
                  window.setTimeout(() => reasonRef.current?.focus(), 0);
                }}
              >
                <XCircle className="size-4" aria-hidden="true" />
                Reject <span className="ml-1 font-mono text-[11px] opacity-70">(R)</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={pending !== null} onClick={advance}>
                <SkipForward className="size-4" aria-hidden="true" />
                Skip to next <span className="ml-1 font-mono text-[11px] opacity-70">(J / →)</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-danger/40 bg-danger/5 p-4">
              <Field label="Reason" htmlFor="review-reject-reason" required>
                <Select
                  ref={reasonRef}
                  id="review-reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  options={REJECTION_REASONS.map((r) => ({ value: r, label: r }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleReject();
                    }
                  }}
                />
              </Field>
              <Field label="Admin note (optional)" htmlFor="review-reject-note">
                <Textarea
                  id="review-reject-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </Field>
              <Checkbox
                id="review-allow-resubmit"
                checked={allowResubmit}
                onChange={(e) => setAllowResubmit(e.target.checked)}
                label="Allow resubmission"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" size="sm" loading={pending === 'reject'} onClick={handleReject}>
                  Confirm reject
                </Button>
              </div>
            </div>
          )}

          <p className="text-[12px] text-ice-700">
            Keyboard: <span className="font-mono">A</span> approve · <span className="font-mono">R</span> reject ·{' '}
            <span className="font-mono">J</span>/<span className="font-mono">→</span> skip ·{' '}
            <span className="font-mono">K</span>/<span className="font-mono">←</span> back
          </p>
        </div>
      </div>
    </div>
  );
}
