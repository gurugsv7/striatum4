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

/**
 * Supplied by the organisers without a confirmed brochure/event mapping.
 * Never rendered. Kept so the numbers are not lost between handovers.
 *
 * Gugan M is NOT Gugan G. Gugan G is the GLOW CODE in-charge and appears in the
 * catalogue; Gugan M has no confirmed event and stays here.
 */
export const UNMAPPED_ORGANISER_CONTACTS: OrganiserContact[] = [
  { name: 'Gugan M', phone: '9080120908', note: 'Distinct from Gugan G (GLOW CODE in-charge).' },
  { name: 'A Nilavan', phone: '9487783783' },
  { name: 'Mahalakshmi D', phone: '8667589980' },
  { name: 'Nivetha Devi B', phone: '6382334788' },
  { name: 'S Deepak', phone: '8508690591' },
  { name: 'Subiksha', phone: '6380195356' },
  { name: 'Padhmajaa', phone: '6381308738' },
  {
    name: 'Thirumurugan S',
    note: 'Listed as in-charge for Aurelia Celestia / Gala Night, which is not an event in the current brochure catalogue.'
  }
];

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
