import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';

function topBar(): string {
  return `
    <header class="mockup-top-bar">
      <button class="top-bar-back-btn" id="btn-delegate-confirm-back" aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <div class="top-bar-brand">
        <div class="top-bar-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
        <div class="top-bar-brand-meta">IGMCRI · SIGMA 2026</div>
      </div>
    </header>
  `;
}

function footer(): string {
  return `
    <footer class="mockup-flow-footer" style="margin-bottom: 20px;">
      <div class="footer-left-col">
        <span class="f-title-main">STRIATUM 4.0</span>
        <span class="f-title-sub">MEDICAL SYMPOSIUM · 2026</span>
        <span class="f-line-dash"></span>
      </div>
    </footer>
  `;
}

function renderNoneState(): string {
  return `
    <div class="screen-content mockup-flow-page">
      ${topBar()}

      <div style="margin-bottom: 20px;">
        <div style="font-family: var(--font-mono-meta); font-size: 8.5px; letter-spacing: 2px; color: var(--cyan-glow); margin-bottom: 6px;">
          DELEGATE REGISTRATION
        </div>

        <h1 class="hero-display-title">
          No application<br />
          on file<span class="cyan-dot">.</span>
        </h1>

        <p class="hero-display-sub">
          You haven't submitted a Delegate application yet. Register as a delegate to get a
          verified Delegate ID.
        </p>
      </div>

      <div class="verification-guidelines-box" style="margin-bottom: 16px;">
        <div class="guide-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span>Start your Delegate application to get access to events that require an approved Delegate ID.</span>
        </div>
      </div>

      <button class="confirm-wide-btn" id="btn-start-delegate-application">
        <span>Start Delegate Registration</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: auto;">
          <path d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </button>

      ${footer()}
    </div>
  `;
}

function renderRejectedState(delegate: registration.DelegateApplication): string {
  return `
    <div class="screen-content mockup-flow-page">
      ${topBar()}

      <div style="margin-bottom: 20px;">
        <div style="font-family: var(--font-mono-meta); font-size: 8.5px; letter-spacing: 2px; color: var(--cyan-glow); margin-bottom: 6px;">
          DELEGATE REGISTRATION
        </div>

        <h1 class="hero-display-title">
          Application<br />
          needs attention<span class="cyan-dot">.</span>
        </h1>

        <p class="hero-display-sub">
          Your Delegate application could not be verified.
        </p>
      </div>

      <div class="verification-guidelines-box" style="margin-bottom: 16px;">
        <div class="guide-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span>${escapeHtml(delegate.rejectionReason ?? 'No reason provided.')}</span>
        </div>
      </div>

      <button class="confirm-wide-btn" id="btn-reapply-delegate">
        <span>Submit a New Application</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: auto;">
          <path d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </button>

      ${footer()}
    </div>
  `;
}

function renderStatusCardState(delegate: registration.DelegateApplication, status: registration.DelegateStatus): string {
  const isApproved = status === 'approved';
  const form = appStore.getState().delegateForm;
  const tierName = form.tier;
  const course = form.course;
  const attendeeName = delegate.fullName;
  const college = delegate.institution;
  const year = delegate.yearOfStudy || '—';

  const headline = isApproved
    ? `Your<br />Delegate Pass<br />is Active<span class="cyan-dot">.</span>`
    : `Your<br />Delegate Pass<br />is Pending<span class="cyan-dot">.</span>`;

  const subCopy = isApproved
    ? `<strong>Welcome to STRIATUM 4.0</strong><br />Your official symposium delegate pass has been issued.`
    : `<strong>Application received</strong><br />Your Delegate Pass activates once an organiser approves your application.`;

  const issuedOn = delegate.reviewedAt
    ? new Date(delegate.reviewedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(delegate.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const noticeText = isApproved
    ? 'Your delegate pass has been issued and can be used to register for events and workshops.'
    : "Your application is being verified by the organising team. The pass activates automatically once an organiser approves it — you'll be notified by email and on the app.";

  return `
    <div class="screen-content mockup-flow-page">
      ${topBar()}

      <div style="margin-bottom: 20px;">
        <div style="font-family: var(--font-mono-meta); font-size: 8.5px; letter-spacing: 2px; color: var(--cyan-glow); margin-bottom: 6px;">
          DELEGATE REGISTRATION
        </div>

        <div>
          <h1 class="hero-display-title">
            ${headline}
          </h1>
        </div>

        <p class="hero-display-sub">
          ${subCopy}
        </p>
      </div>

      <!-- Holographic Pass Card -->
      <div class="holographic-pass-container">

        <!-- Background Jellyfish Watermark -->
        <div class="holo-card-watermark-jelly">
          <img src="/art_pass_jelly.png" alt="Bioluminescent Jellyfish" />
        </div>

        <!-- Card Top Bar -->
        <div class="holo-card-top-row">
          <div>
            <div class="holo-card-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
            <div class="holo-card-brand-sub">MEDICAL SYMPOSIUM · IGMCRI · SIGMA 2026</div>
          </div>

          <div>
            <div class="holo-card-type-title serif-font">DELEGATE PASS</div>
          </div>
        </div>

        <!-- Pass Main Split Body -->
        <div class="holo-pass-split-body">

          <!-- S4 QR Code Box -->
          <div class="holo-qr-wrap-col">
            <div class="holo-qr-white-frame" style="${isApproved ? '' : 'opacity: 0.35; filter: grayscale(1);'}">
              <img src="/art_confirm_s4_qr.png" alt="Pass QR Code" />
            </div>
            <div class="holo-qr-sub-label">${isApproved ? 'SCAN AT VENUE &amp; EVENTS' : 'ACTIVATES ON APPROVAL'}</div>
          </div>

          <!-- Attendee Information Fields -->
          <div class="holo-attendee-details-col">

            <div class="holo-field-grp">
              <span class="holo-field-lbl">NAME</span>
              <span class="holo-field-val">${escapeHtml(attendeeName)}</span>
            </div>

            <div class="holo-field-grp">
              <span class="holo-field-lbl">INSTITUTION</span>
              <span class="holo-field-val">${escapeHtml(college)}</span>
            </div>

            <div class="holo-field-grp">
              <span class="holo-field-lbl">COURSE / YEAR</span>
              <span class="holo-field-val">${escapeHtml(course || '—')} · ${escapeHtml(year)}</span>
            </div>

            <div class="holo-field-grp">
              <span class="holo-field-lbl">DELEGATE TIER</span>
              <span class="holo-field-val cyan-glow-text">${escapeHtml(tierName)}</span>
            </div>

            <div class="holo-field-grp">
              <span class="holo-field-lbl">DELEGATE ID</span>
              <div class="holo-id-display-row">
                ${isApproved
                  ? `
                    <span class="holo-id-bold">${escapeHtml(delegate.delegateId ?? '')}</span>
                    <button class="copy-icon-btn" id="btn-copy-pass-id" title="Copy Pass ID">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    </button>
                  `
                  : `<span class="holo-id-bold" style="letter-spacing: 1px; opacity: 0.7;">AWAITING VERIFICATION</span>`}
              </div>
            </div>

          </div>

        </div>

        <!-- Card Bottom Tri-Column Meta -->
        <div class="holo-card-bottom-tri-row">

          <div class="holo-tri-col">
            <div class="tri-lbl-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              <span>${isApproved ? 'ISSUED ON' : 'SUBMITTED ON'}</span>
            </div>
            <div class="tri-val-bold">${issuedOn}</div>
          </div>

          <div class="holo-tri-col">
            <div class="tri-lbl-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span>STATUS</span>
            </div>
            <div class="tri-val-bold" style="color: ${isApproved ? '#4ade80' : '#facc15'};">${isApproved ? 'Verified' : 'Verification Pending'}</div>
          </div>

          <div class="holo-tri-col">
            <div class="tri-lbl-row">
              <span style="width: 5px; height: 5px; border-radius: 50%; background: var(--cyan-glow);"></span>
              <span>VALID FOR</span>
            </div>
            <div class="tri-val-bold">All Workshops</div>
            <div class="tri-sub-hint">(As per guidelines)</div>
          </div>

        </div>

      </div>

      <!-- Notice Banner Box -->
      <div class="verification-guidelines-box" style="margin-bottom: 16px;">
        <div class="guide-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span>${noticeText}</span>
        </div>
      </div>

      <!-- Action Buttons Grid -->
      <div class="confirm-buttons-split-row">

        <button class="confirm-box-btn" id="btn-confirm-explore">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
            </svg>
            <span>Explore Events</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14m-7-7 7 7-7 7"/>
          </svg>
        </button>

        <button class="confirm-box-btn" id="btn-confirm-workshops">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div style="text-align: left; line-height: 1.2;">
              <div style="font-size: 10px; color: var(--text-dim);">Register for</div>
              <span>Workshops</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14m-7-7 7 7-7 7"/>
          </svg>
        </button>

      </div>

      <!-- Download Pass Button -->
      <button class="confirm-wide-btn" id="btn-download-pass" ${isApproved ? '' : 'disabled style="opacity:0.5; cursor: not-allowed;"'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" x2="12" y1="15" y2="3"/>
        </svg>
        <span>${isApproved ? 'Download Pass' : 'Pass available after approval'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: auto;">
          <path d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </button>

      ${footer()}
    </div>
  `;
}

export function renderDelegateConfirmView(): string {
  const status = registration.getDelegateStatus();
  const delegate = registration.getDelegate();

  if (!delegate || status === 'none') {
    return renderNoneState();
  }
  if (status === 'rejected') {
    return renderRejectedState(delegate);
  }
  // pending or approved share the pass-card layout, distinguished within it.
  return renderStatusCardState(delegate, status);
}

export function attachDelegateConfirmEvents(): void {
  const btnBack = document.getElementById('btn-delegate-confirm-back');
  const btnExplore = document.getElementById('btn-confirm-explore');
  const btnWorkshops = document.getElementById('btn-confirm-workshops');
  const btnDownload = document.getElementById('btn-download-pass') as HTMLButtonElement | null;
  const btnCopyId = document.getElementById('btn-copy-pass-id');
  const btnStartApplication = document.getElementById('btn-start-delegate-application');
  const btnReapply = document.getElementById('btn-reapply-delegate');

  btnBack?.addEventListener('click', () => {
    appStore.setScreen('home');
  });

  btnExplore?.addEventListener('click', () => {
    appStore.setScreen('explore');
  });

  btnWorkshops?.addEventListener('click', () => {
    appStore.setActiveCategory('WORKSHOPS');
    appStore.setScreen('explore');
  });

  btnStartApplication?.addEventListener('click', () => {
    appStore.setScreen('delegate-registration');
  });

  btnReapply?.addEventListener('click', () => {
    appStore.setScreen('delegate-registration');
  });

  btnDownload?.addEventListener('click', () => {
    if (btnDownload.disabled) return;
    appStore.showToast('Generating official Delegate Pass PDF...');
    window.setTimeout(() => {
      appStore.showToast('Delegate pass downloaded successfully!');
    }, 900);
  });

  btnCopyId?.addEventListener('click', () => {
    const delegate = registration.getDelegate();
    if (!delegate?.delegateId) return;
    navigator.clipboard?.writeText(delegate.delegateId);
    appStore.showToast('Delegate ID ' + delegate.delegateId + ' copied!');
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
