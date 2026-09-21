"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

import { QrPanel } from "@/components/ui/QrPanel";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { formatEventDate, formatTimeRange } from "@/lib/format/date";
import { exportPassPng } from "@/lib/pass/export-pass-png";
import { cn } from "@/lib/utils/cn";
import type { EventRow } from "@/lib/types/database";

export interface EventPassCardProps {
  event: EventRow;
  participantName: string;
  delegateId: string;
  registrationCode: string;
  qrValue: string;
  checkedIn: boolean;
  checkedInAt: string | null;
}

/**
 * The event credential — deliberately distinct from the Delegate Pass
 * (components/delegate/DelegatePassCard, owned by the delegate-flow agent):
 * a single vertical ticket-stub composition instead of the delegate's
 * split layout, no DelegateImprint artwork, its own "EVENT PASS" eyebrow.
 * SAVE PASS reuses the shared canvas export helper (lib/pass/export-pass-png)
 * that the Delegate Pass established.
 */
export function EventPassCard({
  event,
  participantName,
  delegateId,
  registrationCode,
  qrValue,
  checkedIn,
  checkedInAt,
}: EventPassCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrValue, {
      width: 480,
      margin: 2,
      color: { dark: "#04070C", light: "#F2F7FB" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const width = 640;
      const height = 900;
      const canvas = canvasRef.current ?? document.createElement("canvas");

      await exportPassPng(canvas, {
        width,
        height,
        qrDataUrl,
        fileName: `striatum-event-pass-${registrationCode}.png`,
        draw: (ctx, img) => {
          ctx.fillStyle = "#04070C";
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = "#35E4F5";
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = 1;
          ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
          ctx.globalAlpha = 1;

          ctx.fillStyle = "#35E4F5";
          ctx.font = "12px monospace";
          ctx.textAlign = "center";
          ctx.fillText("EVENT PASS", width / 2, 48);

          ctx.fillStyle = "#F2F7FB";
          ctx.font = "26px serif";
          wrapText(ctx, event.name, width / 2, 90, width - 120, 32);

          if (img) {
            const plate = 320;
            const plateX = (width - plate) / 2;
            const plateY = 180;
            ctx.fillStyle = "#F2F7FB";
            ctx.fillRect(plateX, plateY, plate, plate);
            ctx.drawImage(img, plateX + 20, plateY + 20, plate - 40, plate - 40);
          }

          ctx.textAlign = "center";
          ctx.fillStyle = checkedIn ? "#35E4F5" : "#8CA3B8";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText(checkedIn ? "CHECKED IN" : "NOT CHECKED IN", width / 2, 540);

          ctx.textAlign = "left";
          const rows: Array<[string, string]> = [
            ["Participant", participantName || "—"],
            ["Delegate ID", delegateId],
            ["Registration code", registrationCode],
            ["Date", formatEventDate(event.event_date)],
            ["Time", formatTimeRange(event.start_time, event.end_time)],
            ["Venue", event.venue ?? "Not announced yet"],
          ];
          let y = 590;
          for (const [label, value] of rows) {
            ctx.fillStyle = "#8CA3B8";
            ctx.font = "12px sans-serif";
            ctx.fillText(label.toUpperCase(), 60, y);
            ctx.fillStyle = "#F2F7FB";
            ctx.font = "16px monospace";
            ctx.fillText(value, 60, y + 22);
            y += 56;
          }
        },
      });
    } catch {
      setSaveError("Couldn't render your pass. Try again.");
    } finally {
      setSaving(false);
    }
  }, [qrDataUrl, event, participantName, delegateId, registrationCode, checkedIn]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col overflow-hidden rounded-lg border border-signal-500/30 bg-abyss-700">
        <div className="flex flex-col items-center gap-1 border-b border-line-100 px-6 pt-6 pb-5 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-500">EVENT PASS</span>
          <h1 className="font-serif text-2xl leading-tight text-ice-100">{event.name}</h1>
        </div>

        <div className="flex flex-col items-center gap-3 border-b border-line-100 px-6 py-7">
          <QrPanel value={qrValue} label={`Event check-in QR for ${event.name}`} size={240} />
          <StatusChip status={checkedIn ? "CHECKED_IN" : "NOT_CHECKED_IN"} />
          {checkedIn && checkedInAt ? (
            <p className="text-[13px] text-ice-500">Checked in at {new Date(checkedInAt).toLocaleString()}</p>
          ) : null}
        </div>

        <dl className="flex flex-col divide-y divide-line-100 px-6">
          <Row label="Participant" value={participantName || "—"} />
          <Row label="Delegate ID" value={delegateId} mono />
          <Row label="Registration code" value={registrationCode} mono />
          <Row label="Date" value={formatEventDate(event.event_date)} />
          <Row label="Time" value={formatTimeRange(event.start_time, event.end_time)} />
          <Row label="Venue" value={event.venue ?? "Not announced yet"} />
        </dl>
        <div className="h-6" />
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <Button variant="secondary" loading={saving} onClick={handleSave}>
        <Download className="size-4" aria-hidden="true" />
        Save pass
      </Button>
      {saveError ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {saveError}
        </p>
      ) : null}
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="shrink-0 text-[13px] text-ice-500">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right",
          // Delegate ID / registration code are "important values" per
          // docs/01-DESIGN-SYSTEM.md §3 — 16-18px, never smaller.
          mono ? "break-all font-mono text-[16px] font-semibold text-ice-100" : "truncate text-[15px] text-ice-100"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
