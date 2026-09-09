import { appStore } from '../state/appStore.ts';

/**
 * Passcode screen guarding the verification console.
 *
 * This is a convenience gate, not a security boundary — see the note on
 * ADMIN_PASSCODE in appStore.ts. The enforceable check lives in Postgres
 * (`is_admin()`), which every verification RPC calls.
 */
export function renderAdminGateView(): string {
  const state = appStore.getState();

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
            <span class="section-name">RESTRICTED</span>
          </div>

          <h1 class="admin-gate-title">
            Organisers<br />only<span class="cyan-period">.</span>
          </h1>

          <p class="admin-gate-copy">
            This console shows delegate details and payment screenshots.
            Enter the organiser passcode to continue.
          </p>

          <form id="admin-gate-form" autocomplete="off">
            <div class="form-field-group" style="margin-bottom: 14px;">
              <label class="input-field-label" for="admin-passcode-input">PASSCODE</label>
              <div class="input-control-box ${state.adminGateError ? 'has-error' : ''}">
                <input
                  type="password"
                  id="admin-passcode-input"
                  class="text-input-field"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  spellcheck="false"
                />
              </div>
            </div>

            ${state.adminGateError ? `<div class="admin-gate-error">${state.adminGateError}</div>` : ''}

            <button type="submit" class="btn-chamfer-primary" id="btn-admin-unlock">
              <span class="btn-cyan-bead"></span>
              <span>Unlock console</span>
              <span>→</span>
            </button>
          </form>

          <p class="admin-gate-note">
            Delegate data and payment proofs are confidential. Do not open this
            screen on a shared or public device.
          </p>
        </div>
      </div>

    </div>
  `;
}

export function attachAdminGateEvents(): void {
  document.getElementById('btn-gate-back')?.addEventListener('click', () => {
    appStore.setScreen('home');
  });

  const form = document.getElementById('admin-gate-form');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('admin-passcode-input') as HTMLInputElement | null;
    const value = input?.value ?? '';
    if (appStore.unlockAdmin(value)) {
      appStore.showToast('Verification console unlocked');
    }
  });

  // Focus the field so a passcode can be typed immediately.
  const input = document.getElementById('admin-passcode-input') as HTMLInputElement | null;
  if (input && !input.value) input.focus();
}
