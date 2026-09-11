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

const STATIC_ROUTES: Record<string, ScreenType> = {
  '/': 'onboarding',
  '/home': 'home',
  '/explore': 'explore',
  '/programme': 'programme',
  '/cart': 'cart',
  '/payment': 'event-payment',
  '/confirmed': 'event-confirm',
  '/order/confirm': 'event-confirm',
  '/delegate': 'delegate-registration',
  '/delegate/payment': 'delegate-payment',
  '/delegate/pass': 'delegate-confirm',
  '/my-events': 'my-events',
  '/profile': 'profile',
  '/admin': 'admin',
  '/privacy': 'privacy',
  '/terms': 'terms'
};

const SCREEN_TO_PATH: Partial<Record<ScreenType, string>> = Object.fromEntries(
  Object.entries(STATIC_ROUTES).map(([path, screen]) => [screen, path])
) as Partial<Record<ScreenType, string>>;

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

/** Every path the app serves, for the host's rewrite configuration. */
export function allRoutePaths(): string[] {
  return [...Object.keys(STATIC_ROUTES), '/event/:id'];
}

/** Human title per screen, so history entries and tabs are distinguishable. */
export function titleFor(screen: ScreenType, eventName?: string): string {
  const suffix = ' | STRIATUM 4.0';
  switch (screen) {
    case 'onboarding':
      return 'Sign in' + suffix;
    case 'home':
      return 'STRIATUM 4.0 — IGMCRI Medical Symposium 2026';
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
    case 'delegate-confirm':
      return 'Your Delegate Pass' + suffix;
    case 'my-events':
      return 'My events' + suffix;
    case 'profile':
      return 'Profile' + suffix;
    case 'admin':
      return 'Verification console' + suffix;
    case 'privacy':
      return 'Privacy policy' + suffix;
    case 'terms':
      return 'Registration terms' + suffix;
  }
}
