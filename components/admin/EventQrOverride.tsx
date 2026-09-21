'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadEventPaymentQr } from '@/app/admin/events/_actions';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { FileDropzone } from '@/components/ui/FileDropzone';

export interface EventQrOverrideProps {
  eventId: string;
  currentQrUrl: string | null;
}

/** Per-event payment QR image override — uploads to the public brand-assets bucket. */
export function EventQrOverride({ eventId, currentQrUrl }: EventQrOverrideProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set('eventId', eventId);
    formData.set('qrImage', file);
    const result = await uploadEventPaymentQr(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFile(null);
    router.refresh();
  };

  return (
    <Panel className="flex flex-col gap-3">
      <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">
        Payment QR override (this event)
      </h3>
      <p className="text-[13px] text-ice-500">
        Overrides the global payment QR for this event only. Leave unset to use the global QR
        from Settings → Payments.
      </p>
      {currentQrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentQrUrl}
          alt="Current per-event payment QR"
          className="h-40 w-40 rounded-md border border-line-100 bg-ice-100 object-contain p-2"
        />
      ) : (
        <p className="text-[13px] text-ice-700">No override set.</p>
      )}
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      <FileDropzone file={file} onChange={setFile} onError={setError} />
      <div>
        <Button type="button" variant="secondary" size="sm" disabled={!file} loading={pending} onClick={handleUpload}>
          Upload override
        </Button>
      </div>
    </Panel>
  );
}
