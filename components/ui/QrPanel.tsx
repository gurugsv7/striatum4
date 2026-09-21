"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

export interface QrPanelProps {
  /** The raw value encoded into the QR (a token/URL, never rendered as-is to the viewer). */
  value: string;
  /** Accessible label describing what the QR is for, e.g. "Delegate verification QR". */
  label: string;
  size?: number;
  className?: string;
}

/**
 * Renders a QR on a light plate with a correct quiet zone. Minimum 240px.
 * Generated client-side via the `qrcode` package as a data URL.
 */
export function QrPanel({ value, label, size = 240, className }: QrPanelProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const rendered = Math.max(size, 240);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: rendered,
      margin: 2, // quiet zone, in QR modules
      color: { dark: "#04070C", light: "#F2F7FB" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, rendered]);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-ice-100 p-4",
        className,
      )}
      style={{ width: rendered + 32, height: rendered + 32 }}
      role="img"
      aria-label={label}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={label} width={rendered} height={rendered} />
      ) : (
        <Spinner label="Generating QR" />
      )}
    </div>
  );
}
