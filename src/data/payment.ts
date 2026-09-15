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
