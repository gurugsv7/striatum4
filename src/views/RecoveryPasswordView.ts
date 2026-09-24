import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { getCurrentUser, signOut, updateRecoveredEventAdminPassword } from '../services/authService.ts';

/** The destination for a Supabase Auth password-recovery email. */
export function renderRecoveryPasswordView(): string {
  const ready = getCurrentUser()?.email.toLowerCase() === 'gurugsv235@gmail.com';
  return `
    <div class="screen-content no-bottom-nav admin-gate-screen">
      <header class="details-top-header"><button class="btn-back-nav" id="btn-recovery-back"><span class="back-nav-label">EXIT</span></button></header>
      <div class="admin-gate-body">
        <div class="hud-delegate-card admin-gate-card">
          <div class="hud-corner-tl"></div><div class="hud-corner-br"></div>
          <div class="section-index-label"><span class="cyan-num">05</span><span class="slash">/</span><span class="section-name">EVENT ADMIN ACCESS</span></div>
          <h1 class="admin-gate-title">Set organiser<br />password<span class="cyan-period">.</span></h1>
          ${ready ? `<p class="admin-gate-copy">Choose the password for the shared event-admin account.</p>
            <form id="recovery-password-form">
              <div class="input-control-box"><input id="recovery-password" class="text-input-field" type="password" autocomplete="new-password" placeholder="New password" minlength="8" required /></div>
              <div class="input-control-box" style="margin-top: 10px;"><input id="recovery-confirm" class="text-input-field" type="password" autocomplete="new-password" placeholder="Confirm password" minlength="8" required /></div>
              <p id="recovery-password-error" class="reg-field-error" role="alert" aria-live="polite"></p>
              <button class="btn-chamfer-primary" id="btn-recovery-save" type="submit"><span class="btn-cyan-bead"></span><span>SAVE PASSWORD</span><span>→</span></button>
            </form>` : `<p class="admin-gate-copy">Checking the recovery link. If it has expired, send a fresh password recovery email from Supabase Authentication → Users.</p>`}
        </div>
      </div>
    </div>`;
}

export function attachRecoveryPasswordEvents(): void {
  document.getElementById('btn-recovery-back')?.addEventListener('click', () => appStore.setScreen('admin'));
  document.getElementById('recovery-password-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const password = (document.getElementById('recovery-password') as HTMLInputElement).value;
    const confirm = (document.getElementById('recovery-confirm') as HTMLInputElement).value;
    const error = document.getElementById('recovery-password-error');
    const button = document.getElementById('btn-recovery-save') as HTMLButtonElement | null;
    if (password !== confirm) {
      if (error) error.textContent = 'The passwords do not match.';
      return;
    }
    if (button) button.disabled = true;
    if (error) error.textContent = '';
    const result = await updateRecoveredEventAdminPassword(password);
    (document.getElementById('recovery-password') as HTMLInputElement).value = '';
    (document.getElementById('recovery-confirm') as HTMLInputElement).value = '';
    if (!result.ok) {
      if (error) error.textContent = result.message;
      if (button) button.disabled = false;
      return;
    }
    await signOut();
    registration.forgetLocalState();
    appStore.signOut();
    appStore.setScreen('admin');
  });
}
