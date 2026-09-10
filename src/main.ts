import './styles/tokens.css';
import './styles/main.css';
import './styles/components.css';
import './styles/onboarding.css';
import './styles/homepage.css';
import './styles/explore.css';
import './styles/details.css';
import './styles/commerce.css';
import './styles/delegate.css';
import './styles/programme.css';
import './styles/admin.css';
import './styles/legal.css';
import './styles/profile.css';

import { appStore, AppState, ScreenType } from './state/appStore.ts';
import { initAuth, onAuthChange } from './services/authService.ts';
import { pathFor, routeFromPath, titleFor } from './services/router.ts';
import * as registrationService from './services/registrationService.ts';
const hydrateRegistrations = registrationService.hydrate;
import { renderDesktopSurround, attachDesktopSurroundEvents } from './components/DesktopSurround.ts';
import { renderOnboardingView, attachOnboardingEvents } from './views/OnboardingView.ts';
import { renderHomepageView, attachHomepageEvents } from './views/HomepageView.ts';
import { renderExploreView, attachExploreEvents } from './views/ExploreView.ts';
import { renderEventDetailsView, attachEventDetailsEvents } from './views/EventDetailsView.ts';
import { renderCartView, attachCartEvents } from './views/CartView.ts';
import { renderMyEventsView, attachMyEventsEvents } from './views/MyEventsView.ts';
import { renderProgrammeView, attachProgrammeEvents } from './views/ProgrammeView.ts';
import { renderProfileView, attachProfileEvents } from './views/ProfileView.ts';
import { renderAdminView, attachAdminEvents } from './views/AdminView.ts';
import { renderAdminGateView, attachAdminGateEvents } from './views/AdminGateView.ts';
import { renderDelegateRegistrationView, attachDelegateRegistrationEvents } from './views/DelegateRegistrationView.ts';
import { renderDelegatePaymentView, attachDelegatePaymentEvents } from './views/DelegatePaymentView.ts';
import { renderDelegateConfirmView, attachDelegateConfirmEvents } from './views/DelegateConfirmView.ts';
import { renderEventPaymentView, attachEventPaymentEvents } from './views/EventPaymentView.ts';
import {
  renderPrivacyView,
  attachPrivacyEvents,
  renderTermsView,
  attachTermsEvents
} from './views/LegalView.ts';

const VIEWS: Record<ScreenType, { render: () => string; attach: () => void }> = {
  onboarding: { render: renderOnboardingView, attach: attachOnboardingEvents },
  home: { render: renderHomepageView, attach: attachHomepageEvents },
  explore: { render: renderExploreView, attach: attachExploreEvents },
  'event-details': { render: renderEventDetailsView, attach: attachEventDetailsEvents },
  cart: { render: renderCartView, attach: attachCartEvents },
  'my-events': { render: renderMyEventsView, attach: attachMyEventsEvents },
  programme: { render: renderProgrammeView, attach: attachProgrammeEvents },
  profile: { render: renderProfileView, attach: attachProfileEvents },
  admin: { render: renderAdminView, attach: attachAdminEvents },
  'delegate-registration': { render: renderDelegateRegistrationView, attach: attachDelegateRegistrationEvents },
  'delegate-payment': { render: renderDelegatePaymentView, attach: attachDelegatePaymentEvents },
  'delegate-confirm': { render: renderDelegateConfirmView, attach: attachDelegateConfirmEvents },
  'event-payment': { render: renderEventPaymentView, attach: attachEventPaymentEvents },
  privacy: { render: renderPrivacyView, attach: attachPrivacyEvents },
  terms: { render: renderTermsView, attach: attachTermsEvents }
};

/** Scroll position per screen, so returning to Explore does not lose the user's place. */
const scrollMemory: Partial<Record<ScreenType, number>> = {};
let lastScreen: ScreenType | null = null;

/* ---------------------------------------------------------------- routing --
 * Every screen owns a URL and pushes a history entry, so Back moves within the
 * app instead of leaving it, and any screen can be refreshed or shared.
 *
 * `popstate` restores state without pushing again, which is what stops Back
 * from fighting the app.
 * -------------------------------------------------------------------------- */

/** Set while handling popstate so the render does not push a duplicate entry. */
let restoringFromHistory = false;

function syncUrlAndTitle(state: AppState): void {
  const eventName = state.currentScreen === 'event-details' ? appStore.getSelectedEvent()?.name : undefined;
  document.title = titleFor(state.currentScreen, eventName);

  const target = pathFor(state.currentScreen, state.selectedEventId) + window.location.search;
  const current = window.location.pathname + window.location.search;
  if (current === target) return;

  if (restoringFromHistory) {
    // The address bar is already correct; touching history here would fight Back.
    return;
  }
  window.history.pushState({ screen: state.currentScreen, eventId: state.selectedEventId }, '', target);
}

window.addEventListener('popstate', () => {
  const route = routeFromPath(window.location.pathname);
  restoringFromHistory = true;
  if (route) {
    if (route.eventId) appStore.setSelectedEvent(route.eventId);
    appStore.setScreen(route.screen);
  } else {
    appStore.setScreen('home');
  }
  restoringFromHistory = false;
});

/**
 * Politely announces a navigation. Lives outside #app so the wholesale
 * innerHTML replacement never destroys the live region mid-announcement.
 */
function announce(message: string): void {
  let region = document.getElementById('route-announcer');
  if (!region) {
    region = document.createElement('div');
    region.id = 'route-announcer';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText =
      'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
      'clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    document.body.appendChild(region);
  }
  region.textContent = message;
}

function renderApp(state: AppState): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const scroller = document.getElementById('viewport-scroller');
  if (scroller && lastScreen) scrollMemory[lastScreen] = scroller.scrollTop;
  const isScreenChange = lastScreen !== state.currentScreen;

  // Preserve caret in the search field across the wholesale re-render.
  const active = document.activeElement;
  const searchFocused = active instanceof HTMLInputElement && active.id === 'explore-search-input';
  const caretStart = searchFocused ? active.selectionStart : null;
  const caretEnd = searchFocused ? active.selectionEnd : null;

  // Admin access is decided server-side by is_admin(); this only mirrors it so
  // a non-organiser sees an explanation instead of an empty console.
  const view =
    state.currentScreen === 'admin' && !registrationService.isAdmin()
      ? { render: renderAdminGateView, attach: attachAdminGateEvents }
      : VIEWS[state.currentScreen] ?? VIEWS.home;

  syncUrlAndTitle(state);

  appContainer.innerHTML = renderDesktopSurround(view.render());

  attachDesktopSurroundEvents();
  view.attach();

  const newScroller = document.getElementById('viewport-scroller');
  if (newScroller) {
    newScroller.scrollTop = isScreenChange ? scrollMemory[state.currentScreen] ?? 0 : scrollMemory[state.currentScreen] ?? newScroller.scrollTop;
    if (isScreenChange && scrollMemory[state.currentScreen] === undefined) newScroller.scrollTop = 0;
  }
  if (isScreenChange) {
    // The app replaces its entire DOM on navigation, so focus would otherwise
    // fall back to <body> and a screen reader would announce nothing.
    const heading = document.querySelector<HTMLElement>(
      '.screen-content h1, .screen-content .explore-heading, .screen-content .hero-display-title'
    );
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    announce(document.title.replace(' | STRIATUM 4.0', ''));
  }
  lastScreen = state.currentScreen;

  if (searchFocused) {
    const input = document.getElementById('explore-search-input') as HTMLInputElement | null;
    if (input) {
      input.focus();
      if (caretStart !== null && caretEnd !== null) input.setSelectionRange(caretStart, caretEnd);
    }
  }
}

// Restore the screen named by the address, so a refresh or a shared link lands
// where it should instead of bouncing to sign-in.
const initialRoute = routeFromPath(window.location.pathname);
if (initialRoute) {
  if (initialRoute.eventId) appStore.setSelectedEvent(initialRoute.eventId);
  appStore.setScreen(initialRoute.screen);
}
// Seed the first history entry so the very first Back has somewhere to return to.
window.history.replaceState(
  { screen: appStore.getState().currentScreen, eventId: appStore.getState().selectedEventId },
  '',
  window.location.pathname + window.location.search
);

renderApp(appStore.getState());
appStore.subscribe(renderApp);

// Restore a persisted Supabase session, so a returning delegate is not asked to
// sign in again, and reflect sign-out that happened in another tab.
onAuthChange(user => {
  if (user) {
    if (!appStore.getState().isAuthenticated) appStore.login(user.email, user.fullName);
    // Pull this delegate's real orders, registrations and pass status down.
    void hydrateRegistrations();
  } else if (appStore.getState().isAuthenticated) {
    appStore.signOut();
  }
});
void initAuth();
