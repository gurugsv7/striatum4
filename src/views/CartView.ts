import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { formatINR } from '../services/pricing.ts';
import { intentSummary } from '../services/registrationForm.ts';
import { startEventRegistration, startComboRegistration } from './RegistrationFormView.ts';

/**
 * CART VIEW — "02 / CART"
 *
 * Renders exactly what registrationService.priceCart() returns. This view never
 * computes a subtotal, discount or total itself — those numbers come from the
 * single pricing authority so they can never drift from what createOrder() later
 * persists onto the order.
 */

function comboOf(eventId: string): string | undefined {
  return registration.getCart().find(item => item.eventId === eventId)?.comboId;
}

/**
 * What the cart says about a registration: that it is complete and how big it
 * is. The form's contents stay in the form; Edit reopens it.
 */
function regSummary(eventId: string): string {
  const item = registration.getCart().find(candidate => candidate.eventId === eventId);
  if (!item?.intent) return '';
  const comboId = item.comboId;
  return `
    <div class="cart-reg-summary">
      <span>${intentSummary(item.intent)}</span>
      <span>&middot;</span>
      <span class="cart-reg-complete">DETAILS COMPLETE &#10003;</span>
      <button class="cart-reg-edit" data-edit-registration="${eventId}" ${comboId ? `data-edit-combo="${comboId}"` : ''}>EDIT</button>
    </div>`;
}

function renderLine(line: registration.PricedLine): string {
  const dateRow =
    line.date !== undefined
      ? `
        <div class="cart-line-meta-row">
          <span>${line.date}</span>
          ${line.startTime ? `<span class="cart-meta-dot">·</span><span>${line.startTime}</span>` : ''}
        </div>
      `
      : '';

  const issuesHtml = line.issues.length
    ? line.issues
        .map(
          issue => `
            <div class="cart-line-issue ${issue.blocking ? 'blocking' : 'warning'}">
              ${issue.message}
            </div>
          `
        )
        .join('')
    : '';

  return `
    <div class="explore-event-entry cart-line-entry" data-line-event-id="${line.eventId}">
      <div class="explore-timeline-bead"></div>

      <div class="cart-line-card">
        <div class="cart-line-top-row">
          <button class="cart-line-name-btn" data-open-event-id="${line.eventId}">
            ${line.eventName}
          </button>
          <button class="cart-line-remove" data-remove-event-id="${line.eventId}">
            ${comboOf(line.eventId) ? 'REMOVE COMBO' : 'REMOVE'}
          </button>
        </div>
        ${comboOf(line.eventId) ? '<div class="cart-line-combo-tag">PART OF A COMBO</div>' : ''}

        <div class="cart-line-context">${line.context}</div>
        ${dateRow}
        ${line.lunchChoice ? `<div class="cart-line-meta-row"><span>LUNCH</span><span>${line.lunchChoice === 'veg' ? 'Vegetarian' : 'Non-vegetarian'}</span></div>` : ''}

        ${regSummary(line.eventId)}

        ${
          (line.quantity ?? 1) > 1
            ? `<div class="cart-line-meta-row"><span>TEAMS</span><span>${line.quantity} × ${formatINR(line.unitPrice)}</span></div>`
            : ''
        }

        <div class="cart-line-price-row">
          <span class="cart-line-price">${formatINR(line.unitPrice * (line.quantity ?? 1))}</span>
          <span class="cart-line-price-basis">${line.priceBasis}</span>
        </div>

        ${issuesHtml}
      </div>
    </div>
  `;
}

export function renderCartView(): string {
  const pricing = registration.priceCart();
  const count = pricing.lines.length;

  const isBlocked =
    count === 0 || pricing.blockingIssues.length > 0 || pricing.unpricedEventIds.length > 0;

  let blockReason = '';
  if (count === 0) {
    blockReason = '';
  } else if (pricing.blockingIssues.length > 0) {
    // Every reason at once. Naming one at a time made clearing a cart a
    // guessing game: remove the named line, find out there was a second one,
    // repeat.
    blockReason = [...new Set(pricing.blockingIssues.map(issue => issue.message))].join(' ');
  } else if (pricing.unpricedEventIds.length > 0) {
    const names = pricing.unpricedEventIds
      .map(id => pricing.lines.find(l => l.eventId === id)?.eventName ?? id)
      .join(', ');
    blockReason = `Fees are not yet published for ${names}.`;
  }

  return `
    <div class="screen-content no-bottom-nav">

      <!-- Top Navigation Bar -->
      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-cart-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span class="back-nav-label">CONTINUE EXPLORING</span>
        </button>
      </header>

      <!-- Section 02 / CART -->
      <section class="explore-hero-section">
        <div class="section-index-label">
          <span class="cyan-num">02</span>
          <span class="slash">/</span>
          <span class="section-name">CART</span>
        </div>

        <h1 class="explore-heading">
          Your selected<br />
          events<span class="cyan-period">.</span>
        </h1>

        <p class="explore-subtitle">
          ${
            count === 0
              ? 'No events selected yet.'
              : `${count} event${count > 1 ? 's' : ''} awaiting ${
                  pricing.total === 0 ? 'submission' : 'payment'
                }.`
          }
        </p>
      </section>

      ${
        count === 0
          ? `
        <div class="empty-search-state">
          <p>No events selected yet.</p>
          <button class="action-link-cyan" id="btn-cart-explore" style="margin: 14px auto 0;">
            Explore Events →
          </button>
        </div>
      `
          : `
        <div class="explore-cards-timeline cart-lines-timeline">
          <div class="explore-timeline-rail"></div>
          ${pricing.lines.map(renderLine).join('')}
        </div>

        ${
          pricing.conflicts.length
            ? `
          <div class="cart-conflict-block">
            <div class="cart-conflict-title">SCHEDULE CONFLICT</div>
            ${pricing.conflicts.map(c => `<div class="cart-conflict-line">${c.message}</div>`).join('')}
          </div>
        `
            : ''
        }

        <div class="cart-summary-ledger">
          <div class="ledger-row">
            <span class="ledger-label">EVENTS</span>
            <span class="ledger-value">${count}</span>
          </div>
          <div class="ledger-row">
            <span class="ledger-label">SUBTOTAL</span>
            <span class="ledger-value">${formatINR(pricing.subtotal)}</span>
          </div>
          ${
            pricing.discountAmount > 0
              ? `
            <div class="ledger-row ledger-discount">
              <span class="ledger-label">${pricing.discountLabel ?? 'DISCOUNT'}</span>
              <span class="ledger-value">-${formatINR(pricing.discountAmount)}</span>
            </div>
          `
              : ''
          }
          <div class="ledger-hairline"></div>
          <div class="ledger-row ledger-total">
            <span class="ledger-label">TOTAL</span>
            <span class="ledger-value">${formatINR(pricing.total)}</span>
          </div>
        </div>

        ${
          isBlocked && blockReason
            ? `<div class="cart-block-reason">${blockReason}</div>`
            : ''
        }

        <button
          class="btn-chamfer-primary"
          id="btn-proceed-to-payment"
          ${isBlocked ? 'disabled' : ''}
        >
          <span>${pricing.total === 0 ? 'PROCEED TO SUBMIT' : 'PROCEED TO PAYMENT'}</span>
        </button>
      `
      }

    </div>
  `;
}

export function attachCartEvents(): void {
  // Say so when a sync has just taken a line out of the cart.
  const notice = registration.takeCartNotice();
  if (notice) appStore.showToast(notice);

  const btnBack = document.getElementById('btn-cart-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      appStore.setScreen('explore');
    });
  }

  const btnExplore = document.getElementById('btn-cart-explore');
  if (btnExplore) {
    btnExplore.addEventListener('click', () => {
      appStore.setScreen('explore');
    });
  }

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-open-event-id');
      if (id) appStore.openEvent(id);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-edit-registration]').forEach(el => {
    el.addEventListener('click', event => {
      event.stopPropagation();
      const comboId = el.getAttribute('data-edit-combo');
      const eventId = el.getAttribute('data-edit-registration');
      // Editing a combo line reopens the whole bundle's form, because that is
      // the one form the delegate filled.
      if (comboId) startComboRegistration(comboId, true);
      else if (eventId) startEventRegistration(eventId, true);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-remove-event-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-remove-event-id');
      if (id) {
        const result = registration.removeFromCart(id);
        appStore.showToast(result.message);
      }
    });
  });

  const btnProceed = document.getElementById('btn-proceed-to-payment') as HTMLButtonElement | null;
  if (btnProceed) {
    btnProceed.addEventListener('click', async () => {
      if (btnProceed.disabled) return;
      const result = await registration.createOrder();
      if (result.ok && result.order) {
        // An order that cost nothing is confirmed by create_order itself, so
        // there is no payment to make and no screenshot to upload.
        if (result.order.status === 'approved') {
          appStore.openOrderConfirmation(result.order.id);
        } else {
          appStore.openPayment(result.order.id);
        }
      } else {
        appStore.showToast(result.message ?? 'Could not create the order.');
      }
    });
  }
}
