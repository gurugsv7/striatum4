import { appStore } from '../state/appStore.ts';

export function renderCreditsView(): string {
  return `
    <div class="screen-content no-bottom-nav legal-screen credits-screen">
      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-credits-back" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span class="back-nav-label">BACK</span>
        </button>
        <div class="details-brand-sig">
          <div class="sig-striatum">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="sig-inst">IGMCRI · SIGMA 2026</div>
        </div>
      </header>

      <section class="explore-hero-section legal-hero">
        <div class="section-index-label" style="margin-bottom: 4px;">
          <span class="cyan-num">03</span>
          <span class="slash">/</span>
          <span class="section-name">CREDITS</span>
        </div>
        <h1 class="explore-heading">Made with<br />intention<span class="cyan-period">.</span></h1>
        <p class="explore-subtitle">The digital experience for STRIATUM 4.0 was designed and developed by Built by GSV.</p>
      </section>

      <div class="legal-body credits-body">
        <div class="legal-rail"></div>
        <section class="legal-clause credits-clause">
          <div class="legal-clause-index">01</div>
          <div class="legal-clause-body">
            <h2 class="legal-clause-heading">DIGITAL EXPERIENCE</h2>
            <p class="legal-paragraph">Built by GSV created the website experience, registration journey and event discovery interface for the IGMCRI medical symposium.</p>
            <p class="legal-paragraph">Explore the team behind this work at <a class="credits-external-link" href="https://www.builtbygsv.in/" target="_blank" rel="noopener">Built by GSV</a>.</p>
          </div>
        </section>
      </div>

      <footer class="details-footer">
        <div class="footer-left-meta">
          <span class="symp-name">STRIATUM 4.0</span>
          <span class="symp-sub">IGMCRI · SIGMA 2026</span>
          <span class="footer-dash-line"></span>
        </div>
        <div class="footer-right-sig">
          <span>DESIGNED FOR THE JOURNEY.</span>
          <a class="credits-footer-link" href="https://www.builtbygsv.in/" target="_blank" rel="noopener">BUILT BY GSV ↗</a>
        </div>
      </footer>
    </div>
  `;
}

export function attachCreditsEvents(): void {
  document.getElementById('btn-credits-back')?.addEventListener('click', () => {
    // Credits stay publicly crawlable, but entering the application from here
    // must still pass through the access screen for unauthenticated visitors.
    if (appStore.getState().isAuthenticated) {
      appStore.goBackFromLegal();
    } else {
      appStore.setScreen('onboarding');
    }
  });
}
