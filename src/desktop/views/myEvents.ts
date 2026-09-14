import { appStore } from '../../state/appStore.ts';
import * as registration from '../../services/registrationService.ts';
import type { MyEventEntry, Order } from '../../services/registrationService.ts';
import { eventContextLine } from '../../data/events.ts';
import { eyebrow, esc } from '../shell.ts';

/**
 * Desktop my-events.
 *
 * The phone stacks three status groups, so "what needs my attention" can be
 * three screens below "what is confirmed". Across 1440px they sit side by side
 * as one board, and the delegate credential moves up beside the heading.
 */

function column(
  heading: string,
  tone: '' | 'is-warn' | 'is-muted',
  count: number,
  rows: string,
  empty: string
): string {
  return `
    <section class="d-column ${tone}">
      <div class="d-column-head">
        <span class="d-column-dot"></span>
        <h2 class="d-column-title">${heading}</h2>
        <span class="d-column-count">${count}</span>
      </div>
      ${count ? `<div class="d-column-rail">${rows}</div>` : `<p class="d-column-empty">${empty}</p>`}
    </section>`;
}

/** See orderContents in the mobile view: a reference alone names nothing. */
function orderContents(order: Order): string {
  const names = order.lines.map(line => line.eventName);
  if (!names.length) return 'Order ' + order.reference;
  if (names.length <= 2) return names.join(' + ');
  return names[0] + ' + ' + (names.length - 1) + ' more';
}

function actionRow(order: Order): string {
  return `
    <div class="d-row">
      <span class="d-row-title">${orderContents(order)}</span>
      <p class="d-row-meta">${order.reference} &middot; ${order.rejectionReason ?? 'Payment proof needs resubmission'}</p>
      <div class="d-row-foot">
        <span class="d-state is-warn">ACTION REQUIRED</span>
        <button class="d-row-action" data-reupload-order-id="${order.id}">RE-UPLOAD &rarr;</button>
      </div>
    </div>`;
}

/** " · 4 TEAMS" when one line bought more than a single team entry. */
function teamCount(line: MyEventEntry['line']): string {
  const teams = line.quantity ?? 1;
  return teams > 1 ? ' · ' + teams + ' TEAMS' : '';
}

function confirmedRow(entry: MyEventEntry): string {
  const when = entry.event.date
    ? `<span class="d-row-when">${entry.event.date}${entry.event.startTime ? ' · ' + entry.event.startTime : ''}</span>`
    : '';
  return `
    <div class="d-row is-clickable" data-open-event-id="${entry.event.id}">
      <h3 class="d-row-title">${entry.event.name}</h3>
      ${when}
      <span class="d-row-meta">${eventContextLine(entry.event).toUpperCase()}${teamCount(entry.line)}</span>
      <div class="d-row-foot"><span class="d-state">CONFIRMED</span></div>
    </div>`;
}

function pendingRow(entry: MyEventEntry): string {
  return `
    <div class="d-row">
      <h3 class="d-row-title">${entry.event.name}</h3>
      <p class="d-row-meta">Payment verification pending</p>
      <span class="d-row-meta">ORDER ${entry.order.reference}${teamCount(entry.line)}</span>
      <div class="d-row-foot">
        <span class="d-state is-muted">AWAITING VERIFICATION</span>
        <button class="d-row-action" data-view-order-id="${entry.order.id}">VIEW ORDER &rarr;</button>
      </div>
    </div>`;
}

function credential(): string {
  const status = registration.getDelegateStatus();
  const delegate = registration.getDelegate();

  if (status === 'none') {
    return `
      <div class="d-idcard d-hud">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span class="d-hud-label">DELEGATE ID</span>
          <span class="d-hud-value">NOT ISSUED</span>
        </div>
        <span class="d-idcard-rule"></span>
        <button class="d-link" id="btn-myevents-get-delegate"><span>GET DELEGATE ID</span><span>&rarr;</span></button>
      </div>`;
  }

  const label =
    status === 'approved'
      ? esc(delegate?.delegateId ?? '')
      : status === 'pending'
      ? 'AWAITING VERIFICATION'
      : status === 'rejected'
      ? 'NEEDS ATTENTION'
      : 'REVOKED';

  return `
    <div class="d-idcard d-hud">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span class="d-hud-label">DELEGATE ID</span>
        <span class="d-hud-id-code" style="font-size: 18px; letter-spacing: 2.6px;">${label}</span>
      </div>
      <span class="d-idcard-rule"></span>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span class="d-hud-label">STATUS</span>
        <span class="d-hud-value ${status === 'approved' ? 'is-live' : ''}" style="font-size: 11px;">
          ${status === 'approved' ? 'VERIFIED' : status.toUpperCase()}
        </span>
      </div>
    </div>`;
}

export function renderDesktopMyEvents(): string {
  const groups = registration.getMyEvents();
  const empty =
    groups.confirmed.length === 0 && groups.pending.length === 0 && groups.actionRequired.length === 0;

  return `
    <div class="d-page">
      <header class="d-mine-head d-pad">
        <div style="display: flex; flex-direction: column; gap: 13px;">
          ${eyebrow('04', 'MY EVENTS')}
          <h1 class="d-display">Your registration hub<span class="d-dot">.</span></h1>
          <p class="d-lede">Everything you selected, what you paid, and its verification state.</p>
        </div>
        ${credential()}
      </header>

      ${
        empty
          ? `<div class="d-empty" style="padding-top: 90px;">
              <p>No registrations yet.</p>
              <small>Anything you register for will appear here with its verification state.</small>
              <button class="d-link" id="btn-browse-events-empty" style="margin-top: 14px;">
                <span>EXPLORE EVENTS</span><span>&rarr;</span>
              </button>
            </div>`
          : `<div class="d-board d-pad">
              ${column(
                'ACTION REQUIRED',
                'is-warn',
                groups.actionRequired.length,
                groups.actionRequired.map(actionRow).join(''),
                'Nothing needs your attention.'
              )}
              ${column(
                'CONFIRMED',
                '',
                groups.confirmed.length,
                groups.confirmed.map(confirmedRow).join(''),
                'No confirmed registrations yet.'
              )}
              ${column(
                'PENDING',
                'is-muted',
                groups.pending.length,
                groups.pending.map(pendingRow).join(''),
                'Nothing awaiting verification.'
              )}
            </div>`
      }
    </div>`;
}

export function attachDesktopMyEvents(): void {
  document.getElementById('btn-browse-events-empty')?.addEventListener('click', () => {
    appStore.setScreen('explore');
  });

  document.getElementById('btn-myevents-get-delegate')?.addEventListener('click', () => {
    appStore.setScreen('delegate-registration');
  });

  document.querySelectorAll<HTMLElement>('[data-reupload-order-id]').forEach(element => {
    element.addEventListener('click', event => {
      event.stopPropagation();
      const orderId = element.getAttribute('data-reupload-order-id');
      if (orderId) appStore.openPayment(orderId);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-view-order-id]').forEach(element => {
    element.addEventListener('click', event => {
      event.stopPropagation();
      const orderId = element.getAttribute('data-view-order-id');
      if (!orderId) return;
      const order = registration.getOrder(orderId);
      if (order && (order.status === 'under_review' || order.status === 'payment_submitted' || order.status === 'approved')) {
        appStore.openOrderConfirmation(orderId);
      } else {
        appStore.openPayment(orderId);
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(element => {
    element.addEventListener('click', () => {
      const id = element.getAttribute('data-open-event-id');
      if (id) appStore.openEvent(id);
    });
  });
}
