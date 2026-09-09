import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { Order, OrderLine } from '../services/registrationService.ts';

/**
 * EVENT PAYMENT VIEW — "03 / PAYMENT" (new mockup-faithful design)
 *
 * Renders exactly what the real order (registrationService.getOrder) says a
 * delegate owes. This view never invents events, prices or a receipt — it is a
 * rewiring of the visual design onto the single pricing/registration authority.
 */

/** ⚠ UNVERIFIED — confirm the official UPI ID with the organisers before launch. Money goes here. */
const UPI_ID = 'striatum.igmcri@okhdfcbank';

/** No per-event artwork exists for checkout thumbnails — every line uses the same static art. */
const ITEM_THUMB_SRC = '/assets/card_reef.jpg';

function renderTopBar(): string {
  return `
    <header class="mockup-top-bar">
      <button class="top-bar-back-btn" id="btn-event-pay-back" aria-label="Go back" style="display: flex; align-items: center; gap: 6px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        <span style="font-family: var(--font-mono-meta); font-size: 10px; letter-spacing: 1.5px; font-weight: 600;">BACK</span>
      </button>

      <div class="top-bar-brand">
        <div class="top-bar-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
        <div class="top-bar-brand-meta">IGMCRI · SIGMA 2026</div>
      </div>
    </header>
  `;
}

function renderFooter(): string {
  return `
    <footer class="mockup-flow-footer">
      <div class="footer-left-col">
        <span class="f-title-main">STRIATUM 4.0</span>
        <span class="f-title-sub">MEDICAL SYMPOSIUM · 2026</span>
        <span class="f-line-dash"></span>
      </div>
    </footer>
  `;
}

function renderEmptyState(): string {
  return `
    <div class="screen-content mockup-flow-page">
      ${renderTopBar()}

      <div class="mockup-timeline-wrap">
        <div class="mockup-timeline-rail"></div>

        <div class="timeline-step-block">
          <div class="timeline-bead"></div>

          <div class="timeline-step-header">
            <span class="step-label-tag">03 <span style="opacity: 0.5;">/</span> PAYMENT</span>
          </div>

          <h1 class="hero-display-title">
            No order<br />
            to pay for<span class="cyan-dot">.</span>
          </h1>

          <p class="hero-display-sub">
            There is no pending order to pay for.
          </p>
        </div>

        <div class="timeline-step-block">
          <div class="timeline-bead"></div>
          <div class="empty-search-state">
            <p>Add events to your cart to continue.</p>
            <button class="action-link-cyan" id="btn-event-pay-to-cart" style="margin: 14px auto 0;">
              Back to Cart →
            </button>
          </div>
        </div>
      </div>

      ${renderFooter()}
    </div>
  `;
}

function renderSelectionRow(line: OrderLine): string {
  const dateRow =
    line.date
      ? `
        <div style="font-family: var(--font-mono-meta); font-size: 8.5px; letter-spacing: 1px; color: var(--text-dim); margin-top: 3px;">
          ${escapeHtml(line.date)}${line.startTime ? ` · ${escapeHtml(line.startTime)}` : ''}
        </div>
      `
      : '';

  return `
    <div class="selection-row-item">
      <div class="selection-left-info">
        <div class="selection-thumb-wrap">
          <img src="${ITEM_THUMB_SRC}" alt="${escapeHtml(line.eventName)}" />
        </div>
        <div class="selection-name-col">
          <span class="selection-event-title serif-font">${escapeHtml(line.eventName)}</span>
          <span class="selection-event-sub">${escapeHtml(line.context)}</span>
          ${dateRow}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <span class="selection-price-tag">${registration.formatINR(line.unitPrice)}</span>
        <span style="font-family: var(--font-mono-meta); font-size: 8px; color: var(--text-dim); margin-top: 2px;">${escapeHtml(line.priceBasis)}</span>
      </div>
    </div>
  `;
}

function renderRejectionNotice(order: Order): string {
  if (order.status !== 'rejected') return '';
  return `
    <div class="timeline-step-block">
      <div class="timeline-bead"></div>
      <div class="timeline-step-header">
        <span class="step-label-tag" style="color: #f87171;">! <span style="opacity: 0.5;">/</span> RE-UPLOAD REQUIRED</span>
      </div>
      <h1 class="hero-display-title" style="font-size: 24px;">Re-upload required<span class="cyan-dot">.</span></h1>
      <p class="hero-display-sub" style="color: #f87171;">${escapeHtml(order.rejectionReason ?? '')}</p>
    </div>
  `;
}

function renderPaymentAndUploadSteps(order: Order, hasProof: boolean, screenshotUrl: string | null, screenshotName: string | null): string {
  return `
    <!-- 02 / PAYMENT Split Card -->
    <div class="timeline-step-block">
      <div class="timeline-bead"></div>

      <div class="timeline-step-header">
        <span class="step-label-tag">02 <span style="opacity: 0.5;">/</span> PAYMENT</span>
        <span style="font-family: var(--font-mono-meta); font-size: 8px; letter-spacing: 1.5px; color: var(--text-dim);">TOTAL AMOUNT</span>
      </div>

      <div class="event-qr-card-split">
        <!-- Bracketed QR -->
        <div class="event-qr-bracketed-col">
          <div class="bracket-qr-box">
            <span class="b-corner tl"></span>
            <span class="b-corner br"></span>
            <img src="/art_event_qr.png" alt="Event QR Code" />
          </div>
          <div style="font-family: var(--font-sans-ui); font-size: 9.5px; color: var(--text-muted); margin-top: 8px; text-align: center;">
            Scan using any UPI app
          </div>
        </div>

        <!-- Meta and Price -->
        <div class="event-qr-side-col">
          <div>
            <div style="font-family: var(--font-sans-ui); font-size: 10px; color: var(--text-dim);">Pay to</div>
            <div class="event-pay-to">STRIATUM 4.0</div>

            <div class="event-upi-row">
              <span>${UPI_ID}</span>
              <button class="copy-icon-btn" id="btn-copy-event-upi" title="Copy UPI ID">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
              <span style="font-family: var(--font-sans-ui); font-size: 9px; color: #ea4335; font-weight: 700;">GPay</span>
              <span style="color: rgba(42, 241, 250, 0.2);">|</span>
              <span style="font-family: var(--font-sans-ui); font-size: 9px; color: #5f259f; font-weight: 700;">PhonePe</span>
              <span style="color: rgba(42, 241, 250, 0.2);">|</span>
              <span style="font-family: var(--font-sans-ui); font-size: 9px; color: #00baf2; font-weight: 700;">Paytm</span>
            </div>
          </div>

          ${
            order.discountAmount > 0
              ? `
            <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 10px; font-family: var(--font-sans-ui); font-size: 10px; color: var(--text-dim);">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal</span>
                <span>${registration.formatINR(order.subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #4ade80;">
                <span>${escapeHtml(order.discountLabel ?? 'Discount')}</span>
                <span>-${registration.formatINR(order.discountAmount)}</span>
              </div>
            </div>
          `
              : ''
          }

          <div class="event-exact-price-row">
            <span style="font-family: var(--font-sans-ui); font-size: 11px; color: var(--text-muted);">Pay exactly</span>
            <span class="event-exact-val">${registration.formatINR(order.total)}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 03 / UPLOAD PAYMENT SCREENSHOT -->
    <div class="timeline-step-block">
      <div class="timeline-bead"></div>

      <div class="timeline-step-header">
        <span class="step-label-tag">03 <span style="opacity: 0.5;">/</span> UPLOAD PAYMENT SCREENSHOT</span>
      </div>

      <!-- Dropzone -->
      <div class="dropzone-upload-box" id="event-dropzone">
        <input type="file" id="event-file-input" accept="image/jpeg,image/png" style="display: none;" />

        ${hasProof ? `
          <div style="display: flex; align-items: center; gap: 12px; text-align: left; width: 100%;">
            <img src="${screenshotUrl}" alt="Proof" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid var(--cyan-glow);" />
            <div style="flex: 1; overflow: hidden;">
              <div style="font-size: 12px; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(screenshotName ?? 'Event_Receipt.jpg')}</div>
              <div style="font-size: 9px; color: #4ade80; margin-top: 2px;">Receipt Uploaded ✓</div>
            </div>
            <button id="btn-remove-event-proof" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 14px; padding: 4px;">✕</button>
          </div>
        ` : `
          <div class="dropzone-cloud-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
              <path d="M12 12v9"/>
              <path d="m16 16-4-4-4 4"/>
            </svg>
          </div>
          <div class="dropzone-main-text">Tap to upload payment screenshot</div>
          <div class="dropzone-hint-text">JPG, PNG (Max 5MB)</div>
        `}
      </div>

      <!-- Guidelines Checklist Card -->
      <div class="verification-guidelines-box">
        <div class="guide-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" x2="8" y1="13" y2="13"/>
            <line x1="16" x2="8" y1="17" y2="17"/>
            <line x1="10" x2="8" y1="9" y2="9"/>
          </svg>
          <span>Make sure the amount and transaction details are clearly visible.</span>
        </div>

        <div class="guide-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Your screenshot is stored securely and only visible to the organisers.</span>
        </div>

        <div class="guide-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>You'll receive your registrations instantly after submission.</span>
        </div>
      </div>

    </div>

    <!-- Action Button connected to Timeline Bead -->
    <div class="timeline-step-block button-step-block">
      <div class="timeline-bead" style="top: 20px;"></div>

      <button class="beveled-cyan-btn" id="btn-submit-event-payment">
        <span>${order.status === 'rejected' ? 'UPLOAD A NEW SCREENSHOT' : 'Submit &amp; Get My Registrations'}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </button>
    </div>
  `;
}

function renderStatusSection(order: Order): string {
  if (order.status === 'under_review' || order.status === 'payment_submitted') {
    const proofImage = registration.readProofImage(order.id);
    return `
      <div class="timeline-step-block">
        <div class="timeline-bead"></div>

        <div class="timeline-step-header">
          <span class="step-label-tag">02 <span style="opacity: 0.5;">/</span> STATUS</span>
        </div>

        <h1 class="hero-display-title" style="font-size: 26px;">Payment submitted<span class="cyan-dot">.</span></h1>
        <p class="hero-display-sub">
          Your payment proof is being verified.<br />
          Your registrations will be confirmed after approval.
        </p>

        ${
          order.proof
            ? `
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 16px; background: rgba(1, 10, 18, 0.7); border: 1px solid rgba(42, 241, 250, 0.2); border-radius: 10px; padding: 10px 14px;">
            ${proofImage ? `<img src="${proofImage}" alt="Submitted screenshot" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid var(--cyan-glow);" />` : ''}
            <div style="flex: 1; overflow: hidden;">
              <div style="font-size: 12px; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(order.proof.fileName)}</div>
            </div>
          </div>
        `
            : ''
        }

        <button class="action-link-cyan" id="btn-event-view-my-events" style="margin-top: 18px;">VIEW MY EVENTS →</button>
      </div>
    `;
  }

  if (order.status === 'approved') {
    return `
      <div class="timeline-step-block">
        <div class="timeline-bead"></div>

        <div class="timeline-step-header">
          <span class="step-label-tag">02 <span style="opacity: 0.5;">/</span> STATUS</span>
        </div>

        <h1 class="hero-display-title" style="font-size: 26px;">Payment verified<span class="cyan-dot">.</span></h1>
        <p class="hero-display-sub">Your registrations are confirmed.</p>

        <button class="action-link-cyan" id="btn-event-view-my-events" style="margin-top: 18px;">VIEW MY EVENTS →</button>
      </div>
    `;
  }

  return '';
}

export function renderEventPaymentView(): string {
  const state = appStore.getState();
  const payment = state.eventPayment;
  const orderId = payment.orderId || state.selectedOrderId;
  const order = orderId ? registration.getOrder(orderId) : undefined;

  if (!order) {
    return renderEmptyState();
  }

  const hasProof = !!payment.screenshotUrl;
  const showPaymentFlow = order.status === 'awaiting_payment' || order.status === 'rejected';

  return `
    <div class="screen-content mockup-flow-page">

      ${renderTopBar()}

      <!-- Main Timeline Flow Wrap -->
      <div class="mockup-timeline-wrap">
        <div class="mockup-timeline-rail"></div>

        <!-- 03 / PAYMENT Hero Header -->
        <div class="timeline-step-block">
          <div class="timeline-bead"></div>

          <div class="timeline-step-header">
            <span class="step-label-tag">03 <span style="opacity: 0.5;">/</span> PAYMENT</span>
          </div>

          <h1 class="hero-display-title">
            Complete<br />
            your registration<span class="cyan-dot">.</span>
          </h1>

          <p class="hero-display-sub">
            Review, pay and upload to confirm your slots.
          </p>
        </div>

        <!-- 01 / YOUR SELECTION -->
        <div class="timeline-step-block">
          <div class="timeline-bead"></div>

          <div class="timeline-step-header">
            <span class="step-label-tag">01 <span style="opacity: 0.5;">/</span> YOUR SELECTION</span>

            <div style="display: flex; align-items: center; gap: 8px; font-family: var(--font-mono-meta); font-size: 8.5px; letter-spacing: 1.5px; color: var(--text-dim);">
              <span>${order.lines.length} EVENT${order.lines.length === 1 ? '' : 'S'}</span>
              <span>|</span>
              <span>${escapeHtml(order.reference)}</span>
              <span>|</span>
              <button id="btn-edit-selection" style="background: none; border: none; color: var(--cyan-glow); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 0; font-family: inherit; font-size: inherit; letter-spacing: inherit;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
                <span>EDIT</span>
              </button>
            </div>
          </div>

          <!-- Selection List Container -->
          <div class="selection-summary-container">
            ${order.lines.map(renderSelectionRow).join('')}
          </div>

        </div>

        ${renderRejectionNotice(order)}
        ${showPaymentFlow ? renderPaymentAndUploadSteps(order, hasProof, payment.screenshotUrl, payment.screenshotName) : ''}
        ${!showPaymentFlow ? renderStatusSection(order) : ''}

      </div>

      ${renderFooter()}

    </div>
  `;
}

export function attachEventPaymentEvents(): void {
  const state = appStore.getState();
  const payment = state.eventPayment;
  const orderId = payment.orderId || state.selectedOrderId;
  const order = orderId ? registration.getOrder(orderId) : undefined;

  const btnBack = document.getElementById('btn-event-pay-back');
  const btnToCart = document.getElementById('btn-event-pay-to-cart');
  const btnEdit = document.getElementById('btn-edit-selection');
  const btnSubmit = document.getElementById('btn-submit-event-payment') as HTMLButtonElement | null;
  const dropzone = document.getElementById('event-dropzone');
  const fileInput = document.getElementById('event-file-input') as HTMLInputElement | null;
  const btnCopyUpi = document.getElementById('btn-copy-event-upi');
  const btnRemoveProof = document.getElementById('btn-remove-event-proof');

  const isFinalized = !!order && (order.status === 'under_review' || order.status === 'payment_submitted' || order.status === 'approved');

  btnBack?.addEventListener('click', () => {
    appStore.setScreen(isFinalized ? 'my-events' : 'cart');
  });

  btnToCart?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  btnEdit?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.querySelectorAll<HTMLElement>('#btn-event-view-my-events').forEach(btn => {
    btn.addEventListener('click', () => {
      appStore.setScreen('my-events');
    });
  });

  btnCopyUpi?.addEventListener('click', () => {
    navigator.clipboard?.writeText(UPI_ID);
    appStore.showToast('UPI ID copied to clipboard!');
  });

  dropzone?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#btn-remove-event-proof')) return;
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    void handleFileChange(fileInput);
  });

  btnRemoveProof?.addEventListener('click', (e) => {
    e.stopPropagation();
    appStore.setEventScreenshot(null, null);
  });

  if (!order) return;

  btnSubmit?.addEventListener('click', async () => {
    if (btnSubmit.disabled) return;

    const staged = appStore.getState().eventPayment;
    if (!staged.screenshotUrl) {
      appStore.showToast('Upload your payment screenshot before submitting.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.classList.add('is-submitting');

    const res = await registration.submitPaymentProof(order.id, {
      fileName: staged.screenshotName ?? 'payment.jpg',
      mimeType: staged.screenshotUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
      size: staged.screenshotUrl.length,
      dataUrl: staged.screenshotUrl
    });

    appStore.showToast(res.message);
    if (res.ok) {
      appStore.setScreen('my-events');
    } else {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('is-submitting');
    }
  });
}

async function handleFileChange(fileInput: HTMLInputElement): Promise<void> {
  const file = fileInput.files?.[0];
  if (!file) return;

  const result = await registration.prepareProof(file);
  if (!result.ok || !result.dataUrl) {
    appStore.showToast(result.message ?? 'That file could not be used.');
    fileInput.value = '';
    return;
  }

  appStore.setEventScreenshot(result.dataUrl, file.name);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
