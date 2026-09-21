/**
 * STRIATUM 4.0 — QR rendering helpers.
 *
 * Wraps the `qrcode` npm package with the project's error-correction and
 * quiet-zone conventions (components/ui/QrPanel.tsx renders these
 * client-side onto a light plate per docs/01-DESIGN-SYSTEM.md §7, min
 * 240px square).
 *
 * TWO TOKEN SPACES, NEVER INTERCHANGEABLE:
 *   - Delegate pass QR encodes `${SITE_URL}/verify/d/${delegates.verification_token}`
 *     — read-only identity check, no check-in side effect.
 *   - Event pass QR encodes `${SITE_URL}/checkin/${qr_credentials.token}`
 *     — redeemable exactly once per event via redeem_event_qr().
 * Do not build any code path that accepts a verification_token where a
 * qr_credentials.token is expected, or vice versa.
 */
import QRCode from 'qrcode';

const QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  errorCorrectionLevel: 'H',
  margin: 4, // quiet zone, in modules
  width: 512,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable.');
  }
  return url.replace(/\/$/, '');
}

export function buildDelegateVerifyUrl(verificationToken: string): string {
  return `${getSiteUrl()}/verify/d/${verificationToken}`;
}

export function buildEventCheckinUrl(qrToken: string): string {
  return `${getSiteUrl()}/checkin/${qrToken}`;
}

/** Data-URL (PNG) render — usable directly as an <img src>. */
export async function renderQrDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, QR_OPTIONS);
}

/** Inline SVG markup render — usable when a crisp vector is preferred. */
export async function renderQrSvg(data: string): Promise<string> {
  return QRCode.toString(data, { ...QR_OPTIONS, type: 'svg' });
}

export async function renderDelegatePassQr(verificationToken: string): Promise<string> {
  return renderQrDataUrl(buildDelegateVerifyUrl(verificationToken));
}

export async function renderEventPassQr(qrToken: string): Promise<string> {
  return renderQrDataUrl(buildEventCheckinUrl(qrToken));
}
