/**
 * Organiser contact data.
 *
 * Event in-charges live on the event itself (`SymposiumEvent.coordinators`), so
 * views read them from the catalogue rather than hardcoding names or numbers.
 * This file holds the two things that are NOT per-event:
 *
 *   - the registration/combo enquiry contact, and
 *   - organiser numbers supplied without a confirmed event mapping.
 *
 * The unmapped list is deliberately not rendered anywhere. The organiser
 * supplied these numbers without saying which event each person runs, and
 * guessing would put a stranger's phone on a public page.
 */

export interface OrganiserContact {
  name: string;
  phone?: string;
  /** Why this number is not attached to an event yet. */
  note?: string;
}

/** Shown on the Combos page for enquiries about bundles and registration. */
export const REGISTRATION_CONTACT: OrganiserContact = {
  name: 'Aswin E',
  phone: '7806825939'
};

/** Digits only, with the Indian country code, for a wa.me link. */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? '91' + digits : digits;
}

/** A dialable href. Kept beside whatsappNumber so both normalise identically. */
export function telNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? '+91' + digits : '+' + digits;
}
