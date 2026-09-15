import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { escapeHtml } from '../services/text.ts';
import { SYMPOSIUM_UPI_ID, SYMPOSIUM_UPI_QR } from '../data/payment.ts';
import { playBubbleTransition } from '../components/BubbleTransition.ts';

/**
 * IGMCRI students' route to a Delegate Pass.
 *
 * The conclave is their own college's, so Tier 1 costs them nothing and Tier 2
 * costs 100 rather than 600. What replaces the fee is evidence: a student ID
 * card, which an organiser checks before the pass is approved.
 *
 * This is deliberately the delegate payment screen's anatomy — the same
 * timeline rail, the same numbered steps, the same payment card, the same
 * dropzone — rather than a new layout. A delegate who has seen one should
 * recognise the other instantly, and the only real difference is what is being
 * asked for.
 *
 * Tier 1 has no payment section at all. Showing a zero-rupee QR would be worse
 * than useless: it invites a payment nobody wants.
 */

/** The step numbers shift because Tier 1 has no payment step to number. */
function steps(paying: boolean) {
  return paying
    ? { pay: '02', screenshot: '03', card: '04' }
    : { pay: '', screenshot: '', card: '02' };
}

function dropzone(
  id: string,
  url: string | null,
  name: string | null,
  prompt: string,
  removeId: string
): string {
  if (url) {
    return `
      <div class="dropzone-upload-box" id="${id}">
        <div style="display: flex; align-items: center; gap: 12px; text-align: left; width: 100%;">
          <img src="${url}" alt="" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid var(--cyan-glow);" />
          <div style="flex: 1; overflow: hidden;">
            <div style="font-size: 12px; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(name ?? 'Upload.jpg')}</div>
            <div style="font-size: 9px; color: #4ade80; margin-top: 2px;">Uploaded &#10003;</div>
          </div>
          <button id="${removeId}" aria-label="Remove" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 14px; padding: 4px;">&#10005;</button>
        </div>
      </div>`;
  }
  return `
    <div class="dropzone-upload-box" id="${id}">
      <div class="dropzone-cloud-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
          <path d="M12 12v9"/>
          <path d="m16 16-4-4-4 4"/>
        </svg>
      </div>
      <div class="dropzone-main-text">${prompt}</div>
      <div class="dropzone-hint-text">JPG, PNG (Max 5MB)</div>
    </div>`;
}

export function renderDelegateHomeView(): string {
  const state = appStore.getState();
  const form = state.delegateForm;
  const payment = state.delegatePayment;
  const fee = registration.delegateFee(form.tier, true);
  const paying = fee > 0;
  const n = steps(paying);

  const hasCard = Boolean(form.idProofUrl);
  const hasScreenshot = Boolean(payment.screenshotUrl);
  const ready = hasCard && (!paying || hasScreenshot);

  // Say precisely what is still missing rather than leaving a dead button.
  const blocker = !hasCard
    ? 'Upload your student ID card to continue.'
    : paying && !hasScreenshot
    ? 'Upload your payment screenshot to continue.'
    : '';

  return `
    <div class="screen-content">
      <header class="delegate-top-bar">
        <button class="top-bar-back-btn" id="btn-delegate-home-back" aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div class="top-bar-brand-col">
          <div class="top-bar-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="top-bar-brand-meta">IGMCRI &middot; SIGMA 2026</div>
        </div>
      </header>

      <div class="mockup-timeline-wrap">
        <div class="mockup-timeline-rail"></div>

        <div class="timeline-step-block">
          <div class="timeline-bead"></div>
          <div class="timeline-step-header">
            <span class="step-label-tag">01 <span style="opacity: 0.5;">/</span> IGMCRI STUDENT</span>
          </div>

          <h1 class="hero-display-title">
            ${paying ? 'Almost nothing' : 'Nothing'}<br />
            to pay<span class="cyan-dot">.</span>
          </h1>

          <p class="hero-display-sub">
            ${
              paying
                ? `The conclave is your own college's, so a ${escapeHtml(
                    form.tier
                  )} pass costs you ${registration.formatINR(fee)} instead of ${registration.formatINR(600)}.`
                : `The conclave is your own college's, so an ${escapeHtml(
                    form.tier
                  )} pass costs you nothing.`
            }
            Your student ID card is what confirms it.
          </p>

          <div class="delegate-home-ledger">
            <div class="delegate-home-ledger-row">
              <span class="pay-lbl-tag">PASS TIER</span>
              <span class="delegate-home-ledger-val">${escapeHtml(form.tier)}</span>
            </div>
            <div class="delegate-home-ledger-row">
              <span class="pay-lbl-tag">COLLEGE</span>
              <span class="delegate-home-ledger-val">IGMCRI</span>
            </div>
            <div class="delegate-home-ledger-row is-total">
              <span class="pay-lbl-tag">YOU PAY</span>
              <span class="delegate-home-price">${
                paying ? registration.formatINR(fee) : 'No fee'
              }</span>
            </div>
          </div>
        </div>

        ${
          paying
            ? `
        <div class="timeline-step-block">
          <div class="timeline-bead"></div>
          <div class="timeline-step-header">
            <span class="step-label-tag">${n.pay} <span style="opacity: 0.5;">/</span> PAY ${registration.formatINR(
                fee
              )}</span>
          </div>

          <div class="payment-main-card">
            <div class="pay-card-watermark">
              <img src="/art_pay_jelly.png" alt="" />
            </div>

            <div class="pay-qr-center-col">
              <div class="pay-qr-frame-box">
                <img src="${SYMPOSIUM_UPI_QR}" alt="UPI QR code" />
              </div>
              <div class="pay-qr-caption" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                <span>Scan using any UPI app &middot; <strong style="color: var(--cyan-glow);">${escapeHtml(
                  SYMPOSIUM_UPI_ID
                )}</strong></span>
                <button class="copy-icon-btn" id="btn-copy-home-upi" title="Copy UPI ID" style="padding: 2px; vertical-align: middle;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="pay-card-bottom-split">
              <div class="pay-amount-col">
                <span class="pay-lbl-tag">AMOUNT TO PAY</span>
                <span class="pay-huge-price">${registration.formatINR(fee)}</span>
              </div>
              <div class="pay-order-meta-col">
                <span class="pay-tier-text">${escapeHtml(form.tier)}</span>
                <div class="pay-order-row"><span>IGMCRI student rate</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="timeline-step-block">
          <div class="timeline-bead"></div>
          <div class="timeline-step-header">
            <span class="step-label-tag">${n.screenshot} <span style="opacity: 0.5;">/</span> PAYMENT SCREENSHOT</span>
          </div>
          <input type="file" id="home-pay-input" accept="image/*" style="display: none;" />
          ${dropzone(
            'home-pay-dropzone',
            payment.screenshotUrl,
            payment.screenshotName,
            'Tap to upload payment screenshot',
            'btn-remove-home-pay'
          )}
        </div>`
            : ''
        }

        <div class="timeline-step-block">
          <div class="timeline-bead"></div>
          <div class="timeline-step-header">
            <span class="step-label-tag">${n.card} <span style="opacity: 0.5;">/</span> STUDENT ID CARD</span>
          </div>

          <input type="file" id="home-id-input" accept="image/*" style="display: none;" />
          ${dropzone(
            'home-id-dropzone',
            form.idProofUrl,
            form.idProofName,
            'Tap to upload your IGMCRI ID card',
            'btn-remove-home-id'
          )}

          <div class="verification-guidelines-box">
            <div class="guide-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <span>Your name and college must be readable in the photo.</span>
            </div>
            <div class="guide-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>An organiser checks the card by hand. You will hear back by email and in the app.</span>
            </div>
            <div class="guide-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Only you and the organisers can see what you upload here.</span>
            </div>
          </div>
        </div>

        <div class="timeline-step-block button-step-block">
          <div class="timeline-bead" style="top: 20px;"></div>
          <button class="beveled-cyan-btn" id="btn-submit-home-delegate" ${
            ready ? '' : 'disabled aria-disabled="true"'
          }>
            <span>Submit for Verification</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14m-7-7 7 7-7 7"/>
            </svg>
          </button>
          ${blocker ? `<p class="delegate-home-blocker">${blocker}</p>` : ''}
        </div>
      </div>
    </div>`;
}

export function attachDelegateHomeEvents(): void {
  document.getElementById('btn-delegate-home-back')?.addEventListener('click', () => {
    appStore.setScreen('delegate-registration');
  });

  document.getElementById('btn-copy-home-upi')?.addEventListener('click', event => {
    event.stopPropagation();
    navigator.clipboard?.writeText(SYMPOSIUM_UPI_ID);
    appStore.showToast(`UPI ID ${SYMPOSIUM_UPI_ID} copied to clipboard!`);
  });

  /** Both dropzones behave identically; only where the result is kept differs. */
  const wireUpload = (
    dropzoneId: string,
    inputId: string,
    removeId: string,
    keep: (dataUrl: string | null, name: string | null) => void
  ) => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;

    document.getElementById(dropzoneId)?.addEventListener('click', event => {
      if ((event.target as HTMLElement).closest(`#${removeId}`)) return;
      input?.click();
    });

    input?.addEventListener('change', () => {
      void (async () => {
        const file = input.files?.[0];
        if (!file) return;
        // Same validation and downscaling as every other upload in the app.
        const result = await registration.prepareProof(file);
        if (!result.ok) {
          appStore.showToast(result.message ?? 'That file could not be used.');
          input.value = '';
          return;
        }
        keep(result.dataUrl!, file.name);
      })();
    });

    document.getElementById(removeId)?.addEventListener('click', event => {
      event.stopPropagation();
      keep(null, null);
    });
  };

  wireUpload('home-id-dropzone', 'home-id-input', 'btn-remove-home-id', (url, name) =>
    appStore.setDelegateIdProof(url, name)
  );
  wireUpload('home-pay-dropzone', 'home-pay-input', 'btn-remove-home-pay', (url, name) =>
    appStore.setDelegateScreenshot(url, name)
  );

  const submit = document.getElementById('btn-submit-home-delegate') as HTMLButtonElement | null;
  submit?.addEventListener('click', () => {
    const { delegateForm, delegatePayment } = appStore.getState();
    const fee = registration.delegateFee(delegateForm.tier, true);

    if (!delegateForm.idProofUrl) {
      appStore.showToast('Upload your student ID card before submitting.');
      return;
    }
    if (fee > 0 && !delegatePayment.screenshotUrl) {
      appStore.showToast('Upload your payment screenshot before submitting.');
      return;
    }

    submit.disabled = true;
    void appStore
      .confirmDelegateRegistration(() =>
        playBubbleTransition(() => appStore.setScreen('delegate-confirm'))
      )
      .then(ok => {
        // A refusal must leave the delegate able to try again.
        if (!ok) submit.disabled = false;
      });
  });
}
