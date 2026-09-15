import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { eventContextLine } from '../data/events.ts';
import { escapeHtml } from '../services/text.ts';
import type { MyEventEntry, Order } from '../services/registrationService.ts';

/** Delegate credential line under the hero subtitle — never shows an unapproved ID. */
function delegateStatusLine(): string {
  const status = registration.getDelegateStatus();
  const delegate = registration.getDelegate();

  if (status === 'approved') {
    return `<p class="myevents-delegate-line">Delegate ID <strong class="cyan-inline">${delegate?.delegateId ?? ''}</strong></p>`;
  }
  if (status === 'pending') {
    return `<p class="myevents-delegate-line">Delegate ID awaiting verification</p>`;
  }
  if (status === 'rejected') {
    return `<p class="myevents-delegate-line myevents-delegate-line--warn">Delegate application needs attention</p>`;
  }
  return `
    <p class="myevents-delegate-line">No Delegate ID yet</p>
    <button class="action-link-cyan myevents-get-delegate-link" id="btn-myevents-get-delegate">
      <span>GET DELEGATE ID</span>
      <span>→</span>
    </button>
  `;
}

/**
 * What is actually in an order. A rejected order used to be shown as its
 * reference alone — "Order S4 / 0012" — which a delegate has no way to map
 * back to an event they recognise.
 */
function orderContents(order: Order): string {
  const names = order.lines.map(line => line.eventName);
  if (!names.length) return 'Order ' + order.reference;
  if (names.length <= 2) return names.join(' + ');
  return names[0] + ' + ' + (names.length - 1) + ' more';
}

function actionRequiredGroup(orders: Order[]): string {
  if (!orders.length) return '';
  return `
    <div class="myevents-group">
      <div class="myevents-group-heading myevents-group-heading--warn">ACTION REQUIRED</div>
      <div class="myevents-rail">
        ${orders
          .map(
            order => `
          <div class="myevents-row myevents-row--action">
            <div class="myevents-row-node myevents-row-node--warn"></div>
            <div class="myevents-row-body">
              <div class="myevents-row-title">${orderContents(order)}</div>
              <p class="myevents-row-sub">
                ${order.reference} · ${order.rejectionReason ?? 'Payment proof needs resubmission'}
              </p>
              <button class="action-link-cyan myevents-inline-action" data-reupload-order-id="${order.id}">
                <span>RE-UPLOAD</span>
                <span>→</span>
              </button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/** " · 4 TEAMS" when one line bought more than a single team entry. */
function teamCount(line: MyEventEntry['line']): string {
  const teams = line.quantity ?? 1;
  return teams > 1 ? ' · ' + teams + ' TEAMS' : '';
}

function confirmedGroup(entries: MyEventEntry[]): string {
  if (!entries.length) return '';
  return `
    <div class="myevents-group">
      <div class="myevents-group-heading">CONFIRMED</div>
      <div class="myevents-rail">
        ${entries
          .map(entry => {
            const dateRow = entry.event.date
              ? `<div class="myevents-row-date">${entry.event.date}${entry.event.startTime ? ' · ' + entry.event.startTime : ''}</div>`
              : '';
            return `
          <div class="myevents-row myevents-row--clickable" data-open-event-id="${entry.event.id}">
            <div class="myevents-row-node myevents-row-node--confirmed"></div>
            <div class="myevents-row-body">
              <h3 class="myevents-row-title myevents-row-title--headline">${entry.event.name}</h3>
              ${dateRow}
              <div class="myevents-row-context">${eventContextLine(entry.event).toUpperCase()}${teamCount(entry.line)}</div>
              <span class="status-pill status-pill--confirmed">CONFIRMED</span>
            </div>
          </div>
        `;
          })
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Which line is one tap from being removed.
 *
 * Removing a registration frees a seat and changes what is owed, so it asks
 * twice. Kept per line rather than as a flag so tapping Remove on one row never
 * arms another.
 */
let confirmingLineId: string | null = null;

export function clearRemoveConfirmation(): void {
  confirmingLineId = null;
}

/** True when this line is armed and one more tap will remove it. */
export function removeArmedFor(lineId?: string): boolean {
  return Boolean(lineId) && confirmingLineId === lineId;
}

/**
 * An order nobody has paid for yet is still the delegate's to change; one with
 * a screenshot against it belongs to the verification queue. The server
 * enforces this too — the button only reflects it.
 */
function isUnpaid(entry: MyEventEntry): boolean {
  return registration.canEditOrder(entry.order);
}

function removeControl(entry: MyEventEntry): string {
  if (!isUnpaid(entry) || !entry.line.id) return '';
  const armed = confirmingLineId === entry.line.id;
  return `
    <div class="myevents-remove-row">
      <button class="myevents-remove-btn ${armed ? 'is-armed' : ''}"
              data-remove-line="${entry.line.id}"
              aria-label="Remove ${escapeHtml(entry.event.name)} from this order">
        ${armed ? 'TAP AGAIN TO REMOVE' : 'REMOVE'}
      </button>
      ${
        armed
          ? `<button class="myevents-remove-cancel" data-cancel-remove="1">KEEP IT</button>`
          : ''
      }
    </div>
    ${
      armed
        ? `<p class="myevents-remove-note">
             This frees the place and recalculates what you owe. You can register
             it again, or take it as part of a combo.
           </p>`
        : ''
    }`;
}

function pendingGroup(entries: MyEventEntry[]): string {
  if (!entries.length) return '';
  return `
    <div class="myevents-group">
      <div class="myevents-group-heading">PENDING</div>
      <div class="myevents-rail">
        ${entries
          .map(
            entry => `
          <div class="myevents-row">
            <div class="myevents-row-node myevents-row-node--pending"></div>
            <div class="myevents-row-body">
              <h3 class="myevents-row-title myevents-row-title--headline">${entry.event.name}</h3>
              <p class="myevents-row-sub">${
                isUnpaid(entry)
                  ? 'Not paid yet — your place is held until you do.'
                  : 'Payment verification pending'
              }</p>
              <div class="myevents-row-context">ORDER ${entry.order.reference}${teamCount(entry.line)}</div>
              <button class="action-link-cyan myevents-inline-action" data-view-order-id="${entry.order.id}">
                <span>${isUnpaid(entry) ? 'PAY NOW' : 'VIEW ORDER'}</span>
                <span>→</span>
              </button>
              ${removeControl(entry)}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

export function renderMyEventsView(): string {
  const groups = registration.getMyEvents();
  const isEmpty = groups.confirmed.length === 0 && groups.pending.length === 0 && groups.actionRequired.length === 0;
  const cartCount = registration.cartCount();

  return `
    <div class="screen-content">
      <!-- Header -->
      <header class="app-top-header">
        <div class="app-brand-block">
          <div class="app-brand-title">
            STRIATUM <span class="cyan-text">4.0</span>
          </div>
          <div class="app-brand-meta">
            IGMCRI · SIGMA 2026
          </div>
        </div>

        <div class="header-right-block">
          <button class="header-cart-btn ${cartCount ? 'has-items' : ''}" id="btn-myevents-cart" title="View cart">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.2"/>
              <circle cx="10" cy="20" r="1"/>
              <circle cx="18" cy="20" r="1"/>
            </svg>
            ${cartCount ? `<span class="cart-count-bead">${cartCount}</span>` : ''}
          </button>
        </div>
      </header>

      <!-- Hero -->
      <section class="explore-hero-section">
        <div class="section-index-label">
          <span class="cyan-num">04</span>
          <span class="slash">/</span>
          <span class="section-name">MY EVENTS</span>
        </div>

        <h1 class="explore-heading">
          Your registration<br />
          hub<span class="cyan-period">.</span>
        </h1>

        <p class="explore-subtitle">
          Everything you selected, what you paid, and its verification state.
        </p>

        ${delegateStatusLine()}
      </section>

      ${
        isEmpty
          ? `
        <div class="empty-search-state">
          <p>No registrations yet.</p>
          <button class="btn-chamfer-dark" id="btn-browse-events-empty" style="max-width: 220px; margin: 16px auto 0;">
            Explore Events →
          </button>
        </div>
      `
          : `
        <div class="myevents-groups-stack">
          ${actionRequiredGroup(groups.actionRequired)}
          ${confirmedGroup(groups.confirmed)}
          ${pendingGroup(groups.pending)}
        </div>
      `
      }
    </div>
  `;
}

/**
 * Wires the two-step Remove.
 *
 * Shared by both surfaces, because the desktop hub is a different rendering of
 * the same list and the behaviour must not drift between them.
 */
export function attachRemoveControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-remove-line]').forEach(button => {
    button.addEventListener('click', () => {
      const lineId = button.getAttribute('data-remove-line');
      if (!lineId) return;

      // First tap arms it, second does it.
      if (confirmingLineId !== lineId) {
        confirmingLineId = lineId;
        appStore.refresh();
        return;
      }

      button.disabled = true;
      const entry = registration
        .getMyEvents()
        .pending.find(candidate => candidate.line.id === lineId);
      if (!entry) {
        confirmingLineId = null;
        appStore.refresh();
        return;
      }

      void registration.removeRegistration(entry.line).then(result => {
        confirmingLineId = null;
        appStore.showToast(result.message);
        appStore.refresh();
      });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-cancel-remove]').forEach(button => {
    button.addEventListener('click', () => {
      confirmingLineId = null;
      appStore.refresh();
    });
  });
}

export function attachMyEventsEvents(): void {
  attachRemoveControls();
  const btnBrowse = document.getElementById('btn-browse-events-empty');
  if (btnBrowse) {
    btnBrowse.addEventListener('click', () => {
      appStore.setScreen('explore');
    });
  }

  const btnAvatar = document.getElementById('btn-myevents-avatar');
  if (btnAvatar) {
    btnAvatar.addEventListener('click', () => {
      appStore.setScreen('profile');
    });
  }

  const btnGetDelegate = document.getElementById('btn-myevents-get-delegate');
  if (btnGetDelegate) {
    btnGetDelegate.addEventListener('click', () => {
      appStore.setScreen('delegate-registration');
    });
  }

  document.querySelectorAll<HTMLElement>('[data-reupload-order-id]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const orderId = el.getAttribute('data-reupload-order-id');
      if (orderId) appStore.openPayment(orderId);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-view-order-id]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const orderId = el.getAttribute('data-view-order-id');
      if (!orderId) return;
      const order = registration.getOrder(orderId);
      if (order && (order.status === 'under_review' || order.status === 'payment_submitted' || order.status === 'approved')) {
        appStore.openOrderConfirmation(orderId);
      } else {
        appStore.openPayment(orderId);
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(el => {
    el.addEventListener('click', () => {
      const eventId = el.getAttribute('data-open-event-id');
      if (eventId) appStore.openEvent(eventId);
    });
  });

  document.getElementById('btn-myevents-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });
}
