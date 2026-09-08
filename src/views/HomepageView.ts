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
          <div class="header-sub-motto">
            <span>MEDICINE</span>
            <span>PEOPLE</span>
            <span>IDEAS</span>
            <span>A DEEPER</span>
            <span>TOMORROW</span>
            <span class="motto-dash"></span>
          </div>
          <button class="header-cart-btn ${cartCount ? 'has-items' : ''}" id="btn-home-cart" title="View cart">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.2"/>
              <circle cx="10" cy="20" r="1"/>
              <circle cx="18" cy="20" r="1"/>
            </svg>
            ${cartCount ? `<span class="cart-count-bead">${cartCount}</span>` : ''}
          </button>
          <button class="user-avatar-circle" id="btn-user-avatar" title="View Profile">
            <span>G</span>
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

        <div class="side-annotation-col">
          <div class="side-annotation-text">
            <span>SAME</span>
            <span>CURIOSITY</span>
            <span>A DEEPER</span>
            <span>TOMORROW</span>
            <span class="bottom-dash"></span>
          </div>
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

          <!-- HUD Delegate ID Card -->
          <div class="hud-delegate-card" id="hud-card-trigger">
            <div class="hud-corner-tl"></div>
            <div class="hud-corner-br"></div>
            
            <div class="hud-label-top">DELEGATE ID</div>
            
            <div class="hud-id-value-row">
              <span class="hud-id-prefix">${delegateApproved ? (delegate?.delegateId ?? 'S4') : 'S4'}</span>
              ${!delegateApproved ? `
                <div class="hud-id-track">
                  <span class="track-node-line"></span>
                  <span class="track-node-dot"></span>
                  <span class="track-node-line"></span>
                  <span class="track-dash"></span>
                  <span class="track-dash"></span>
                  <span class="track-dash"></span>
                  <span class="track-dash"></span>
                </div>
              ` : `
                <span class="track-node-dot" style="margin-left: 8px;"></span>
              `}
            </div>

            <div class="hud-status-row">
              <span class="hud-status-label">STATUS</span>
              <span class="hud-status-val ${delegateApproved ? 'registered' : ''}">
                ${delegateStatusText}
              </span>
            </div>
          </div>
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

          <div class="side-annotation-col" style="top: 15px;">
            <div class="side-annotation-text">
              <span>LEARN</span>
              <span>COLLABORATE</span>
              <span>COMPETE</span>
              <span>CREATE</span>
              <span class="bottom-dash"></span>
            </div>
          </div>
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

          <!-- Schedule Stepper -->
          <div class="schedule-stepper-wrap">
            <div class="stepper-nodes-row">
              <div class="stepper-connecting-line"></div>
              ${days.map(day => `
                <button class="stepper-node-item ${activeDay === day.iso ? 'active' : ''}" data-day-iso="${day.iso}">
                  <span class="stepper-dot"></span>
                  <span class="stepper-num">${day.display.split(' ')[0]}</span>
                </button>
              `).join('')}
            </div>

            <div class="schedule-subtext-meta">
              <span>SIX DAYS</span>
              <span>A WIDER PERSPECTIVE</span>
              <span class="meta-line"></span>
            </div>
          </div>
        </div>

      </div>

      <!-- Homepage Footer -->
      <footer class="home-bottom-footer">
        <div class="footer-left-info">
          <span class="symp-name">STRIATUM 4.0</span>
          <span class="symp-sub">MEDICAL SYMPOSIUM · 2026</span>
          <span class="footer-dash-line"></span>
        </div>
        <div class="footer-right-motto">
          <span>A FAMILIAR JOURNEY,</span>
          <span class="cyan-text">A DEEPER DIVE.</span>
        </div>
      </footer>

    </div>
  `;
}

export function attachHomepageEvents(): void {
  const btnRegisterLink = document.getElementById('btn-register-delegate-link');
  const hudCardTrigger = document.getElementById('hud-card-trigger');
  const btnExploreLink = document.getElementById('btn-explore-events-link');
  const btnProgrammeLink = document.getElementById('btn-view-programme-link');
  const btnAvatar = document.getElementById('btn-user-avatar');

  if (btnRegisterLink) {
    btnRegisterLink.addEventListener('click', () => {
      appStore.setDelegateModalOpen(true);
    });
  }

  if (hudCardTrigger) {
    hudCardTrigger.addEventListener('click', () => {
      appStore.setDelegateModalOpen(true);
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

  if (btnAvatar) {
    btnAvatar.addEventListener('click', () => {
      appStore.setScreen('profile');
    });
  }

  const dayButtons = document.querySelectorAll<HTMLButtonElement>('.stepper-node-item');
  dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const iso = btn.getAttribute('data-day-iso');
      if (iso) {
        appStore.setSelectedProgrammeDate(iso);
        appStore.setScreen('programme');
      }
    });
  });
}
