import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { getCurrentUser } from '../services/authService.ts';

/**
 * Access screen for the verification console.
 *
 * There is no passcode any more. A bundled passcode shipped inside the
 * JavaScript, so anyone who read the bundle could recover it — keeping it
 * alongside the real check would only imply a protection it could not give.
 *
 * The boundary is now entirely server-side: the `admins` table and `is_admin()`
 * in Postgres, which every verification RPC checks and which RLS uses to decide
 * what rows come back. This screen only explains why the console is not
 * available; it grants nothing.
 */
export function renderAdminGateView(): string {
  const signedIn = getCurrentUser() !== null;

  const body = signedIn
    ? {
        index: 'NOT AUTHORISED',
        title: 'Organisers<br />only',
        copy:
          'You are signed in, but this account is not registered as a STRIATUM 4.0 organiser. ' +
          'Access is granted server-side, so nothing you enter here can unlock it.',
        note:
          'If you should have access, ask an existing organiser to add your account to the ' +
          'verification team.',
        action: { id: 'btn-gate-home', label: 'Back to the symposium' }
      }
    : {
        index: 'RESTRICTED',
        title: 'Sign in to<br />continue',
        copy:
          'The verification console shows delegate details and payment screenshots. ' +
          'Sign in with your organiser account to continue.',
        note: 'Delegate data and payment proofs are confidential. Do not open this screen on a shared device.',
        action: { id: 'btn-gate-signin', label: 'Go to sign in' }
      };

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
            <span class="section-name">${body.index}</span>
          </div>

          <h1 class="admin-gate-title">${body.title}<span class="cyan-period">.</span></h1>

          <p class="admin-gate-copy">${body.copy}</p>

          <button class="btn-chamfer-primary" id="${body.action.id}">
            <span class="btn-cyan-bead"></span>
            <span>${body.action.label}</span>
            <span>→</span>
          </button>

          <p class="admin-gate-note">${body.note}</p>
        </div>
      </div>

    </div>
  `;
}

export function attachAdminGateEvents(): void {
  document.getElementById('btn-gate-back')?.addEventListener('click', () => {
    appStore.setScreen(getCurrentUser() ? 'home' : 'onboarding');
  });

  document.getElementById('btn-gate-home')?.addEventListener('click', () => {
    appStore.setScreen('home');
  });

  document.getElementById('btn-gate-signin')?.addEventListener('click', () => {
    appStore.setScreen('onboarding');
  });

  // An organiser may land here a moment before the admin check has returned.
  void registration.hydrate();
}
