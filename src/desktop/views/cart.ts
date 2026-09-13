import { appStore } from '../../state/appStore.ts';
import * as registration from '../../services/registrationService.ts';
import { formatINR } from '../../services/pricing.ts';
import { crest, eyebrow, icon } from '../shell.ts';

/**
 * Desktop cart.
 *
 * Lines on the left, a ledger that stays put on the right. Every number still
 * comes from registrationService.priceCart() — this view computes nothing, so
 * it can never disagree with the order that createOrder() persists.
 */

function renderLine(line: registration.PricedLine): string {
  const meta: string[] = [];
  if (line.date) meta.push(line.date + (line.startTime ? ' · ' + line.startTime : ''));
  if (line.lunchChoice) {
    meta.push(`<em>LUNCH &middot; ${line.lunchChoice === 'veg' ? 'Vegetarian' : 'Non-vegetarian'}</em>`);
  }

  return `
    <div class="d-cart-line">
      <div class="d-cart-card">
        <div class="d-cart-card-main">
          <div class="d-cart-title-row">
            <button class="d-cart-title" data-open-event-id="${line.eventId}">${line.eventName}</button>
            <button class="d-cart-remove" data-remove-event-id="${line.eventId}">REMOVE</button>
          </div>
          <p class="d-cart-context">${line.context}</p>
          ${meta.length ? `<div class="d-cart-meta">${meta.map(item => `<span>${item}</span>`).join('')}</div>` : ''}
          ${line.issues
            .map(
              issue => `<div class="d-cart-issue ${issue.blocking ? 'is-blocking' : ''}">${issue.message}</div>`
            )
            .join('')}
        </div>
        <div class="d-cart-price">
          <b>${formatINR(line.unitPrice)}</b>
          <small>${line.priceBasis}</small>
        </div>
      </div>
    </div>`;
}

export function renderDesktopCart(): string {
  const pricing = registration.priceCart();
  const count = pricing.lines.length;

  const blocked = count === 0 || pricing.blockingIssues.length > 0 || pricing.unpricedEventIds.length > 0;

  let blockReason = '';
  if (pricing.blockingIssues.length > 0) {
    blockReason = pricing.blockingIssues[0].message;
  } else if (pricing.unpricedEventIds.length > 0) {
    const names = pricing.unpricedEventIds
      .map(id => pricing.lines.find(line => line.eventId === id)?.eventName ?? id)
      .join(', ');
    blockReason = `Fees are not yet published for ${names}.`;
  }

  if (count === 0) {
    return `
      <div class="d-page">
        <div class="d-cart d-pad" style="flex-direction: column; align-items: stretch;">
          <button class="d-back" id="btn-cart-back">${icon('back', 17, 2.2)}<span>CONTINUE EXPLORING</span></button>
          <div style="display: flex; flex-direction: column; gap: 13px; margin-top: 26px;">
            ${eyebrow('02', 'CART')}
            <h1 class="d-display">Your selected events<span class="d-dot">.</span></h1>
            <p class="d-lede">No events selected yet.</p>
          </div>
          <div class="d-empty" style="padding-top: 70px;">
            <p>Nothing here yet.</p>
            <small>Pick a workshop, quiz or presentation and it will appear in this ledger.</small>
            <button class="d-link" id="btn-cart-explore" style="margin-top: 14px;">
              <span>EXPLORE EVENTS</span><span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="d-page">
      <div class="d-cart d-pad">
        <div class="d-cart-main">
          <button class="d-back" id="btn-cart-back">${icon('back', 17, 2.2)}<span>CONTINUE EXPLORING</span></button>

          <div style="display: flex; flex-direction: column; gap: 13px;">
            ${eyebrow('02', 'CART')}
            <h1 class="d-display">Your selected events<span class="d-dot">.</span></h1>
            <p class="d-lede">${count} event${count > 1 ? 's' : ''} awaiting payment.</p>
          </div>

          <div class="d-cart-lines">
            ${pricing.lines.map(renderLine).join('')}
          </div>

          ${
            pricing.conflicts.length
              ? `<div class="d-conflict">
                  <span class="d-conflict-label">SCHEDULE CONFLICT</span>
                  <div>${pricing.conflicts.map(conflict => `<p>${conflict.message}</p>`).join('')}</div>
                </div>`
              : ''
          }
        </div>

        <aside class="d-ledger" aria-label="Order summary">
          <div class="d-console-card d-hud">
            <span class="d-hud-label">ORDER LEDGER</span>

            <dl class="d-ledger-rows">
              <div class="d-ledger-row"><dt>EVENTS</dt><dd>${count}</dd></div>
              <div class="d-ledger-row"><dt>SUBTOTAL</dt><dd>${formatINR(pricing.subtotal)}</dd></div>
              ${
                pricing.discountAmount > 0
                  ? `<div class="d-ledger-row is-discount">
                      <dt>${pricing.discountLabel ?? 'DISCOUNT'}</dt>
                      <dd>-${formatINR(pricing.discountAmount)}</dd>
                    </div>`
                  : ''
              }
              <div class="d-ledger-rule"></div>
              <div class="d-ledger-row is-total"><dt>TOTAL</dt><dd>${formatINR(pricing.total)}</dd></div>
            </dl>

            ${
              blockReason
                ? `<div class="d-notice is-blocking" style="margin: 22px 0 20px;">
                    ${icon('info', 15, 2)}<p>${blockReason}</p>
                  </div>`
                : '<div style="height: 24px;"></div>'
            }

            <button class="d-btn" id="btn-proceed-to-payment" ${blocked ? 'disabled' : ''}>
              <span>PROCEED TO PAYMENT</span>
              ${icon('arrow', 18, 2)}
            </button>

            <p class="d-ledger-note">UPI TRANSFER &middot; SCREENSHOT PROOF<br>MANUALLY VERIFIED BY ORGANISERS</p>
          </div>

          <div class="d-panel-soft" style="padding: 18px 20px; display: flex; align-items: center; gap: 16px;">
            <span class="d-pass-crest">${crest(19)}</span>
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <span class="d-hud-label">DELEGATE PASS</span>
              <span style="font-size: 12.5px; color: var(--text-silver);">
                ${
                  registration.hasActiveDelegatePass()
                    ? 'Active on your account'
                    : 'Needed for some of these events'
                }
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>`;
}

export function attachDesktopCart(): void {
  document.getElementById('btn-cart-back')?.addEventListener('click', () => {
    appStore.setScreen('explore');
  });

  document.getElementById('btn-cart-explore')?.addEventListener('click', () => {
    appStore.setScreen('explore');
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(element => {
    element.addEventListener('click', () => {
      const id = element.getAttribute('data-open-event-id');
      if (id) appStore.openEvent(id);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-remove-event-id]').forEach(element => {
    element.addEventListener('click', () => {
      const id = element.getAttribute('data-remove-event-id');
      if (!id) return;
      const result = registration.removeFromCart(id);
      appStore.showToast(result.message);
    });
  });

  const proceed = document.getElementById('btn-proceed-to-payment') as HTMLButtonElement | null;
  proceed?.addEventListener('click', async () => {
    if (proceed.disabled) return;
    proceed.disabled = true;
    const result = await registration.createOrder();
    if (result.ok && result.order) {
      appStore.openPayment(result.order.id);
    } else {
      proceed.disabled = false;
      appStore.showToast(result.message ?? 'Could not create the order.');
    }
  });
}
