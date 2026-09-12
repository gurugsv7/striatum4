import { appStore } from '../state/appStore.ts';
import { renderGoogleButton, signInWithEmail } from '../services/authService.ts';

export function renderOnboardingView(): string {
  return `
    <div class="screen-content no-bottom-nav">
      
      <!-- Top Institutional Header -->
      <header class="onboarding-top-header">
        <div class="institution-col">
          <div class="crest-row">
            <div class="caduceus-crest-badge">
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="16" cy="16" r="14" stroke="rgba(42, 241, 250, 0.5)" stroke-dasharray="2 2"/>
                <!-- Wings -->
                <path d="M11 9C13 8 15 9 16 11C17 9 19 8 21 9C23 10 22 13 19 13C16 13 16 11 16 11" stroke="#ffffff" stroke-width="1.6"/>
                <!-- Staff -->
                <line x1="16" y1="7" x2="16" y2="26" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="7" r="1.8" fill="#2af1fa"/>
                <!-- Entwined Serpents -->
                <path d="M12 14C12 12 20 12 20 16C20 20 12 18 12 22C12 24 16 25 16 25" stroke="#2af1fa" stroke-width="1.4"/>
                <path d="M20 14C20 12 12 12 12 16C12 20 20 18 20 22C20 24 16 25 16 25" stroke="#ffffff" stroke-width="1.4"/>
              </svg>
            </div>
            <div class="inst-text-block">
              <span class="inst-line-primary">INDIRA GANDHI MEDICAL COLLEGE</span>
              <span class="inst-line-secondary">&amp; RESEARCH INSTITUTE</span>
            </div>
          </div>
          <div class="presents-tag-row">
            <span class="cyan-glow-point"></span>
            <span class="presents-line"></span>
            <span class="presents-label">SIGMA 2026 PRESENTS</span>
          </div>
        </div>
      </header>

      <!-- Hero Title Section -->
      <section class="onboarding-hero-section">
        <h1 class="striatum-main-title">STRIATUM</h1>
        <div class="striatum-version-row">
          <span class="symposium-v4">4.0</span>
          <span class="symposium-pipe">|</span>
          <div class="symposium-subtitle-meta">
            <span class="meta-symp-word">MEDICAL</span>
            <span class="meta-symp-word">SYMPOSIUM</span>
            <span class="meta-symp-year">2026</span>
          </div>
        </div>
      </section>

      <!-- Welcome Sign-In Card -->
      <section class="onboarding-signin-card">
        <h2 class="welcome-heading">Welcome</h2>
        <p class="welcome-subtext">Sign in or create your account to access STRIATUM 4.0</p>

        <form id="onboarding-form" class="signin-form" onsubmit="return false;">
          <div class="form-field-group">
            <label class="input-field-label" for="email-input">Email address</label>
            <div class="input-control-box">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input 
                type="email" 
                id="email-input" 
                class="text-input-field" 
                placeholder="you@example.com" 
                required 
              />
            </div>
          </div>

          <div class="form-field-group">
            <label class="input-field-label" for="password-input">Password</label>
            <div class="input-control-box">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="16" height="11" x="4" y="10" rx="2"/>
                  <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                </svg>
              </span>
              <input type="password" id="password-input" class="text-input-field" placeholder="At least 8 characters" minlength="8" required />
            </div>
          </div>

          <!-- Continue with Email Button (Gradient Chamfered) -->
          <button type="submit" id="btn-continue-email" class="btn-chamfer-primary">
            <span class="btn-cyan-bead"></span>
            <span class="btn-label-text">Continue with Email</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </button>

          <!-- Or Divider -->
          <div class="or-separator-row">
            <span class="sep-line"></span>
            <span class="sep-text">or</span>
            <span class="sep-line"></span>
          </div>

          <!--
            Google renders its own button into this mount. Their branding terms
            do not allow a custom-drawn button to issue real credentials, so we
            control only size and theme. The button below is the fallback shown
            when their script is blocked or sign-in is unconfigured.
          -->
          <div id="google-btn-mount" class="google-btn-mount"></div>

          <button type="button" id="btn-continue-google" class="btn-chamfer-dark" hidden>
            <!-- Official Google 4-Color Icon -->
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <!-- Terms & Privacy Note -->
          <div class="terms-agreement-row">
            <div class="shield-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <p class="terms-text">
              By continuing, you agree to the symposium registration 
              <a href="/terms" class="cyan-link" id="link-terms">terms</a> and 
              <a href="/privacy" class="cyan-link" id="link-privacy">privacy policy</a>.
            </p>
          </div>
        </form>
      </section>

      <!-- Onboarding Footer -->
      <footer class="onboarding-footer">
        <div class="footer-left">
          <span class="footer-meta-line">IGMCRI · STRIATUM 4.0</span>
          <div class="footer-sub-row">
            <span class="footer-year">SIGMA 2026</span>
            <span class="footer-dash"></span>
          <a class="footer-credits-link" href="/credits">Website by Built by GSV</a>
          </div>
        </div>
      </footer>

    </div>
  `;
}

export function attachOnboardingEvents(): void {
  const form = document.getElementById('onboarding-form');
  const emailInput = document.getElementById('email-input') as HTMLInputElement;
  const passwordInput = document.getElementById('password-input') as HTMLInputElement;
  const btnGoogle = document.getElementById('btn-continue-google') as HTMLButtonElement | null;
  const linkTerms = document.getElementById('link-terms');
  const linkPrivacy = document.getElementById('link-privacy');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-continue-email') as HTMLButtonElement | null;
      const value = emailInput?.value ?? '';
      const password = passwordInput?.value ?? '';

      if (submitBtn) submitBtn.disabled = true;

      const result = await signInWithEmail(value, password);
      appStore.showToast(result.message);
      if (result.ok) appStore.login(value.trim());
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  // Google's own button, mounted where the placeholder used to be.
  const mount = document.getElementById('google-btn-mount');
  if (mount) {
    renderGoogleButton(mount, result => {
      if (!result.ok) {
        appStore.showToast(result.message ?? 'Google sign-in failed.');
        return;
      }
      const user = result.user;
      if (user) appStore.login(user.email, user.fullName);
    }).then(rendered => {
      // Fall back to a visible, honest disabled state if GIS could not load.
      if (!rendered && btnGoogle) {
        btnGoogle.hidden = false;
        btnGoogle.disabled = true;
        const label = btnGoogle.querySelector('span');
        if (label) label.textContent = 'Google sign-in unavailable';
      }
    });
  }

  if (linkTerms) {
    linkTerms.addEventListener('click', e => {
      e.preventDefault();
      appStore.setScreen('terms');
    });
  }

  if (linkPrivacy) {
    linkPrivacy.addEventListener('click', e => {
      e.preventDefault();
      appStore.setScreen('privacy');
    });
  }
}
