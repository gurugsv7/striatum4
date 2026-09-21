/**
 * STRIATUM 4.0 — shared "Save pass" PNG export.
 *
 * Both the Delegate Pass (components/delegate/DelegatePassCard) and the
 * Event Pass (components/event/EventPassCard) render a client-side canvas
 * snapshot of the credential and trigger a browser download. The generic
 * parts — sizing the canvas, decoding the QR data URL into an <img> the
 * canvas can draw, producing the PNG, and triggering the download — live
 * here so both cards use the same, once-tested export path. Each card still
 * supplies its own `draw` callback since the two compositions differ (split
 * layout vs. ticket stub).
 */
export interface ExportPassPngOptions {
  width: number;
  height: number;
  /** QR data URL already generated for on-screen display, or null while loading/unavailable. */
  qrDataUrl: string | null;
  fileName: string;
  /** Paints the pass onto the canvas. Receives the decoded QR image (or null if none). */
  draw: (ctx: CanvasRenderingContext2D, qrImage: HTMLImageElement | null) => void;
}

export async function exportPassPng(canvas: HTMLCanvasElement, options: ExportPassPngOptions): Promise<void> {
  const { width, height, qrDataUrl, fileName, draw } = options;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  let qrImage: HTMLImageElement | null = null;
  if (qrDataUrl) {
    qrImage = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImage!.onload = () => resolve();
      qrImage!.onerror = () => reject(new Error("QR image failed to load"));
      qrImage!.src = qrDataUrl;
    });
  }

  draw(ctx, qrImage);

  const pngUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = pngUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
