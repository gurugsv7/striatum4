'use client';

/**
 * STRIATUM 4.0 admin — authenticated screenshot viewer.
 *
 * Mints a short-lived signed URL on demand (never ahead of time, never
 * cached) via lib/actions/storage.ts::getSignedScreenshotUrl, which itself
 * re-checks admin/ownership server-side. Renders it in the shared Lightbox
 * primitive (zoom + open-full-size already built in).
 */
import { useCallback, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { getSignedScreenshotUrl } from '@/lib/actions/storage';
import { Lightbox } from '@/components/ui/Lightbox';

export interface ScreenshotViewerProps {
  submissionId: string;
  label?: string;
  /** Render as a thumbnail-style trigger instead of a text button. */
  variant?: 'button' | 'thumbnail';
  className?: string;
}

export function ScreenshotViewer({
  submissionId,
  label = 'Payment screenshot',
  variant = 'button',
  className,
}: ScreenshotViewerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getSignedScreenshotUrl(submissionId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUrl(result.data);
    setOpen(true);
  }, [submissionId]);

  return (
    <>
      {variant === 'thumbnail' ? (
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={`flex size-16 items-center justify-center overflow-hidden rounded-md border border-line-200 bg-abyss-600 text-ice-500 transition-colors hover:border-signal-500 hover:text-signal-400 disabled:cursor-wait ${className ?? ''}`}
          aria-label={`View ${label}`}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImageOff className="size-5" aria-hidden="true" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 text-[14px] font-semibold text-signal-500 underline underline-offset-4 disabled:cursor-wait disabled:text-ice-700 ${className ?? ''}`}
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          VIEW SCREENSHOT →
        </button>
      )}

      {error ? <p className="mt-1 text-[13px] text-danger">{error}</p> : null}

      {url ? (
        <Lightbox open={open} onClose={() => setOpen(false)} src={url} alt={label} />
      ) : null}
    </>
  );
}
