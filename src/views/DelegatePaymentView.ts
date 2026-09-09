import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';

/** ⚠ UNVERIFIED — confirm the official UPI ID with the organisers before launch. Money goes here. */
const UPI_ID = 'striatum4.igmcri@upi';

export function renderDelegatePaymentView(): string {
  const state = appStore.getState();
  const form = state.delegateForm;
  const payment = state.delegatePayment;
  const tier = form.tier;
  const amount = payment.amount;
  const orderId = payment.orderId;
  const hasProof = !!payment.screenshotUrl;

  return `
    <div class="screen-content mockup-flow-page">

      <!-- Top Bar: Back Chevron, Brand -->
      <header class="mockup-top-bar">
        <button class="top-bar-back-btn" id="btn-delegate-pay-back" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div class="top-bar-brand">
          <div class="top-bar-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="top-bar-brand-meta">IGMCRI · SIGMA 2026</div>
        </div>
      </header>

      <!-- Main Timeline Flow Wrap -->
      <div class="mockup-timeline-wrap">
        <div class="mockup-timeline-rail"></div>

        <!-- 02 / PAYMENT Hero Header -->
        <div class="timeline-step-block">
          <div class="timeline-bead"></div>

          <div class="timeline-step-header">
            <span class="step-label-tag">02 <span style="opacity: 0.5;">/</span> PAYMENT</span>
          </div>

          <h1 class="hero-display-title">
            Complete<br />
            your registration<span class="cyan-dot">.</span>
          </h1>

          <p class="hero-display-sub">
            Scan, pay and upload to confirm your delegate pass.
          </p>
        </div>

        <!-- Payment Card with QR Code and Artwork -->
        <div class="timeline-step-block">

          <div class="payment-main-card">
            <!-- Background Artwork -->
            <div class="pay-card-watermark">
              <img src="/art_pay_jelly.png" alt="Glowing Jellyfish" />
            </div>

            <!-- QR Code Section -->
            <div class="pay-qr-center-col">
              <div class="pay-qr-frame-box">
                <img src="/art_delegate_qr.png" alt="UPI QR Code" />
              </div>
              <div class="pay-qr-caption">Scan using any UPI app · ${escapeHtml(UPI_ID)}</div>

              <div class="pay-apps-pills-row">
                <span class="pay-app-item">
                  <span style="color: #ea4335;">G</span>Pay
                </span>
                <span style="color: rgba(42, 241, 250, 0.3);">|</span>
                <span class="pay-app-item">
                  <span style="color: #5f259f;">पे</span> PhonePe
                </span>
                <span style="color: rgba(42, 241, 250, 0.3);">|</span>
                <span class="pay-app-item">
                  <span style="color: #00baf2;">paytm</span> Paytm
                </span>
              </div>
            </div>

            <!-- Bottom Split Row -->
            <div class="pay-card-bottom-split">
              <div class="pay-amount-col">
                <span class="pay-lbl-tag">AMOUNT TO PAY</span>
                <span class="pay-huge-price">${registration.formatINR(amount)}</span>
              </div>

              <div class="pay-order-meta-col">
                <span class="pay-tier-text">${escapeHtml(tier)}</span>
                <div class="pay-order-row">
                  ${orderId
                    ? `
                      <span>Order ID  ${escapeHtml(orderId)}</span>
                      <button class="copy-icon-btn" id="btn-copy-order-id" title="Copy Order ID">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                      </button>
                    `
                    : `<span>${escapeHtml(tier)} Delegate Pass</span>`}
                </div>
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
          <div class="dropzone-upload-box" id="delegate-dropzone">
            <input type="file" id="delegate-file-input" accept="image/*" style="display: none;" />

            ${hasProof ? `
              <div style="display: flex; align-items: center; gap: 12px; text-align: left; width: 100%;">
                <img src="${payment.screenshotUrl}" alt="Proof" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid var(--cyan-glow);" />
                <div style="flex: 1; overflow: hidden;">
                  <div style="font-size: 12px; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(payment.screenshotName ?? 'Payment_Receipt.jpg')}</div>
                  <div style="font-size: 9px; color: #4ade80; margin-top: 2px;">Receipt Uploaded ✓</div>
                </div>
                <button id="btn-remove-proof" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 14px; padding: 4px;">✕</button>
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
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <span>Make sure the payment amount is clearly visible.</span>
            </div>

            <div class="guide-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" x2="8" y1="13" y2="13"/>
                <line x1="16" x2="8" y1="17" y2="17"/>
                <line x1="10" x2="8" y1="9" y2="9"/>
              </svg>
              <span>Do not crop important details.</span>
            </div>

            <div class="guide-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Your registration will be verified manually by the team. You'll receive a confirmation via email and on the app.</span>
            </div>
          </div>

        </div>

        <!-- Action Button connected to Timeline Bead -->
        <div class="timeline-step-block button-step-block">
          <div class="timeline-bead" style="top: 20px;"></div>

          <button class="beveled-cyan-btn" id="btn-submit-verification">
            <span>Submit for Verification</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14m-7-7 7 7-7 7"/>
            </svg>
          </button>
        </div>

      </div>

      <!-- Footer Metadata -->
      <footer class="mockup-flow-footer">
        <div class="footer-left-col">
          <span class="f-title-main">STRIATUM 4.0</span>
          <span class="f-title-sub">MEDICAL SYMPOSIUM · 2026</span>
          <span class="f-line-dash"></span>
        </div>
      </footer>

    </div>
  `;
}

export function attachDelegatePaymentEvents(): void {
  const btnBack = document.getElementById('btn-delegate-pay-back');
  const btnSubmit = document.getElementById('btn-submit-verification') as HTMLButtonElement | null;
  const dropzone = document.getElementById('delegate-dropzone');
  const fileInput = document.getElementById('delegate-file-input') as HTMLInputElement | null;
  const btnCopyOrder = document.getElementById('btn-copy-order-id');
  const btnRemoveProof = document.getElementById('btn-remove-proof');

  btnBack?.addEventListener('click', () => {
    appStore.setScreen('delegate-registration');
  });

  btnCopyOrder?.addEventListener('click', () => {
    const orderId = appStore.getState().delegatePayment.orderId;
    if (!orderId) return;
    navigator.clipboard?.writeText(orderId);
    appStore.showToast('Order ID copied to clipboard!');
  });

  dropzone?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#btn-remove-proof')) return;
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    void (async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const result = await registration.prepareProof(file);
      if (!result.ok) {
        appStore.showToast(result.message ?? 'That file could not be used.');
        fileInput.value = '';
        return;
      }
      appStore.setDelegateScreenshot(result.dataUrl!, file.name);
    })();
  });

  btnRemoveProof?.addEventListener('click', (e) => {
    e.stopPropagation();
    appStore.setDelegateScreenshot(null, null);
  });

  btnSubmit?.addEventListener('click', () => {
    const st = appStore.getState().delegatePayment;
    if (!st.screenshotUrl) {
      appStore.showToast('Upload your payment screenshot before submitting.');
      return;
    }
    if (btnSubmit) btnSubmit.disabled = true;
    appStore.confirmDelegateRegistration();
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
