"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Share2 } from "lucide-react";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DelegateImprint } from "@/components/delegate/DelegateImprint";
import { exportPassPng } from "@/lib/pass/export-pass-png";

export interface DelegatePassCardProps {
  delegateId: string;
  participantName: string;
  institution: string | null;
  yearOfStudy: string | null;
  verifyUrl: string;
}

/**
 * The Delegate Pass credential. Split composition: QR + verify copy on the
 * left, identity details on the right with the activated Delegate Imprint
 * subtly behind. SAVE PASS renders a real PNG via canvas; SHARE uses the Web
 * Share API with a copy-link fallback.
 */
export function DelegatePassCard({
  delegateId,
  participantName,
  institution,
  yearOfStudy,
  verifyUrl,
}: DelegatePassCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(verifyUrl, {
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
  }, [verifyUrl]);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const width = 900;
      const height = 520;
      const canvas = canvasRef.current ?? document.createElement("canvas");

      await exportPassPng(canvas, {
        width,
        height,
        qrDataUrl,
        fileName: `striatum-delegate-pass-${delegateId}.png`,
        draw: (ctx, img) => {
          ctx.fillStyle = "#04070C";
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = "#16243A";
          ctx.lineWidth = 1;
          ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

          if (img) {
            const plate = 320;
            const plateX = 60;
            const plateY = (height - plate) / 2;
            ctx.fillStyle = "#F2F7FB";
            ctx.fillRect(plateX, plateY, plate, plate);
            ctx.drawImage(img, plateX + 20, plateY + 20, plate - 40, plate - 40);
          }

          ctx.fillStyle = "#8CA3B8";
          ctx.font = "12px monospace";
          ctx.fillText("DELEGATE PASS", 60, height - 40);
          ctx.fillText("SCAN TO VERIFY", 60, height - 22);

          const rightX = 440;
          ctx.fillStyle = "#35E4F5";
          ctx.font = "bold 14px sans-serif";
          ctx.fillText("ACTIVE", rightX, 80);

          ctx.fillStyle = "#F2F7FB";
          ctx.font = "28px serif";
          ctx.fillText(participantName, rightX, 130);

          ctx.font = "22px monospace";
          ctx.fillText(delegateId, rightX, 180);

          ctx.fillStyle = "#8CA3B8";
          ctx.font = "16px sans-serif";
          if (institution) ctx.fillText(institution, rightX, 220);
          if (yearOfStudy) ctx.fillText(yearOfStudy, rightX, 248);
        },
      });
    } catch {
      setSaveError("Couldn't render your pass. Try again.");
    } finally {
      setSaving(false);
    }
  }, [qrDataUrl, participantName, delegateId, institution, yearOfStudy]);

  const handleShare = useCallback(async () => {
    setShareState("idle");
    const shareData = {
      title: "STRIATUM 4.0 Delegate Pass",
      text: `${participantName} — Delegate ${delegateId}`,
      url: verifyUrl,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        setShareState("shared");
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(verifyUrl);
        setShareState("copied");
        return;
      }
      setShareState("error");
    } catch {
      // user cancelled share sheet — not an error state
    }
  }, [participantName, delegateId, verifyUrl]);

  return (
    <div className="flex flex-col gap-4">
      <Panel wash className="relative overflow-hidden p-0">
        <div className="pointer-events-none absolute -right-6 -top-6 opacity-10">
          <DelegateImprint state="active" delegateId={delegateId} size="lg" />
        </div>

        <div className="relative flex flex-col sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-3 border-b border-line-100 p-6 sm:w-[42%] sm:border-b-0 sm:border-r">
            <div
              className="flex items-center justify-center rounded-md bg-ice-100 p-3"
              style={{ width: 200, height: 200 }}
            >
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Delegate verification QR" width={176} height={176} />
              ) : (
                <Spinner label="Generating QR" />
              )}
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice-500">
                DELEGATE PASS
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice-700">
                SCAN TO VERIFY
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-6 sm:w-[58%]">
            <span className="w-fit font-mono text-xs font-semibold uppercase tracking-[0.14em] text-signal-500">
              ACTIVE
            </span>
            <p className="text-[26px] font-semibold leading-tight text-ice-100">
              {participantName}
            </p>
            <p className="font-mono text-[18px] text-signal-400">{delegateId}</p>
            <div className="flex flex-col gap-1 text-[16px] text-ice-300">
              {institution ? <span>{institution}</span> : null}
              {yearOfStudy ? <span>{yearOfStudy}</span> : null}
            </div>
          </div>
        </div>
      </Panel>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" loading={saving} onClick={handleSave}>
          <Download className="size-4" aria-hidden="true" />
          Save pass
        </Button>
        <Button variant="secondary" onClick={handleShare}>
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </Button>
      </div>
      {saveError ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {saveError}
        </p>
      ) : null}
      {shareState === "copied" ? (
        <p className="text-[13px] text-ice-500">Link copied to clipboard.</p>
      ) : null}
      {shareState === "error" ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          Sharing isn&apos;t available on this device.
        </p>
      ) : null}
    </div>
  );
}
