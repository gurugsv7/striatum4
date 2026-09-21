'use client';

/**
 * STRIATUM 4.0 admin — global payment settings (Settings → Payments).
 *
 * Submits through the existing updatePaymentSettings server action in
 * lib/actions/admin.ts (FormData-based, handles the optional QR image
 * upload to the public brand-assets bucket). Changing the QR takes effect
 * on participant screens immediately — no code deploy, since the
 * participant app reads payment_settings.qr_storage_path live.
 */
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePaymentSettings } from '@/lib/actions/admin';
import type { PaymentSettingsRow } from '@/lib/types/database';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FileDropzone } from '@/components/ui/FileDropzone';

export interface PaymentSettingsFormProps {
  settings: PaymentSettingsRow | null;
  currentQrUrl: string | null;
}

export function PaymentSettingsForm({ settings, currentQrUrl }: PaymentSettingsFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [feeInr, setFeeInr] = useState(settings?.delegate_fee_inr?.toString() ?? '');
  const [payeeName, setPayeeName] = useState(settings?.payee_name ?? '');
  const [upiId, setUpiId] = useState(settings?.upi_id ?? '');
  const [instructions, setInstructions] = useState(settings?.instructions ?? '');
  const [requireRef, setRequireRef] = useState(settings?.require_transaction_ref ?? false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    if (feeInr) formData.set('delegateFeeInr', feeInr);
    if (payeeName) formData.set('payeeName', payeeName);
    if (upiId) formData.set('upiId', upiId);
    if (instructions) formData.set('instructions', instructions);
    formData.set('requireTransactionRef', String(requireRef));
    if (qrFile) formData.set('qrImage', qrFile);

    const result = await updatePaymentSettings(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setQrFile(null);
    router.refresh();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      {success ? <p className="text-[13px] text-success">Payment settings saved.</p> : null}

      <Panel className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Delegate registration fee (INR)" htmlFor="fee" hint="Blank renders 'Fee not announced' to participants">
          <Input id="fee" type="number" min={0} value={feeInr} onChange={(e) => setFeeInr(e.target.value)} />
        </Field>
        <Field label="Payee name" htmlFor="payee">
          <Input id="payee" value={payeeName ?? ''} onChange={(e) => setPayeeName(e.target.value)} />
        </Field>
        <Field label="UPI ID" htmlFor="upi">
          <Input id="upi" value={upiId ?? ''} onChange={(e) => setUpiId(e.target.value)} />
        </Field>
        <div className="flex items-end">
          <Checkbox
            id="require-ref"
            checked={requireRef}
            onChange={(e) => setRequireRef(e.target.checked)}
            label="Require a transaction reference on submission"
          />
        </div>
        <Field label="Payment instructions" htmlFor="instructions" className="sm:col-span-2">
          <Textarea id="instructions" value={instructions ?? ''} onChange={(e) => setInstructions(e.target.value)} rows={4} />
        </Field>
      </Panel>

      <Panel className="flex flex-col gap-3">
        <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Payment QR</h3>
        <p className="text-[13px] text-ice-500">
          Changing this image takes effect on participant screens immediately — no code deploy.
        </p>
        {currentQrUrl ? (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[12px] text-ice-500">
              Current QR (rendered at the size participants will actually scan):
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentQrUrl}
              alt="Current payment QR"
              width={240}
              height={240}
              className="rounded-md border border-line-100 bg-ice-100 p-3"
            />
          </div>
        ) : (
          <p className="text-[13px] text-ice-700">No QR image uploaded yet.</p>
        )}
        <FileDropzone file={qrFile} onChange={setQrFile} onError={setError} />
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={pending}>
          Save payment settings
        </Button>
      </div>
    </form>
  );
}
