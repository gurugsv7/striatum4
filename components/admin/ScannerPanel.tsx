'use client';

/**
 * STRIATUM 4.0 admin — event check-in scanner.
 *
 * Camera scanning uses the browser BarcodeDetector API when present (no new
 * npm dependency, per the brief) with a manual token/URL paste field that
 * always works as the reliable fallback. Every scan is authorized entirely
 * server-side via checkInByToken -> redeem_event_qr(); the client never
 * trusts or interprets the QR contents beyond extracting a token substring.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { checkInByToken } from '@/lib/actions/admin';
import type { EventRow, QrRedeemResult } from '@/lib/types/database';
import { formatDateTime } from '@/lib/format/date';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';

export interface ScannerPanelProps {
  events: EventRow[];
}

interface ScanRecord {
  id: string;
  at: string;
  token: string;
  result: QrRedeemResult;
}

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? trimmed;
  } catch {
    return trimmed;
  }
}

const OUTCOME_STYLES: Record<QrRedeemResult['outcome'], string> = {
  VALID: 'border-signal-500/50 bg-signal-500/10',
  ALREADY_CHECKED_IN: 'border-warning/50 bg-warning/10',
  WRONG_EVENT: 'border-danger/50 bg-danger/10',
  INVALID: 'border-danger/50 bg-danger/10',
};

const OUTCOME_TITLES: Record<QrRedeemResult['outcome'], string> = {
  VALID: 'VALID PASS',
  ALREADY_CHECKED_IN: 'ALREADY CHECKED IN',
  WRONG_EVENT: 'WRONG EVENT',
  INVALID: 'INVALID PASS',
};

export function ScannerPanel({ events }: ScannerPanelProps) {
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [manualToken, setManualToken] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<QrRedeemResult | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<unknown>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string>('');

  useEffect(() => {
    setCameraSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  const submitToken = async (rawToken: string) => {
    const token = extractToken(rawToken);
    if (!token || !eventId || pending) return;
    setPending(true);
    setError(null);
    const result = await checkInByToken({ token, eventId });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrent(result.data);
    setHistory((prev) => [{ id: crypto.randomUUID(), at: new Date().toISOString(), token, result: result.data }, ...prev].slice(0, 50));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitToken(manualToken);
    setManualToken('');
  };

  const stopCamera = () => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    scanLoopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!cameraSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      setCameraActive(true);

      const loop = async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = detectorRef.current as any;
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const value = codes[0].rawValue as string;
            if (value && value !== lastScannedRef.current) {
              lastScannedRef.current = value;
              void submitToken(value);
              window.setTimeout(() => {
                lastScannedRef.current = '';
              }, 2500);
            }
          }
        } catch {
          // detection hiccup — keep looping
        }
        scanLoopRef.current = requestAnimationFrame(loop);
      };
      scanLoopRef.current = requestAnimationFrame(loop);
    } catch {
      setError('Could not access the camera. Use manual entry instead.');
      setCameraSupported(false);
    }
  };

  useEffect(() => stopCamera, []);

  return (
    <div className="flex flex-col gap-5">
      <Field label="Event being scanned for" htmlFor="scanner-event" required>
        <Select
          id="scanner-event"
          value={eventId}
          onChange={(e) => {
            stopCamera();
            setEventId(e.target.value);
          }}
          options={events.map((ev) => ({ value: ev.id, label: ev.name }))}
          placeholder="Select an event"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="flex flex-col gap-3">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Camera scan</h3>
          {cameraSupported ? (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                className="aspect-video w-full rounded-md border border-line-100 bg-abyss-800 object-cover"
              />
              <Button
                type="button"
                variant={cameraActive ? 'destructive' : 'secondary'}
                size="sm"
                disabled={!eventId}
                onClick={() => (cameraActive ? stopCamera() : startCamera())}
              >
                {cameraActive ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
                {cameraActive ? 'Stop camera' : 'Start camera'}
              </Button>
            </>
          ) : (
            <p className="text-[13px] text-ice-500">
              This browser does not support automatic QR scanning (BarcodeDetector API
              unavailable). Use manual entry below — it always works.
            </p>
          )}
        </Panel>

        <Panel className="flex flex-col gap-3">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Manual entry</h3>
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
            <Field label="Token or scanned URL" htmlFor="manual-token">
              <Input
                id="manual-token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste the token or the full checkin URL"
              />
            </Field>
            <Button type="submit" variant="primary" size="sm" disabled={!eventId || !manualToken.trim()} loading={pending}>
              <ScanLine className="size-4" aria-hidden="true" />
              Redeem
            </Button>
          </form>
        </Panel>
      </div>

      {error ? <p className="text-[13px] text-danger">{error}</p> : null}

      {current ? (
        <div className={`rounded-lg border p-5 ${OUTCOME_STYLES[current.outcome]}`}>
          <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-ice-300">
            {OUTCOME_TITLES[current.outcome]}
          </p>
          {current.outcome === 'VALID' || current.outcome === 'ALREADY_CHECKED_IN' ? (
            <div className="mt-3 flex flex-col gap-1">
              <p className="text-[20px] font-semibold text-ice-100">{current.participant_name ?? 'Unknown participant'}</p>
              <p className="font-mono text-[15px] text-ice-100">{current.delegate_id_text ?? '—'}</p>
              <p className="text-[14px] text-ice-300">{current.event_name ?? '—'}</p>
              <p className="text-[14px] text-ice-500">{current.college ?? '—'}</p>
              {current.outcome === 'ALREADY_CHECKED_IN' && current.checked_in_at ? (
                <p className="mt-2 text-[13px] text-warning">
                  Originally checked in {formatDateTime(current.checked_in_at)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[14px] text-ice-300">
              {current.outcome === 'WRONG_EVENT'
                ? 'This pass belongs to a different event.'
                : 'This token does not match any issued event pass.'}
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-[13px] text-ice-500">
          {history.length} scan{history.length === 1 ? '' : 's'} this session
        </p>
        {history.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-line-100">
            <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
              <thead className="bg-abyss-800">
                <tr>
                  {['Time', 'Participant', 'Delegate ID', 'Outcome'].map((h) => (
                    <th key={h} className="border-b border-line-100 px-3 py-2 text-[11px] uppercase tracking-[0.06em] text-ice-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-line-100 last:border-b-0">
                    <td className="px-3 py-2 text-ice-500">{formatDateTime(h.at)}</td>
                    <td className="px-3 py-2 text-ice-100">{h.result.participant_name ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-ice-300">{h.result.delegate_id_text ?? '—'}</td>
                    <td className="px-3 py-2 text-ice-300">{OUTCOME_TITLES[h.result.outcome]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
