import { appStore } from '../../state/appStore.ts';
import { renderGoogleButton, signInWithEmail } from '../../services/authService.ts';
import { allEventDates } from '../../data/events.ts';
import { crest, icon } from '../shell.ts';

/**
 * Desktop sign-in.
 *
 * The phone stacks crest, wordmark and form down one column. With 1440px the
 * wordmark can hold the left half at full size against the open water, and the
 * form becomes a console panel on the right — so nothing has to shrink.
 */
export function renderDesktopOnboarding(): string {
  const days = allEventDates();

  return `
    <div class="d-signin">
      <div class="d-signin-bg" aria-hidden="true"></div>
      <div class="d-signin-veil" aria-hidden="true"></div>

      <div class="d-signin-inner">
        <header class="d-signin-head">
          <div class="d-crest-row">
            <span class="d-crest-badge">${crest(30)}</span>
            <div>
              <span class="d-inst-primary">INDIRA GANDHI MEDICAL COLLEGE</span>
              <span class="d-inst-secondary">&amp; RESEARCH INSTITUTE</span>
              <div class="d-presents">
                <span class="d-presents-dot"></span>
                <span class="d-presents-line"></span>
                <span class="d-presents-label">SIGMA 2026 PRESENTS</span>
              </div>
            </div>
          </div>
          <p class="d-annot">SAME CURIOSITY<br>A DEEPER TOMORROW</p>
        </header>

        <div class="d-signin-body">
          <div class="d-signin-brand">
            <h1 class="d-wordmark">STRIATUM</h1>
            <div class="d-version-row">
              <span class="d-version-num">4.0</span>
              <span class="d-version-rule"></span>
              <div class="d-version-meta">
                <span>MEDICAL</span><span>SYMPOSIUM</span><em>2026</em>
              </div>
            </div>
            <p class="d-lede" style="font-size: 16px; max-width: 470px;">
              Workshops, quizzes, research and creative events at IGMCRI, Puducherry.
              One sign-in unlocks every registration.
            </p>
            ${
              days.length
                ? `<div class="d-daybar">
                    ${days
                      .map(
                        (day, index) => `
                      ${index > 0 ? '<span class="d-daybar-rule"></span>' : ''}
                      <span class="d-daybar-node ${index === 0 ? 'is-first' : ''}">
                        <span class="d-daybar-dot"></span>
                        <span class="d-daybar-label">${day.display.replace(/\s*OCT$/i, '')}</span>
                      </span>`
                      )
                      .join('')}
                    <span class="d-daybar-label" style="margin: 0 0 18px 22px; letter-spacing: 2px;">OCT 2026</span>
                  </div>`
                : ''
            }
          </div>

          <section class="d-signin-card d-hud" aria-label="Sign in">
            <h2 class="d-welcome">Welcome<span class="d-dot">.</span></h2>
            <p class="d-welcome-sub">Sign in or create your account to access STRIATUM 4.0</p>

            <form id="onboarding-form" class="d-form" onsubmit="return false;">
              <div class="d-field">
                <label class="d-field-label" for="email-input">Email address</label>
                <div class="d-input-box">
                  ${icon('mail', 18)}
                  <input type="email" id="email-input" class="d-input" placeholder="you@example.com" required autocomplete="email" />
                </div>
              </div>

              <div class="d-field">
                <label class="d-field-label" for="password-input">Password</label>
                <div class="d-input-box">
                  ${icon('lock', 18)}
                  <input type="password" id="password-input" class="d-input" placeholder="At least 8 characters" minlength="8" required autocomplete="current-password" />
                </div>
              </div>

              <button type="submit" id="btn-continue-email" class="d-btn">
                <span>Continue with Email</span>
                ${icon('arrow', 18, 2)}
              </button>

              <div class="d-or"><span>OR</span></div>

              <!-- Google renders its own button here; the button below is the
                   honest fallback when their script is blocked. -->
              <div id="google-btn-mount" class="google-btn-mount"></div>

              <button type="button" id="btn-continue-google" class="d-btn-ghost" hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div class="d-terms">
                ${icon('shield', 16, 2)}
                <p>
                  By continuing, you agree to the symposium registration
                  <a href="/terms" id="link-terms">terms</a> and
                  <a href="/privacy" id="link-privacy">privacy policy</a>.
                </p>
              </div>
            </form>
          </section>
        </div>

        <footer class="d-signin-foot">
          <div class="d-foot-stack">
            <b>IGMCRI &middot; STRIATUM 4.0</b>
            <span>SIGMA 2026 &middot; <a href="/credits" id="d-credits-link">WEBSITE BY BUILT BY GSV</a></span>
          </div>
          <span class="d-foot-stack" style="text-align: right;">14&ndash;18 OCTOBER 2026 &middot; PUDUCHERRY</span>
        </footer>
      </div>
    </div>`;
}

export function attachDesktopOnboarding(): void {
  const form = document.getElementById('onboarding-form');
  const emailInput = document.getElementById('email-input') as HTMLInputElement | null;
  const passwordInput = document.getElementById('password-input') as HTMLInputElement | null;
  const googleFallback = document.getElementById('btn-continue-google') as HTMLButtonElement | null;

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = document.getElementById('btn-continue-email') as HTMLButtonElement | null;
    const email = emailInput?.value ?? '';
    const password = passwordInput?.value ?? '';

    if (submit) submit.disabled = true;
    const result = await signInWithEmail(email, password);
    appStore.showToast(result.message);
    if (result.ok) appStore.login(email.trim());
    if (submit) submit.disabled = false;
  });

  const mount = document.getElementById('google-btn-mount');
  if (mount) {
    void renderGoogleButton(mount, result => {
      if (!result.ok) {
        appStore.showToast(result.message ?? 'Google sign-in failed.');
        return;
      }
      const user = result.user;
      if (user && !appStore.getState().isAuthenticated) {
        appStore.login(user.email, user.fullName);
      }
    }).then(rendered => {
      if (!rendered && googleFallback) {
        googleFallback.hidden = false;
        googleFallback.disabled = true;
        const label = googleFallback.querySelector('span');
        if (label) label.textContent = 'Google sign-in unavailable';
      }
    });
  }

  document.getElementById('link-terms')?.addEventListener('click', event => {
    event.preventDefault();
    appStore.setScreen('terms');
  });

  document.getElementById('link-privacy')?.addEventListener('click', event => {
    event.preventDefault();
    appStore.setScreen('privacy');
  });

  document.getElementById('d-credits-link')?.addEventListener('click', event => {
    event.preventDefault();
    appStore.setScreen('credits');
  });
}
