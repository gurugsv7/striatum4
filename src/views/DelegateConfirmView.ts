import QRCode from 'qrcode';
import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';

/**
 * Generates an authentic unique QR Code SVG for the delegate pass,
 * encoding the verification URL with the delegate's ID and tier.
 */
function generateDelegateQrSvg(delegateId: string, attendeeName: string, tier: string): string {
  try {
    const payload = `https://www.igmcrisigma.com/verify?type=delegate&id=${encodeURIComponent(delegateId)}&tier=${encodeURIComponent(tier)}`;
    const qr = QRCode.create(payload, { errorCorrectionLevel: 'H' });
    const count = qr.modules.size;
    let rects = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.modules.get(r, c)) {
          rects += `<rect x="${c}" y="${r}" width="1.02" height="1.02" fill="#020c18"/>`;
        }
      }
    }
    return `
      <svg viewBox="0 0 ${count} ${count}" width="100%" height="100%" shape-rendering="crispEdges" style="display: block; width: 100%; height: 100%; border-radius: 4px;">
        <rect width="${count}" height="${count}" fill="#ffffff"/>
        ${rects}
      </svg>
    `;
  } catch {
    return `<img src="/art_confirm_s4_qr.png" alt="Pass QR Code" style="width: 100%; height: 100%; object-fit: contain;" />`;
  }
}

/**
 * Renders the delegate pass to a PNG and saves it.
 *
 * Drawn directly on a canvas rather than screenshotting the DOM: it needs no
 * dependency, and it guarantees the saved file contains exactly the approved
 * credential values rather than whatever happened to be on screen.
 */
async function downloadDelegatePass(): Promise<boolean> {
  const delegate = registration.getDelegate();
  const active = delegate?.status === 'approved' || delegate?.status === 'pending';
  const delegateCode = delegate?.delegateId || 'S4-01842';
  const attendeeName = delegate?.fullName || 'Guru Sabarivasan M';
  const college = delegate?.institution || 'IIT Jodhpur';
  const form = appStore.getState().delegateForm;
  const tier = form.tier || 'AQUALUME';

  const W = 1000;
  const H = 620;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Wait for the webfonts so the file matches the on-screen card.
  try {
    await document.fonts?.ready;
  } catch {
    /* fall back to system fonts */
  }

  const CYAN = '#2af1fa';
  const serif = '"Playfair Display", Georgia, serif';
  const mono = '"JetBrains Mono", ui-monospace, monospace';

  // Deep-ocean ground with a bioluminescent bloom, matching the app palette.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#010409');
  bg.addColorStop(0.55, '#041224');
  bg.addColorStop(1, '#010409');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const bloom = ctx.createRadialGradient(W * 0.82, H * 0.5, 0, W * 0.82, H * 0.5, W * 0.5);
  bloom.addColorStop(0, 'rgba(42, 241, 250, 0.16)');
  bloom.addColorStop(1, 'rgba(42, 241, 250, 0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(42, 241, 250, 0.30)';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Corner brackets — the recurring motif across the interface.
  const bracket = 46;
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 3;
  const corners: [number, number, number, number][] = [
    [28, 28, 1, 1],
    [W - 28, 28, -1, 1],
    [28, H - 28, 1, -1],
    [W - 28, H - 28, -1, -1]
  ];
  corners.forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x + dx * bracket, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * bracket);
    ctx.stroke();
  });

  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 30px ${mono}`;
  ctx.fillText('STRIATUM', 72, 108);
  ctx.fillStyle = CYAN;
  ctx.fillText(' 4.0', 72 + ctx.measureText('STRIATUM').width, 108);

  ctx.fillStyle = '#8ca3b8';
  ctx.font = `13px ${mono}`;
  ctx.fillText('INDIRA GANDHI MEDICAL COLLEGE & RESEARCH INSTITUTE', 72, 136);
  ctx.fillText('SIGMA 2026  ·  PUDUCHERRY', 72, 158);

  ctx.strokeStyle = 'rgba(42, 241, 250, 0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 186);
  ctx.lineTo(W - 72, 186);
  ctx.stroke();

  ctx.fillStyle = '#546e84';
  ctx.font = `12px ${mono}`;
  ctx.fillText('D E L E G A T E', 72, 224);

  ctx.fillStyle = '#ffffff';
  ctx.font = `500 44px ${serif}`;
  ctx.fillText(attendeeName, 72, 276);

  ctx.fillStyle = '#e1ebf4';
  ctx.font = `17px ${mono}`;
  ctx.fillText(college, 72, 310);

  const fields: [string, string][] = [
    ['DELEGATE ID', delegateCode],
    ['PASS TIER', tier],
    ['VALID', '15–18 OCT 2026']
  ];
  let fx = 72;
  fields.forEach(([label, value]) => {
    ctx.fillStyle = '#546e84';
    ctx.font = `11px ${mono}`;
    ctx.fillText(label, fx, 390);
    ctx.fillStyle = CYAN;
    ctx.font = `700 22px ${mono}`;
    ctx.fillText(value, fx, 424);
    fx += Math.max(ctx.measureText(value).width, 170) + 40;
  });

  // Draw authentic QR Code on the right side of downloaded pass
  try {
    const qrPayload = `https://www.igmcrisigma.com/verify?type=delegate&id=${encodeURIComponent(delegateCode)}&tier=${encodeURIComponent(tier)}`;
    const qr = QRCode.create(qrPayload, { errorCorrectionLevel: 'M' });
    const qrModCount = qr.modules.size;
    const qrBoxX = W - 240;
    const qrBoxY = 210;
    const qrPixelSize = 160;
    const modSize = qrPixelSize / qrModCount;

    // White backing
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrBoxX - 8, qrBoxY - 8, qrPixelSize + 16, qrPixelSize + 16);

    // QR modules
    ctx.fillStyle = '#020c18';
    for (let r = 0; r < qrModCount; r++) {
      for (let c = 0; c < qrModCount; c++) {
        if (qr.modules.get(r, c)) {
          ctx.fillRect(qrBoxX + c * modSize, qrBoxY + r * modSize, modSize + 0.1, modSize + 0.1);
        }
      }
    }

    // Center S4 badge on canvas QR
    const badgeSize = 36;
    const bx = qrBoxX + (qrPixelSize - badgeSize) / 2;
    const by = qrBoxY + (qrPixelSize - badgeSize) / 2;
    ctx.fillStyle = '#020c18';
    ctx.fillRect(bx, by, badgeSize, badgeSize);
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, badgeSize, badgeSize);
    ctx.fillStyle = CYAN;
    ctx.font = `700 15px ${mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S4', bx + badgeSize / 2, by + badgeSize / 2);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  } catch {
    /* QR code draw fallback */
  }

  ctx.fillStyle = '#546e84';
  ctx.font = `12px ${mono}`;
  ctx.fillText('Present this pass at the registration desk.', 72, H - 78);
  ctx.fillStyle = 'rgba(42, 241, 250, 0.75)';
  ctx.font = `italic 18px ${serif}`;
  ctx.fillText('A Familiar Journey, A Deeper Dive.', 72, H - 48);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'STRIATUM-4.0-Delegate-Pass-' + delegateCode + '.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

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
  const isActive = status === 'approved' || status === 'pending';
  const form = appStore.getState().delegateForm;
  const tierName = form.tier || 'AQUALUME';
  const course = form.course || 'B.Tech AI & Data Science';
  const attendeeName = delegate.fullName || form.fullName || 'Guru Sabarivasan M';
  const college = delegate.institution || form.college || 'IIT Jodhpur';
  const year = delegate.yearOfStudy || form.yearOfStudy || '3rd Year';
  const delegateCode = delegate.delegateId || 'S4-01842';

  const headline = isApproved
    ? `Your<br />Delegate Pass<br />is Ready<span class="cyan-dot">.</span>`
    : `Your<br />Delegate Pass<br />is Pending<span class="cyan-dot">.</span>`;

  const subCopy = isApproved
    ? `<strong>Welcome to STRIATUM 4.0</strong><br />Your journey into a deeper tomorrow begins here.`
    : `<strong>Application received</strong><br />Your Delegate Pass activates once an organiser approves your application.`;

  const issuedOn = delegate.reviewedAt
    ? new Date(delegate.reviewedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(delegate.submittedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const noticeText = isApproved
    ? 'Your delegate pass has been verified and issued. Present this pass at the venue desk for event entry.'
    : "Your delegate pass has been issued and can be used to register for events and workshops. Your payment is currently under verification. You'll be notified once it's confirmed.";

  // Generate unique scannable QR Code SVG for this attendee
  const qrSvg = generateDelegateQrSvg(delegateCode, attendeeName, tierName);

  return `
    <div class="screen-content mockup-flow-page">
      ${topBar()}

      <div style="margin-bottom: 10px;">
        <div style="font-family: var(--font-mono-meta); font-size: 8.5px; letter-spacing: 2px; color: var(--cyan-glow); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 8px;">✦</span> DELEGATE REGISTRATION
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

      <!-- Holographic Pass Card matching Mockup exactly -->
      <div class="holographic-pass-container">

        <!-- Background Floating Jellyfish Watermark -->
        <div class="holo-card-watermark-jelly">
          <img src="/art_pass_jelly.png" alt="Bioluminescent Jellyfish" />
        </div>

        <!-- Card Top Bar -->
        <div class="holo-card-top-row">
          <div>
            <div class="holo-card-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
            <div class="holo-card-brand-sub">MEDICAL SYMPOSIUM · IGMCRI · SIGMA 2026</div>
          </div>

          <div style="text-align: right;">
            <div class="holo-card-type-title serif-font">DELEGATE PASS</div>
            <div class="holo-card-type-sub">A DEEPER TOMORROW</div>
          </div>
        </div>

        <!-- Pass Main Split Body -->
        <div class="holo-pass-split-body">

          <!-- Left: Unique QR Code Box with Central S4 Badge -->
          <div class="holo-qr-wrap-col">
            <div class="holo-qr-white-frame">
              ${qrSvg}
              <div class="holo-qr-center-badge">
                <span>S4</span>
              </div>
            </div>
            <div class="holo-qr-sub-label">SCAN AT VENUE &amp; EVENTS</div>
          </div>

          <!-- Right: Attendee Information Fields -->
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
              <span class="holo-field-val">${escapeHtml(course)} · ${escapeHtml(year)}</span>
            </div>

            <div class="holo-field-grp">
              <span class="holo-field-lbl">DELEGATE TIER</span>
              <span class="holo-field-val cyan-glow-text">${escapeHtml(tierName)}</span>
            </div>

            <div class="holo-field-grp">
              <span class="holo-field-lbl">DELEGATE ID</span>
              <div class="holo-id-display-row">
                <span class="holo-id-bold">${escapeHtml(delegateCode)}</span>
                <button class="copy-icon-btn" id="btn-copy-pass-id" title="Copy Pass ID">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
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
              <span>ISSUED ON</span>
            </div>
            <div class="tri-val-bold">${issuedOn}</div>
          </div>

          <div class="holo-tri-col">
            <div class="tri-lbl-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span>PAYMENT STATUS</span>
            </div>
            <div class="tri-val-bold" style="color: ${isApproved ? '#4ade80' : '#2af1fa'};">
              ${isApproved ? 'Verified ✓' : 'Verification Pending'}
            </div>
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

      <!-- Notice Banner Box matching Mockup -->
      <div class="verification-guidelines-box" style="margin-bottom: 14px;">
        <div class="guide-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span>${noticeText}</span>
        </div>
      </div>

      <!-- Action Buttons Grid matching Mockup -->
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
              <rect width="18" height="14" x="3" y="5" rx="2" ry="2"/>
              <path d="M7 15h10"/>
              <circle cx="8" cy="9.5" r="1.5"/>
              <circle cx="16" cy="9.5" r="1.5"/>
            </svg>
            <div style="text-align: left; line-height: 1.2;">
              <div style="font-size: 9.5px; color: var(--text-dim);">Register for</div>
              <span>Workshops</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14m-7-7 7 7-7 7"/>
          </svg>
        </button>

      </div>

      <!-- Download Pass Button matching Mockup -->
      <button class="confirm-wide-btn" id="btn-download-pass">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" x2="12" y1="15" y2="3"/>
        </svg>
        <span>Download Pass</span>
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
  if (status === 'rejected' || status === 'revoked') {
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

  btnDownload?.addEventListener('click', async () => {
    if (btnDownload.disabled) return;
    btnDownload.disabled = true;
    appStore.showToast('Preparing your Delegate Pass…');
    try {
      const saved = await downloadDelegatePass();
      // Only claim success when a file was actually produced.
      appStore.showToast(
        saved ? 'Delegate Pass saved to your downloads' : 'Your pass could not be generated. Please try again.'
      );
    } catch {
      appStore.showToast('Your pass could not be generated. Please try again.');
    } finally {
      btnDownload.disabled = false;
    }
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
