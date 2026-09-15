import { STRIATUM_COMMUNITY_URL } from '../data/contacts.ts';

/**
 * "Join the community", for the end of a registration.
 *
 * Shown on the two screens where a delegate has just finished something and has
 * nothing left to do: the delegate pass and the event registration receipt.
 *
 * It carries its own class namespace rather than borrowing either screen's
 * button styles. The two confirmation screens are laid out differently and were
 * asked not to be disturbed, so this had to be something that could be dropped
 * into both without inheriting from, or leaking into, either.
 *
 * Kept in the app's own cyan rather than WhatsApp's green: the glyph says which
 * app it opens, and a green panel would be the one thing on the screen that
 * belongs to somebody else's brand.
 */
export function renderCommunityCta(): string {
  return `
    <a class="s4-community" href="${STRIATUM_COMMUNITY_URL}"
       target="_blank" rel="noopener noreferrer">
      <span class="s4-community-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/>
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.53 3.7-8.22 8.23-8.22 2.2 0 4.26.86 5.81 2.41a8.16 8.16 0 0 1 2.41 5.82c0 4.53-3.69 8.21-8.23 8.21z"/>
        </svg>
      </span>

      <span class="s4-community-text">
        <span class="s4-community-label">STRIATUM COMMUNITY</span>
        <span class="s4-community-title">Join the WhatsApp group</span>
        <span class="s4-community-sub">Announcements, schedule changes and results.</span>
      </span>

      <svg class="s4-community-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path d="M5 12h14m-7-7 7 7-7 7"/>
      </svg>
    </a>`;
}
