/**
 * Where symposium money is collected.
 *
 * One constant, because the same UPI ID was written out separately in the
 * delegate and event payment screens and a third copy was about to appear on
 * the IGMCRI screen. An account number that lives in three places is one that
 * eventually disagrees with itself.
 */
export const SYMPOSIUM_UPI_ID = 'sigmapy@iob';

/** QR encoding the UPI ID above. Shown wherever a payment is asked for. */
export const SYMPOSIUM_UPI_QR = '/art_delegate_qr.png';

/**
 * Standard UPI intent. The payee name is a display hint only; UPI apps
 * independently resolve and verify the real account name.
 * Always show a manual UPI ID/QR fallback because some issuers do not accept
 * payment intents from a browser even when direct UPI transfers are enabled.
 */
export const SYMPOSIUM_UPI_PAYEE_LABEL = 'SIGMA';
export function symposiumUpiIntent(amount: number, note: string): string {
  const query = new URLSearchParams({
    pa: SYMPOSIUM_UPI_ID,
    pn: SYMPOSIUM_UPI_PAYEE_LABEL,
    am: String(amount),
    cu: 'INR',
    tn: note
  });
  return 'upi://pay?' + query.toString();
}
