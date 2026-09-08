import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';

export function renderProfileView(): string {
  const state = appStore.getState();
  const delegate = registration.getDelegate();
  const status = registration.getDelegateStatus();
  const approved = status === 'approved';

  const groups = registration.getMyEvents();
  const confirmedCount = groups.confirmed.length;
  const pendingCount = groups.pending.length;

  const statusPill =
    status === 'approved'
      ? 'VERIFIED'
      : status === 'pending'
      ? 'AWAITING VERIFICATION'
      : status === 'rejected'
      ? 'NEEDS ATTENTION'
      : 'NOT REGISTERED';

  // A Delegate ID exists only after manual approval — never show a placeholder one.
  const credentialValue = approved ? delegate?.delegateId ?? '—' : statusPill;

  return `
    <div class="screen-content">
      <header class="app-top-header">
        <div class="app-brand-block">
          <div class="app-brand-title">
            STRIATUM <span class="cyan-text">4.0</span>
          </div>
          <div class="app-brand-meta">
            DELEGATE CREDENTIAL
          </div>
        </div>

        <div class="header-right-block">
          <button class="action-link-cyan" id="btn-sign-out" style="font-size: 10px; border-bottom: none;">
            SIGN OUT
          </button>
        </div>
      </header>

      <section class="explore-hero-section" style="margin-bottom: 20px;">
        <div class="section-index-label">
          <span class="cyan-num">08</span>
          <span class="slash">/</span>
          <span class="section-name">DELEGATE PROFILE</span>
        </div>

        <h1 class="explore-heading">
          Your pass<span class="cyan-period">.</span>
        </h1>

        <p class="explore-subtitle">
          Indira Gandhi Medical College &amp; Research Institute · SIGMA 2026
        </p>
      </section>

      <div class="hud-delegate-card profile-credential-card">
        <div class="hud-corner-tl"></div>
        <div class="hud-corner-br"></div>

        <div class="credential-head">
          <div>
            <div class="hud-label-top">DELEGATE IDENTIFIER</div>
            <div class="credential-value ${approved ? 'is-issued' : 'is-unissued'}">${credentialValue}</div>
          </div>
          <div class="event-badge-pill credential-pill status-${status}">${statusPill}</div>
        </div>

        <div class="credential-identity">
          <div class="credential-name">${delegate?.fullName ?? 'Delegate'}</div>
          <div class="credential-email">${delegate?.email ?? state.userEmail ?? ''}</div>
          ${delegate?.institution ? `<div class="credential-inst">${delegate.institution}</div>` : ''}
        </div>

        ${
          status === 'rejected' && delegate?.rejectionReason
            ? `<div class="credential-reason">${delegate.rejectionReason}</div>`
            : ''
        }

        <div class="credential-meta-row">
          <span>${confirmedCount} CONFIRMED</span>
          <span>${pendingCount} PENDING</span>
        </div>
      </div>

      ${
        approved
          ? `<button class="btn-chamfer-dark" id="btn-view-my-events-profile" style="margin-bottom: 20px;">
              View my registrations →
            </button>`
          : `<button class="btn-chamfer-primary" id="btn-activate-pass" style="margin-bottom: 20px;">
              <span class="btn-cyan-bead"></span>
              <span>${status === 'none' ? 'Register as Delegate' : 'View application'}</span>
              <span>→</span>
            </button>`
      }

      <div class="accordion-group">
        <div class="accordion-item">
          <button class="accordion-trigger" id="acc-delegate-perks">
            <div class="accordion-title-row">
              <span class="accordion-ring-icon"></span>
              <span>HOW THE DELEGATE PASS WORKS</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="accordion-chevron">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div class="accordion-content">
            <ul class="section-bullet-list">
              <li><span class="section-bullet-node"></span><span>Delegate registration is verified manually by the organising team.</span></li>
              <li><span class="section-bullet-node"></span><span>All ten workshops require an approved Delegate Pass.</span></li>
              <li><span class="section-bullet-node"></span><span>THE MEDICAL VAULT and MEDMAZE do not require one.</span></li>
              <li><span class="section-bullet-node"></span><span>THE DIAGNOSTIC ABYSS and CORAL CANVAS do not require one for abstract submission.</span></li>
            </ul>
          </div>
        </div>

        <div class="accordion-item">
          <button class="accordion-trigger" id="acc-symposium-info">
            <div class="accordion-title-row">
              <span class="accordion-ring-icon"></span>
              <span>ACCOMMODATION &amp; FOOD</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="accordion-chevron">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div class="accordion-content">
            <div class="section-fact-list">
              <div class="section-fact-row">
                <span class="section-fact-label">ACCOMMODATION</span>
                <span class="section-fact-value">₹500 per person per day</span>
              </div>
              <div class="section-fact-row">
                <span class="section-fact-label">ACCOMMODATION CONTACT</span>
                <span class="section-fact-value">Sudikksha Rhashmi S.</span>
              </div>
              <div class="section-fact-row">
                <span class="section-fact-label">FOOD CONTACT</span>
                <span class="section-fact-value">Devraj Kumar</span>
              </div>
            </div>
            <ul class="section-bullet-list">
              <li><span class="section-bullet-node"></span><span>Accommodation is available exclusively to registered delegates, allotted first-come, first-served.</span></li>
              <li><span class="section-bullet-node"></span><span>Specify your food preference during event or workshop registration.</span></li>
              <li><span class="section-bullet-node"></span><span>Lunch coupons are provided at the Registration Desk on event day.</span></li>
            </ul>
          </div>
        </div>
      </div>

      <button class="action-link-cyan profile-admin-link" id="btn-open-admin">
        <span>PAYMENT VERIFICATION CONSOLE</span>
        <span>→</span>
      </button>
    </div>
  `;
}

export function attachProfileEvents(): void {
  document.getElementById('btn-sign-out')?.addEventListener('click', () => {
    appStore.signOut();
    appStore.showToast('Signed out of STRIATUM 4.0');
  });

  document.getElementById('btn-activate-pass')?.addEventListener('click', () => {
    appStore.setDelegateModalOpen(true);
  });

  document.getElementById('btn-view-my-events-profile')?.addEventListener('click', () => {
    appStore.setScreen('my-events');
  });

  document.getElementById('btn-open-admin')?.addEventListener('click', () => {
    appStore.setScreen('admin');
  });

  document.querySelectorAll<HTMLButtonElement>('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      if (!item) return;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}
