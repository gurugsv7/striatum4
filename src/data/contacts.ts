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

/**
 * The STRIATUM WhatsApp community.
 *
 * Offered once a registration is complete, where a delegate has a reason to
 * want announcements and nothing left to do on the page.
 */
export const STRIATUM_COMMUNITY_URL = 'https://chat.whatsapp.com/Iea13KRmCxk4mxufFzTidt';

/** Shown on the Combos page for enquiries about bundles and registration. */
export const REGISTRATION_CONTACT: OrganiserContact = {
  name: 'Aswin E',
  phone: '7806825939'
};

/**
 * The studio that built the site, for the Credits page.
 *
 * Separate from WEBSITE_CONTACTS on purpose: a delegate with a registration
 * problem should reach the council, not the developer. This is here for anyone
 * asking about the work itself.
 */
export const DEVELOPER_CONTACT: OrganiserContact = {
  name: 'Built by GSV',
  phone: '7448865095'
};

/**
 * Who to ask about the site itself.
 *
 * Registration, payment and anything that goes wrong on a screen reaches these
 * three rather than the in-charge of whichever event the delegate happened to
 * be looking at. Names, roles and numbers are the council's own, from the
 * SIGMA'26 council document.
 */
export interface WebsiteContact extends OrganiserContact {
  role: string;
}

export const WEBSITE_CONTACTS: WebsiteContact[] = [
  { name: 'Vignesh D', role: 'Technical Secretary', phone: '9042059951' },
  { name: 'Kaviya Dharshini K', role: 'Academic Secretary', phone: '6380592296' },
  { name: 'Aswin E', role: 'Treasurer', phone: '7806825939' }
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
