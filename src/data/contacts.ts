/**
 * Organiser contact data.
 *
 * Event in-charges live on the event itself (`SymposiumEvent.coordinators`), so
 * views read them from the catalogue rather than hardcoding names or numbers.
 * What is left here is the one contact that is not per-event: the
 * registration and combo enquiry number.
 *
 * There was also a list of organiser numbers supplied without a confirmed
 * event mapping, held back rather than guessed at. Every one of them has since
 * been matched to a named in-charge, so the list is gone.
 */

export interface OrganiserContact {
  name: string;
  phone?: string;
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
