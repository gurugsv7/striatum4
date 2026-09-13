/**
 * Desktop chrome — the rail, the depth ruler and the small primitives every
 * desktop screen shares.
 *
 * Nothing in src/desktop/ is imported by the mobile views, and nothing here
 * imports them. The two surfaces meet only at main.ts, which picks one.
 */
import { appStore, ScreenType } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';

/** HTML-escapes a value that came from a person rather than from the brochure. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type IconName = 'home' | 'explore' | 'programme' | 'mine' | 'profile' | 'cart' | 'search' | 'arrow' | 'back' | 'chevron' | 'info' | 'shield' | 'clock' | 'award' | 'settings' | 'mail' | 'lock';

const PATHS: Record<IconName, string> = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  explore: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  programme: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  mine: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>',
  profile: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  cart: '<path d="M4 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.2"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  lock: '<rect width="16" height="11" x="4" y="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};

export function icon(name: IconName, size = 19, width = 1.8): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;
}

/** The IGMCRI caduceus, drawn rather than loaded, so it inherits colour. */
export function crest(size = 22): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <path d="M11 9C13 8 15 9 16 11C17 9 19 8 21 9C23 10 22 13 19 13C16 13 16 11 16 11" stroke="#ffffff" stroke-width="1.6"/>
    <line x1="16" y1="7" x2="16" y2="26" stroke="#ffffff" stroke-width="2"/>
    <circle cx="16" cy="7" r="1.8" fill="#2af1fa"/>
    <path d="M12 14C12 12 20 12 20 16C20 20 12 18 12 22C12 24 16 25 16 25" stroke="#2af1fa" stroke-width="1.4"/>
    <path d="M20 14C20 12 12 12 12 16C12 20 20 18 20 22C20 24 16 25 16 25" stroke="#ffffff" stroke-width="1.4"/>
  </svg>`;
}

export function eyebrow(num: string, label: string): string {
  return `<div class="d-eyebrow"><b>${num}</b><i>/</i><span>${label}</span></div>`;
}

export function arrowPill(): string {
  return `<span class="d-arrow">${icon('arrow', 15, 2)}</span>`;
}

/** The outlined registration-style button. */
export function slotButton(id: string, label: string, disabled = false): string {
  return `<button class="d-btn-slot" id="${id}" ${disabled ? 'disabled' : ''}>
    <span class="d-btn-slot-label">${label}</span>
    ${arrowPill()}
  </button>`;
}

const RAIL_TABS: { id: ScreenType; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'HOME' },
  { id: 'explore', icon: 'explore', label: 'EXPLORE' },
  { id: 'programme', icon: 'programme', label: 'PROGRAMME' },
  { id: 'my-events', icon: 'mine', label: 'MY EVENTS' },
  { id: 'profile', icon: 'profile', label: 'PROFILE' }
];

/**
 * Which rail tab should read as current. Detail and checkout screens belong to
 * the section that owns them, so the rail never goes blank mid-flow.
 */
function railSectionFor(screen: ScreenType): ScreenType | null {
  switch (screen) {
    case 'event-details':
    case 'cart':
    case 'event-payment':
    case 'event-confirm':
      return 'explore';
    case 'delegate-registration':
    case 'delegate-payment':
    case 'delegate-confirm':
      return 'profile';
    case 'home':
    case 'explore':
    case 'programme':
    case 'my-events':
    case 'profile':
      return screen;
    default:
      return null;
  }
}

export function renderRail(screen: ScreenType): string {
  const active = railSectionFor(screen);
  const cartCount = registration.cartCount();

  return `
    <nav class="d-rail" aria-label="Primary">
      <button class="d-rail-brand" id="d-rail-home" title="STRIATUM 4.0 home">
        <span class="d-rail-crest">${crest(22)}</span>
        <span class="d-rail-mark">S4</span>
      </button>

      <span class="d-rail-hairline"></span>

      <div class="d-rail-nav">
        ${RAIL_TABS.map(tab => `
          <button class="d-rail-tab ${active === tab.id ? 'is-active' : ''}" data-d-nav="${tab.id}"
                  ${active === tab.id ? 'aria-current="page"' : ''}>
            ${active === tab.id ? '<span class="d-rail-tab-bar"></span>' : ''}
            ${icon(tab.icon)}
            <span class="d-rail-tab-label">${tab.label}</span>
          </button>`).join('')}
      </div>

      <div class="d-rail-foot">
        <button class="d-rail-cart ${cartCount ? 'has-items' : ''}" id="d-rail-cart"
                title="Your selection" aria-label="Your selection, ${cartCount} event${cartCount === 1 ? '' : 's'}">
          ${icon('cart', 17)}
          ${cartCount ? `<span class="d-cart-bead">${cartCount}</span>` : ''}
        </button>
        <span class="d-rail-year">SIGMA 2026</span>
      </div>
    </nav>`;
}

/**
 * The depth ruler. It renders scroll position as metres below the surface —
 * decorative, hence aria-hidden, but it gives the long desktop pages the sense
 * of descent the phone gets from its short scrolls.
 */
export function renderDepthRuler(): string {
  const ticks = Array.from({ length: 19 }, (_, i) =>
    `<span class="d-depth-tick ${i % 3 === 0 ? 'is-major' : ''}"></span>`
  ).join('');

  return `
    <div class="d-depth" aria-hidden="true">
      <span class="d-depth-cap">0 M</span>
      <div class="d-depth-track">
        ${ticks}
        <span class="d-depth-marker" id="d-depth-marker" style="top: 0%;"></span>
        <span class="d-depth-value" id="d-depth-value" style="top: 12px;">0 M</span>
      </div>
      <span class="d-depth-cap">ABYSS</span>
    </div>`;
}

/** Wires the rail and the depth ruler. Called once per desktop render. */
export function attachShell(): void {
  document.getElementById('d-rail-home')?.addEventListener('click', () => {
    appStore.setScreen('home');
  });

  document.getElementById('d-rail-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-nav]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-d-nav') as ScreenType | null;
      if (target) appStore.setScreen(target);
    });
  });

  const scroller = document.getElementById('viewport-scroller');
  const marker = document.getElementById('d-depth-marker');
  const value = document.getElementById('d-depth-value');
  if (!scroller || !marker || !value) return;

  const update = () => {
    const travel = scroller.scrollHeight - scroller.clientHeight;
    const ratio = travel > 8 ? Math.min(1, scroller.scrollTop / travel) : 0;
    // 2 400 m is the deep scattering layer the artwork suggests; it is a
    // decorative scale, not a claim about anything.
    const metres = Math.round((ratio * 2400) / 10) * 10;
    marker.style.top = (ratio * 100).toFixed(2) + '%';
    value.style.top = `calc(${(ratio * 100).toFixed(2)}% + 12px)`;
    value.textContent = metres === 0 ? '0 M' : '-' + metres.toLocaleString('en-IN') + ' M';
  };

  scroller.addEventListener('scroll', update, { passive: true });
  update();
}
