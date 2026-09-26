import { ScreenType } from '../state/appStore.ts';

/* ============================================================================
 * Routing.
 *
 * Every screen has a real URL and a real history entry. Before this, the app
 * only ever called replaceState, so the whole site was a single history entry
 * and pressing Back left the site entirely from any screen.
 *
 * Routes are enumerated rather than pattern-matched to a catch-all, because the
 * host must keep returning 404 for retired URLs from the previous site — a
 * catch-all would resurrect them in Google's index.
 * ========================================================================== */

export interface Route {
  screen: ScreenType;
  /** Event id, when the route carries one. */
  eventId?: string;
}

/** Public event discovery is readable before sign-in; transactions remain protected. */
// The admin route renders its own credential gate before exposing any data.
const PUBLIC_ROUTES = new Set<ScreenType>([
  'onboarding', 'home', 'explore', 'event-details', 'programme',
  'admin', 'reset-password', 'privacy', 'terms', 'credits'
]);

export function routeRequiresAuth(route: Route): boolean {
  return !PUBLIC_ROUTES.has(route.screen);
}

const STATIC_ROUTES: Record<string, ScreenType> = {
  // Discovery pages are public so delegates and search crawlers can read them.
  // Registration and payment routes still require sign-in.
  '/': 'home',
  '/home': 'home',
  '/events': 'explore',
  '/explore': 'explore',
  '/signin': 'onboarding',
  '/programme': 'programme',
  '/cart': 'cart',
  '/payment': 'event-payment',
  '/confirmed': 'event-confirm',
  '/order/confirm': 'event-confirm',
  '/delegate': 'delegate-registration',
  '/delegate/payment': 'delegate-payment',
  '/delegate/igmcri': 'delegate-home',
  '/delegate/pass': 'delegate-confirm',
  '/my-events': 'my-events',
  '/combos': 'combos',
  '/register': 'registration',
  '/profile': 'profile',
  '/admin': 'admin',
  '/admin/registrations': 'admin-registrations',
  '/reset-password': 'reset-password',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/council': 'council',
  '/credits': 'credits'
};

// Keep one stable canonical path per screen. Deriving this by reversing
// STATIC_ROUTES made aliases such as `/` and `/home` overwrite one another;
// onboarding consequently resolved to `/events` and returning sessions could
// remain trapped on the access screen.
const SCREEN_TO_PATH: Partial<Record<ScreenType, string>> = {
  onboarding: '/signin',
  home: '/',
  explore: '/explore',
  programme: '/programme',
  cart: '/cart',
  'event-payment': '/payment',
  'event-confirm': '/confirmed',
  'delegate-registration': '/delegate',
  'delegate-payment': '/delegate/payment',
  'delegate-home': '/delegate/igmcri',
  'delegate-confirm': '/delegate/pass',
  'my-events': '/my-events',
  combos: '/combos',
  registration: '/register',
  profile: '/profile',
  admin: '/admin',
  'admin-registrations': '/admin/registrations',
  'reset-password': '/reset-password',
  privacy: '/privacy',
  terms: '/terms',
  council: '/council',
  credits: '/credits'
};

/** The URL a given screen should show. */
export function pathFor(screen: ScreenType, eventId?: string): string {
  if (screen === 'event-details') {
    return eventId ? '/event/' + encodeURIComponent(eventId) : '/explore';
  }
  return SCREEN_TO_PATH[screen] ?? '/';
}

/** Parses the current address. Returns null for a path we do not own. */
export function routeFromPath(pathname: string): Route | null {
  const path = pathname.replace(/\/+$/, '') || '/';

  const eventMatch = path.match(/^\/event\/([A-Za-z0-9_-]+)$/);
  if (eventMatch) {
    return { screen: 'event-details', eventId: decodeURIComponent(eventMatch[1]) };
  }

  const screen = STATIC_ROUTES[path];
  return screen ? { screen } : null;
}

/** Human title per screen, so history entries and tabs are distinguishable. */
export function titleFor(screen: ScreenType, eventName?: string): string {
  const suffix = ' | STRIATUM 4.0';
  switch (screen) {
    case 'onboarding':
      return 'Sign in' + suffix;
    case 'home':
      return 'STRIATUM 4.0 — IGMCRI Medical Conclave 2026';
    case 'explore':
      return 'Explore events' + suffix;
    case 'event-details':
      return (eventName ?? 'Event') + suffix;
    case 'programme':
      return 'Programme' + suffix;
    case 'cart':
      return 'Your selection' + suffix;
    case 'event-payment':
      return 'Payment' + suffix;
    case 'event-confirm':
      return 'Registration Confirmed' + suffix;
    case 'delegate-registration':
      return 'Delegate registration' + suffix;
    case 'delegate-payment':
      return 'Delegate payment' + suffix;
    case 'delegate-home':
      return 'IGMCRI delegate' + suffix;
    case 'council':
      return 'SIGMA Council' + suffix;
    case 'delegate-confirm':
      return 'Your Delegate Pass' + suffix;
    case 'my-events':
      return 'My events' + suffix;
    case 'combos':
      return 'Combo offers' + suffix;
    case 'registration':
      return 'Registration details' + suffix;
    case 'profile':
      return 'Profile' + suffix;
    case 'admin':
      return 'Verification console' + suffix;
    case 'reset-password':
      return 'Set organiser password' + suffix;
    case 'admin-registrations':
      return 'Event registrations' + suffix;
    case 'privacy':
      return 'Privacy policy' + suffix;
    case 'terms':
      return 'Registration terms' + suffix;
    case 'credits':
      return 'Website credits | Built by GSV' + suffix;
  }
}
