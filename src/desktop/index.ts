/**
 * The desktop layer's entry point.
 *
 * main.ts asks this module for a screen only when the viewport is wide enough.
 * Everything under src/desktop/ is unreachable below that breakpoint, and the
 * mobile views are unreachable above it — which is what keeps the two from
 * interfering with each other.
 */
import { appStore, AppState, ScreenType } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';

import { renderRail, renderDepthRuler, attachShell } from './shell.ts';
import { renderDesktopOnboarding, attachDesktopOnboarding } from './views/onboarding.ts';
import { renderDesktopHome, attachDesktopHome } from './views/home.ts';
import { renderDesktopExplore, attachDesktopExplore } from './views/explore.ts';
import { renderDesktopEventDetails, attachDesktopEventDetails } from './views/eventDetails.ts';
import { renderDesktopProgramme, attachDesktopProgramme } from './views/programme.ts';
import { renderDesktopCart, attachDesktopCart } from './views/cart.ts';
import { renderDesktopMyEvents, attachDesktopMyEvents } from './views/myEvents.ts';
import { renderDesktopProfile, attachDesktopProfile } from './views/profile.ts';
import { renderDesktopCombos, attachDesktopCombos } from './views/combos.ts';

// Screens whose single-column form is already the right shape: multi-step
// registration, payment, confirmation, legal text and the organiser console.
// They keep their existing markup and handlers, centred in a console frame.
import { renderDelegateRegistrationView, attachDelegateRegistrationEvents } from '../views/DelegateRegistrationView.ts';
import { renderDelegatePaymentView, attachDelegatePaymentEvents } from '../views/DelegatePaymentView.ts';
import { renderDelegateHomeView, attachDelegateHomeEvents } from '../views/DelegateHomeCollegeView.ts';
import { renderDesktopCouncil, attachDesktopCouncil } from './views/council.ts';
import { renderDelegateConfirmView, attachDelegateConfirmEvents } from '../views/DelegateConfirmView.ts';
import { renderEventPaymentView, attachEventPaymentEvents } from '../views/EventPaymentView.ts';
import { renderEventConfirmView, attachEventConfirmEvents } from '../views/EventConfirmView.ts';
import { renderAdminView, attachAdminEvents } from '../views/AdminView.ts';
import { renderAdminRegistrationsView, attachAdminRegistrationsEvents } from '../views/AdminRegistrationsView.ts';
import { renderAdminGateView, attachAdminGateEvents } from '../views/AdminGateView.ts';
import { renderPrivacyView, attachPrivacyEvents, renderTermsView, attachTermsEvents } from '../views/LegalView.ts';
import { renderCreditsView, attachCreditsEvents } from '../views/CreditsView.ts';
import {
  renderRegistrationFormView,
  attachRegistrationFormEvents
} from '../views/RegistrationFormView.ts';

/** The viewport at which the desktop layer takes over. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

interface DesktopView {
  render: () => string;
  attach: () => void;
  /** Full-bleed screens draw their own chrome and skip the rail. */
  chromeless?: boolean;
  /** Reused mobile screens are centred in a console frame. */
  framed?: boolean;
  wide?: boolean;
}

const BESPOKE: Partial<Record<ScreenType, DesktopView>> = {
  onboarding: { render: renderDesktopOnboarding, attach: attachDesktopOnboarding, chromeless: true },
  home: { render: renderDesktopHome, attach: attachDesktopHome },
  explore: { render: renderDesktopExplore, attach: attachDesktopExplore },
  'event-details': { render: renderDesktopEventDetails, attach: attachDesktopEventDetails },
  programme: { render: renderDesktopProgramme, attach: attachDesktopProgramme },
  cart: { render: renderDesktopCart, attach: attachDesktopCart },
  'my-events': { render: renderDesktopMyEvents, attach: attachDesktopMyEvents },
  combos: { render: renderDesktopCombos, attach: attachDesktopCombos },
  profile: { render: renderDesktopProfile, attach: attachDesktopProfile },
  council: { render: renderDesktopCouncil, attach: attachDesktopCouncil }
};

const FRAMED: Partial<Record<ScreenType, DesktopView>> = {
  registration: { render: renderRegistrationFormView, attach: attachRegistrationFormEvents, framed: true },
  'delegate-registration': { render: renderDelegateRegistrationView, attach: attachDelegateRegistrationEvents, framed: true },
  'delegate-payment': { render: renderDelegatePaymentView, attach: attachDelegatePaymentEvents, framed: true },
  'delegate-home': { render: renderDelegateHomeView, attach: attachDelegateHomeEvents, framed: true },
  'delegate-confirm': { render: renderDelegateConfirmView, attach: attachDelegateConfirmEvents, framed: true },
  'event-payment': { render: renderEventPaymentView, attach: attachEventPaymentEvents, framed: true },
  'event-confirm': { render: renderEventConfirmView, attach: attachEventConfirmEvents, framed: true },
  privacy: { render: renderPrivacyView, attach: attachPrivacyEvents, framed: true },
  terms: { render: renderTermsView, attach: attachTermsEvents, framed: true },
  credits: { render: renderCreditsView, attach: attachCreditsEvents, framed: true },
  admin: { render: renderAdminView, attach: attachAdminEvents, framed: true, wide: true }
  , 'admin-registrations': { render: renderAdminRegistrationsView, attach: attachAdminRegistrationsEvents, framed: true, wide: true }
};

function viewFor(screen: ScreenType): DesktopView {
  if ((screen === 'admin' || screen === 'admin-registrations') && !registration.isAdmin()) {
    return { render: renderAdminGateView, attach: attachAdminGateEvents, framed: true };
  }
  if (screen === 'admin' && !registration.isFinanceAdmin()) {
    return { render: renderAdminRegistrationsView, attach: attachAdminRegistrationsEvents, framed: true, wide: true };
  }
  return BESPOKE[screen] ?? FRAMED[screen] ?? BESPOKE.home!;
}

/** Screens deep enough to deserve the depth ruler beside them. */
function wantsDepthRuler(screen: ScreenType): boolean {
  return screen === 'home' || screen === 'event-details' || screen === 'programme';
}

export function renderDesktopApp(state: AppState): string {
  const view = viewFor(state.currentScreen);

  if (view.chromeless) {
    return `
      <div class="s4-desktop" data-screen="${state.currentScreen}">
        <div class="d-stage" id="viewport-scroller">${view.render()}</div>
        ${renderToast(state)}
      </div>`;
  }

  const body = view.framed
    ? `<div class="d-console-frame ${view.wide ? 'is-wide' : ''}">
         <div class="d-console-column">${view.render()}</div>
       </div>`
    : view.render();

  return `
    <div class="s4-desktop" data-screen="${state.currentScreen}">
      ${renderRail(state.currentScreen)}
      <div class="d-stage" id="viewport-scroller">${body}</div>
      ${wantsDepthRuler(state.currentScreen) ? renderDepthRuler() : ''}
      ${renderToast(state)}
    </div>`;
}

function renderToast(state: AppState): string {
  return `
    <div class="d-toast ${state.notificationMessage ? 'is-visible' : ''}" id="toast-notice"
         role="status" aria-live="polite" aria-atomic="true">
      ${state.notificationMessage ?? ''}
    </div>`;
}

export function attachDesktopApp(state: AppState): void {
  const view = viewFor(state.currentScreen);
  if (!view.chromeless) attachShell();
  view.attach();
}

/** True when the desktop layer should own the render. */
export function isDesktopViewport(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * Calls `onChange` whenever the app crosses the desktop breakpoint, so a window
 * resize swaps surfaces instead of leaving a phone layout stretched across a
 * monitor.
 *
 * Two signals, because one is not dependable. `matchMedia` is the precise one,
 * but it does not fire in every environment that changes the layout viewport
 * (devtools device emulation is one). `resize` always fires; comparing against
 * the last known state keeps it from re-rendering on every pixel of a drag.
 */
export function watchDesktopBreakpoint(onChange: () => void): void {
  const media = window.matchMedia(DESKTOP_QUERY);
  let wasDesktop = media.matches;

  const evaluate = () => {
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    if (isDesktop === wasDesktop) return;
    wasDesktop = isDesktop;
    onChange();
    appStore.refresh();
  };

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', evaluate);
  } else {
    // Safari < 14 and older WebViews.
    (media as MediaQueryList & { addListener: (fn: () => void) => void }).addListener(evaluate);
  }

  let frame = 0;
  window.addEventListener(
    'resize',
    () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        evaluate();
      });
    },
    { passive: true }
  );
}
