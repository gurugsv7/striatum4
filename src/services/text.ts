/**
 * HTML escaping.
 *
 * Every screen renders by assigning innerHTML, so anything that originated
 * outside the catalogue — a delegate's name, a rejection reason an organiser
 * typed, a search term — has to be escaped on the way in. This used to be
 * copy-pasted into ten view files, and one of the copies had quietly lost the
 * apostrophe replacement, which is the one that matters inside a
 * single-quoted attribute.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
