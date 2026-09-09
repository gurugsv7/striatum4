import { appStore } from '../state/appStore.ts';
import { allEventDates } from '../data/events.ts';
import * as registration from '../services/registrationService.ts';

export function renderHomepageView(): string {
  const state = appStore.getState();

  const delegate = registration.getDelegate();
  const delegateStatus = registration.getDelegateStatus();
  const delegateApproved = delegateStatus === 'approved';

  // Programme days come from published event dates only — none are invented.
  const days = allEventDates();
  const dayRange = days.length
    ? days.length === 1
      ? days[0].display
      : days[0].display + ' — ' + days[days.length - 1].display + ' · ' + days.length + ' DAYS'
    : '';
  const activeDay = state.selectedProgrammeDate ?? days[0]?.iso ?? null;

  const delegateCta =
    delegateStatus === 'none'
      ? 'REGISTER AS DELEGATE'
      : delegateStatus === 'pending'
      ? 'VIEW APPLICATION'
      : delegateStatus === 'rejected'
      ? 'APPLICATION NEEDS ATTENTION'
      : 'VIEW DELEGATE PASS';

  const delegateStatusText =
    delegateStatus === 'approved'
      ? 'ACTIVE'
      : delegateStatus === 'pending'
      ? 'AWAITING VERIFICATION'
      : delegateStatus === 'rejected'
      ? 'NEEDS ATTENTION'
      : 'NOT REGISTERED';

  const cartCount = registration.cartCount();

  return `
    <div class="screen-content">
      
      <!-- Top App Bar -->
      <header class="app-top-header">
        <div class="app-brand-block">
          <div class="app-brand-title">
            STRIATUM <span class="cyan-text">4.0</span>
          </div>
          <div class="app-brand-meta">
            IGMCRI · SIGMA 2026
          </div>
          <div class="app-brand-glow-bar">
            <span class="glow-bar-line"></span>
            <span class="glow-bar-dot"></span>
          </div>
        </div>

        <div class="header-right-block">
          <button class="header-cart-btn ${cartCount ? 'has-items' : ''}" id="btn-home-cart" title="View cart">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.2"/>
              <circle cx="10" cy="20" r="1"/>
              <circle cx="18" cy="20" r="1"/>
            </svg>
            ${cartCount ? `<span class="cart-count-bead">${cartCount}</span>` : ''}
          </button>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="home-hero-section">
        <div class="home-hero-text">
          <h1 class="home-welcome-title">
            Welcome to<br />
            STRIATUM<span class="cyan-period">.</span>
          </h1>
          <p class="home-welcome-sub">
            Your symposium journey starts here.
          </p>
        </div>
      </section>

      <!-- Vertical Timeline Sections -->
      <div class="home-timeline-container">
        
        <!-- 01 / DELEGATE ACCESS -->
        <div class="timeline-section-wrap">
          <div class="timeline-rail-line"></div>
          <div class="timeline-node-bead"></div>

          <div class="section-index-label">
            <span class="cyan-num">01</span>
            <span class="slash">/</span>
            <span class="section-name">DELEGATE ACCESS</span>
          </div>

          <h2 class="section-heading-serif">
            Get your<br />
            Delegate ID<span class="cyan-period">.</span>
          </h2>

          <p class="section-desc-text">
            Register once to unlock event and workshop registrations across STRIATUM 4.0.
          </p>

          <button class="action-link-cyan" id="btn-register-delegate-link">
            <span>${delegateCta}</span>
            <span>→</span>
          </button>
        </div>

        <!-- 02 / EXPLORE -->
        <div class="timeline-section-wrap">
          <div class="timeline-rail-line"></div>
          <div class="timeline-node-bead"></div>

          <div class="section-index-label">
            <span class="cyan-num">02</span>
            <span class="slash">/</span>
            <span class="section-name">EXPLORE</span>
          </div>

          <h2 class="section-heading-serif">
            Explore Events<span class="cyan-period">.</span>
          </h2>

          <p class="section-desc-text">
            Workshops · Competitions · Presentations
          </p>

          <button class="action-link-cyan" id="btn-explore-events-link">
            <span>EXPLORE EVENTS</span>
            <span>→</span>
          </button>
        </div>

        <!-- 03 / PROGRAMME -->
        <div class="timeline-section-wrap">
          <div class="timeline-rail-line"></div>
          <div class="timeline-node-bead"></div>

          <div class="section-index-label">
            <span class="cyan-num">03</span>
            <span class="slash">/</span>
            <span class="section-name">PROGRAMME</span>
          </div>

          <h2 class="section-heading-serif">
            Event Schedule<span class="cyan-period">.</span>
          </h2>

          ${dayRange ? `<p class="section-desc-text" style="margin-bottom: 8px;">${dayRange}</p>` : ''}

          <button class="action-link-cyan" id="btn-view-programme-link">
            <span>VIEW PROGRAMME</span>
            <span>→</span>
          </button>
        </div>

      </div>

      <!-- Homepage Footer -->
      <footer class="home-bottom-footer">
        <div class="footer-left-info">
          <span class="symp-name">STRIATUM 4.0</span>
          <span class="symp-sub">MEDICAL SYMPOSIUM · 2026</span>
          <span class="footer-dash-line"></span>
        </div>
      </footer>

    </div>
  `;
}

export function attachHomepageEvents(): void {
  const btnRegisterLink = document.getElementById('btn-register-delegate-link');
  const btnExploreLink = document.getElementById('btn-explore-events-link');
  const btnProgrammeLink = document.getElementById('btn-view-programme-link');

  if (btnRegisterLink) {
    btnRegisterLink.addEventListener('click', () => {
      appStore.setScreen('delegate-registration');
    });
  }

  if (btnExploreLink) {
    btnExploreLink.addEventListener('click', () => {
      appStore.setScreen('explore');
    });
  }

  if (btnProgrammeLink) {
    btnProgrammeLink.addEventListener('click', () => {
      appStore.setScreen('programme');
    });
  }

  document.getElementById('btn-home-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });
}
