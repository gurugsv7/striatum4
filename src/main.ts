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

import { appStore, AppState, ScreenType } from './state/appStore.ts';
import { initAuth, onAuthChange } from './services/authService.ts';
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
 * Only the admin console needs a shareable address — organisers are told to
 * visit /admin. Delegate screens stay internal to the app's own flow, so they
 * deliberately do not get URLs that could be bookmarked mid-registration.
 * Both /admin and #/admin are accepted, since static hosts differ on whether
 * they rewrite unknown paths to index.html.
 * -------------------------------------------------------------------------- */

/** Screens that own a real, linkable URL. */
const ROUTES: Partial<Record<ScreenType, string>> = {
  admin: '/admin',
  privacy: '/privacy',
  terms: '/terms'
};

function screenFromLocation(): ScreenType | null {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const match = (Object.keys(ROUTES) as ScreenType[]).find(
    screen => ROUTES[screen] === path || ROUTES[screen] === '/' + hash
  );
  return match ?? null;
}

function syncUrl(screen: ScreenType): void {
  const target = ROUTES[screen] ?? '/';
  if (window.location.pathname !== target) {
    window.history.replaceState({}, '', target + window.location.search);
  }
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

  syncUrl(state.currentScreen);

  appContainer.innerHTML = renderDesktopSurround(view.render());

  attachDesktopSurroundEvents();
  view.attach();

  const newScroller = document.getElementById('viewport-scroller');
  if (newScroller) {
    newScroller.scrollTop = isScreenChange ? scrollMemory[state.currentScreen] ?? 0 : scrollMemory[state.currentScreen] ?? newScroller.scrollTop;
    if (isScreenChange && scrollMemory[state.currentScreen] === undefined) newScroller.scrollTop = 0;
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

// A direct visit to /admin lands on the console (behind the passcode gate)
// rather than the delegate sign-in flow.
const routed = screenFromLocation();
if (routed) appStore.setScreen(routed);

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
