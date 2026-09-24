import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { getCurrentUser } from '../services/authService.ts';
import { signInEventAdmin } from '../services/authService.ts';

// Hydration notifies the app store. Guarding it by account prevents the gate
// from starting a new request every time that notification re-renders it.
let hydratedUserId: string | null = null;

/**
 * Access screen for the verification console.
 *
 * Supabase Auth checks the shared event-admin password. The database still
 * decides what an authenticated organiser can read or change.
 */
export function renderAdminGateView(): string {
  const signedIn = getCurrentUser() !== null;

  return `
    <div class="screen-content no-bottom-nav admin-gate-screen">

      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-gate-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span class="back-nav-label">EXIT</span>
        </button>
      </header>

      <div class="admin-gate-body">
        <div class="hud-delegate-card admin-gate-card">
          <div class="hud-corner-tl"></div>
          <div class="hud-corner-br"></div>

          <div class="section-index-label" style="margin-bottom: 10px;">
            <span class="cyan-num">05</span>
            <span class="slash">/</span>
            <span class="section-name">EVENT ADMIN ACCESS</span>
          </div>

          <h1 class="admin-gate-title">Organiser<br />sign in<span class="cyan-period">.</span></h1>

          <p class="admin-gate-copy">Use the shared event-admin username and password to check this year's events and registrations.</p>

          <form id="admin-gate-form" autocomplete="on">
            <div class="input-control-box"><input id="admin-username" class="text-input-field" name="username" type="text" autocomplete="username" placeholder="Username" required /></div>
            <div class="input-control-box" style="margin-top: 10px;"><input id="admin-password" class="text-input-field" name="password" type="password" autocomplete="current-password" placeholder="Password" required /></div>
            <p id="admin-gate-error" class="reg-field-error" role="alert" aria-live="polite"></p>
            <button class="btn-chamfer-primary" id="btn-admin-login" type="submit"><span class="btn-cyan-bead"></span><span>OPEN EVENT ADMIN</span><span>→</span></button>
          </form>

          <p class="admin-gate-note">${signedIn ? 'Signing in here switches from your current account.' : 'Finance approvals require the separate finance account.'}</p>
          <button class="action-link-cyan" id="btn-finance-signin" type="button">FINANCE EMAIL SIGN IN →</button>
        </div>
      </div>

    </div>
  `;
}

export function attachAdminGateEvents(): void {
  document.getElementById('btn-gate-back')?.addEventListener('click', () => {
    appStore.setScreen(getCurrentUser() ? 'home' : 'onboarding');
  });

  document.getElementById('btn-finance-signin')?.addEventListener('click', () => {
    appStore.setScreen('onboarding');
  });

  document.getElementById('admin-gate-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const username = (document.getElementById('admin-username') as HTMLInputElement | null)?.value ?? '';
    const passwordInput = document.getElementById('admin-password') as HTMLInputElement | null;
    const button = document.getElementById('btn-admin-login') as HTMLButtonElement | null;
    const error = document.getElementById('admin-gate-error');
    if (button) button.disabled = true;
    if (error) error.textContent = '';
    const result = await signInEventAdmin(username, passwordInput?.value ?? '');
    if (passwordInput) passwordInput.value = '';
    if (!result.ok) {
      if (error) error.textContent = result.message;
      if (button) button.disabled = false;
      return;
    }
    try {
      await registration.hydrate();
      if (!registration.isAdmin()) throw new Error('Event-admin access was not confirmed.');
      appStore.setScreen('admin');
    } catch {
      if (error) error.textContent = 'Could not load the event roster. Please try again.';
      if (button) button.disabled = false;
    }
  });

  // An organiser may land here a moment before the admin check has returned.
  // Only start one refresh for the current account; otherwise the gate's own
  // store notification would create an endless render/hydrate loop.
  const userId = getCurrentUser()?.id ?? null;
  if (userId && hydratedUserId !== userId) {
    hydratedUserId = userId;
    void registration.hydrate();
  }
}
