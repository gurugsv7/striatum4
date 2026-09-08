import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { Order } from '../services/registrationService.ts';
import { formatINR } from '../services/pricing.ts';

/**
 * PAYMENT VIEW — "03 / PAYMENT"
 *
 * There is no official payment QR image checked into this repo. Drop the real
 * asset at `public/assets/payment_qr.png` once organisers supply it, then set
 * PAYMENT_QR_SRC below to that path — the placeholder panel is swapped for a
 * real <img> automatically, no other change required.
 */
const PAYMENT_QR_SRC: string | null = null;

interface StagedProof {
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

/** Held only in memory between "choose file" and the explicit submit tap. */
let stagedProof: StagedProof | null = null;
let stagedForOrderId: string | null = null;
let isSubmitting = false;

function resetStagedProofIfDifferentOrder(orderId: string): void {
  if (stagedForOrderId !== orderId) {
    stagedProof = null;
    stagedForOrderId = orderId;
    isSubmitting = false;
  }
}

function renderQrPanel(): string {
  if (PAYMENT_QR_SRC) {
    return `
      <div class="qr-panel">
        <div class="qr-corner-tl"></div>
        <div class="qr-corner-br"></div>
        <img src="${PAYMENT_QR_SRC}" alt="Official payment QR" class="qr-image" />
      </div>
    `;
  }
  return `
    <!--
      No official payment QR asset exists yet. Once organisers hand one over, save
      it to public/assets/payment_qr.png and set PAYMENT_QR_SRC at the top of this
      file to "/assets/payment_qr.png" — the placeholder below is replaced by a
      real <img> automatically.
    -->
    <div class="qr-panel qr-panel-placeholder">
      <div class="qr-corner-tl"></div>
      <div class="qr-corner-br"></div>
      <span class="qr-placeholder-label">OFFICIAL PAYMENT QR</span>
      <span class="qr-placeholder-note">Awaiting official QR from organisers.</span>
    </div>
  `;
}

function renderUploadBlock(buttonLabel: string): string {
  if (stagedProof) {
    return `
      <div class="upload-preview-panel">
        <img src="${stagedProof.dataUrl}" alt="Payment screenshot preview" class="upload-preview-thumb" />
        <div class="upload-preview-meta">
          <span class="upload-preview-filename">${stagedProof.fileName}</span>
          <button class="action-link-cyan upload-replace-btn" id="btn-replace-proof">REPLACE</button>
        </div>
      </div>
      <input type="file" id="proof-file-input" accept="image/jpeg,image/png" hidden />
      <button class="btn-chamfer-primary" id="btn-submit-proof" ${isSubmitting ? 'disabled' : ''}>
        <span>${isSubmitting ? 'SUBMITTING…' : 'SUBMIT FOR VERIFICATION'}</span>
      </button>
    `;
  }

  return `
    <button class="upload-drop-panel" id="btn-choose-proof" type="button">
      <div class="qr-corner-tl"></div>
      <div class="qr-corner-br"></div>
      <span class="upload-drop-title">UPLOAD PAYMENT SCREENSHOT</span>
      <span class="upload-drop-formats">JPG / JPEG / PNG</span>
      <span class="upload-drop-hint">Make sure the paid amount and transaction details are visible.</span>
      <span class="action-link-cyan upload-choose-label">${buttonLabel}</span>
    </button>
    <input type="file" id="proof-file-input" accept="image/jpeg,image/png" hidden />
  `;
}

function renderPaymentBlock(order: Order): string {
  const uploadLabel = order.status === 'rejected' ? 'UPLOAD A NEW SCREENSHOT' : 'CHOOSE SCREENSHOT';
  return `
    <section class="payment-action-block">
      ${renderQrPanel()}
      <p class="qr-scan-caption">SCAN USING ANY UPI APP</p>
      <p class="pay-exact-line">Pay exactly <span class="pay-exact-amount">${formatINR(order.total)}</span></p>

      <div class="upload-section-wrap">
        ${renderUploadBlock(uploadLabel)}
        <p class="proof-privacy-note">
          Your screenshot is stored privately and is only visible to you and the verifying organiser.
        </p>
      </div>
    </section>
  `;
}

function renderStatusBlock(order: Order): string {
  if (order.status === 'under_review' || order.status === 'payment_submitted') {
    const proofImage = registration.readProofImage(order.id);
    const submittedAt = order.submittedAt ? new Date(order.submittedAt).toLocaleString() : '';
    return `
      <section class="payment-status-block">
        <h2 class="status-heading">Payment submitted.</h2>
        <p class="status-body">
          Your payment proof is being verified.<br />
          Your registrations will be confirmed after approval.
        </p>
        ${
          order.proof
            ? `
          <div class="status-proof-strip">
            ${proofImage ? `<img src="${proofImage}" alt="Submitted screenshot" class="status-proof-thumb" />` : ''}
            <div class="status-proof-meta">
              <span>${order.proof.fileName}</span>
              ${submittedAt ? `<span class="status-proof-time">Submitted ${submittedAt}</span>` : ''}
            </div>
          </div>
        `
            : ''
        }
        <button class="action-link-cyan" id="btn-view-my-events">VIEW MY EVENTS →</button>
      </section>
    `;
  }

  if (order.status === 'approved') {
    return `
      <section class="payment-status-block">
        <h2 class="status-heading">Payment verified.</h2>
        <p class="status-body">Your registrations are confirmed.</p>
        <button class="action-link-cyan" id="btn-view-my-events">VIEW MY EVENTS →</button>
      </section>
    `;
  }

  return '';
}

function renderRejectionNotice(order: Order): string {
  if (order.status !== 'rejected') return '';
  return `
    <section class="payment-status-block payment-rejected-block">
      <h2 class="status-heading">Re-upload required.</h2>
      <p class="status-body status-rejection-reason">${order.rejectionReason ?? ''}</p>
    </section>
  `;
}

export function renderPaymentView(): string {
  const state = appStore.getState();
  const orderId = state.selectedOrderId;
  const order = orderId ? registration.getOrder(orderId) : undefined;

  if (!order) {
    return `
      <div class="screen-content no-bottom-nav">
        <header class="details-top-header">
          <button class="btn-back-nav" id="btn-payment-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span class="back-nav-label">BACK TO CART</span>
          </button>
          <div class="details-brand-sig">
            <div class="sig-striatum">STRIATUM <span class="cyan-text">4.0</span></div>
            <div class="sig-inst">IGMCRI · SIGMA 2026</div>
          </div>
        </header>

        <section class="explore-hero-section">
          <div class="section-index-label">
            <span class="cyan-num">03</span>
            <span class="slash">/</span>
            <span class="section-name">PAYMENT</span>
          </div>
          <h1 class="explore-heading">No order<br />to pay for<span class="cyan-period">.</span></h1>
        </section>

        <div class="empty-search-state">
          <p>There is no pending order to pay for.</p>
          <button class="action-link-cyan" id="btn-cart-explore" style="margin: 14px auto 0;">
            Back to Cart →
          </button>
        </div>
      </div>
    `;
  }

  resetStagedProofIfDifferentOrder(order.id);

  const showPaymentBlock = order.status === 'awaiting_payment' || order.status === 'rejected';

  return `
    <div class="screen-content no-bottom-nav">

      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-payment-back">
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

      <section class="explore-hero-section">
        <div class="section-index-label">
          <span class="cyan-num">03</span>
          <span class="slash">/</span>
          <span class="section-name">PAYMENT</span>
        </div>

        <h1 class="explore-heading">
          Complete your<br />
          registration<span class="cyan-period">.</span>
        </h1>
      </section>

      <div class="payment-order-summary">
        <div class="ledger-row">
          <span class="ledger-label">ORDER</span>
          <span class="ledger-value">${order.reference}</span>
        </div>
        <div class="ledger-row">
          <span class="ledger-label">${order.lines.length} EVENT${order.lines.length > 1 ? 'S' : ''}</span>
          <span class="ledger-value"></span>
        </div>
        <div class="ledger-row">
          <span class="ledger-label">SUBTOTAL</span>
          <span class="ledger-value">${formatINR(order.subtotal)}</span>
        </div>
        ${
          order.discountAmount > 0
            ? `
          <div class="ledger-row ledger-discount">
            <span class="ledger-label">${order.discountLabel ?? 'DISCOUNT'}</span>
            <span class="ledger-value">-${formatINR(order.discountAmount)}</span>
          </div>
        `
            : ''
        }
        <div class="ledger-hairline"></div>
        <div class="pay-amount-row">
          <span class="pay-amount-label">PAY</span>
          <span class="pay-amount-value">${formatINR(order.total)}</span>
        </div>
      </div>

      <div class="payment-lines-list">
        ${order.lines
          .map(
            line => `
          <div class="payment-line-item">
            <span class="payment-line-name">${line.eventName}</span>
            <span class="payment-line-context">${line.context}</span>
          </div>
        `
          )
          .join('')}
      </div>

      ${renderRejectionNotice(order)}
      ${showPaymentBlock ? renderPaymentBlock(order) : ''}
      ${renderStatusBlock(order)}

    </div>
  `;
}

async function handleProofFileChange(input: HTMLInputElement, orderId: string): Promise<void> {
  const file = input.files?.[0];
  if (!file) return;

  const result = await registration.prepareProof(file);
  if (!result.ok || !result.dataUrl || !result.mimeType) {
    appStore.showToast(result.message ?? 'That screenshot could not be used.');
    input.value = '';
    return;
  }

  stagedProof = {
    fileName: file.name,
    mimeType: result.mimeType,
    size: file.size,
    dataUrl: result.dataUrl
  };
  stagedForOrderId = orderId;
  appStore.refresh();
}

export function attachPaymentEvents(): void {
  const state = appStore.getState();
  const orderId = state.selectedOrderId;
  const order = orderId ? registration.getOrder(orderId) : undefined;

  const btnBack = document.getElementById('btn-payment-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (order && (order.status === 'under_review' || order.status === 'payment_submitted' || order.status === 'approved')) {
        appStore.setScreen('my-events');
      } else {
        appStore.setScreen('cart');
      }
    });
  }

  const btnCartExplore = document.getElementById('btn-cart-explore');
  if (btnCartExplore) {
    btnCartExplore.addEventListener('click', () => {
      appStore.setScreen('cart');
    });
  }

  document.querySelectorAll<HTMLElement>('#btn-view-my-events').forEach(btn => {
    btn.addEventListener('click', () => {
      appStore.setScreen('my-events');
    });
  });

  if (!order) return;

  const fileInput = document.getElementById('proof-file-input') as HTMLInputElement | null;
  const btnChoose = document.getElementById('btn-choose-proof');
  const btnReplace = document.getElementById('btn-replace-proof');
  const btnSubmit = document.getElementById('btn-submit-proof') as HTMLButtonElement | null;

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      void handleProofFileChange(fileInput, order.id);
    });
  }

  if (btnChoose && fileInput) {
    btnChoose.addEventListener('click', () => fileInput.click());
  }

  if (btnReplace && fileInput) {
    btnReplace.addEventListener('click', () => fileInput.click());
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      if (isSubmitting || !stagedProof) return;
      isSubmitting = true;
      btnSubmit.disabled = true;
      const proof = stagedProof;
      const result = registration.submitPaymentProof(order.id, proof);
      stagedProof = null;
      isSubmitting = false;
      appStore.showToast(result.message);
    });
  }
}
