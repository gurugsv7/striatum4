import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { escapeHtml } from '../services/text.ts';

let selectedEvent: string | null = null;

function eventNames(): string[] {
  const names = new Set<string>();
  for (const order of registration.listAllOrdersForAdmin()) {
    for (const line of order.lines) names.add(line.eventName);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function renderEventCard(name: string, rows: registration.RosterEntry[]): string {
  const count = rows.length;
  const confirmed = rows.filter(r => r.orderStatus === 'approved').length;
  return `<button class="admin-panel admin-event-card" data-registration-event="${escapeHtml(name)}">
    <div class="hud-corner-tl"></div><div class="hud-corner-br"></div>
    <div class="admin-panel-top-row"><span class="admin-panel-name">${escapeHtml(name)}</span><span class="event-badge-pill">OPEN →</span></div>
    <div class="admin-event-card-count">${count} registration${count === 1 ? '' : 's'}</div>
    <div class="admin-event-card-meta">${confirmed} confirmed · ${count - confirmed} pending review</div>
  </button>`;
}

function renderParticipantRow(row: registration.RosterEntry): string {
  return `<div class="admin-panel admin-registration-row">
    <div class="admin-panel-top-row"><span class="admin-panel-name">${escapeHtml(row.delegateName)}</span><span class="event-badge-pill">${escapeHtml(registration.orderStatusLabel(row.orderStatus))}</span></div>
    <div class="admin-ledger">
      <div class="admin-ledger-row"><span class="admin-ledger-key">INSTITUTION</span><span class="admin-ledger-val">${escapeHtml(row.institution || '—')}</span></div>
      <div class="admin-ledger-row"><span class="admin-ledger-key">YEAR</span><span class="admin-ledger-val">${escapeHtml(row.yearOfStudy || '—')}</span></div>
      <div class="admin-ledger-row"><span class="admin-ledger-key">PHONE</span><span class="admin-ledger-val">${escapeHtml(row.phone || '—')}</span></div>
      <div class="admin-ledger-row"><span class="admin-ledger-key">EMAIL</span><span class="admin-ledger-val">${escapeHtml(row.email || '—')}</span></div>
      <div class="admin-ledger-row"><span class="admin-ledger-key">ORDER</span><span class="admin-ledger-val">${escapeHtml(row.orderReference)}</span></div>
    </div>
  </div>`;
}

export function renderAdminRegistrationsView(): string {
  if (!registration.isAdmin()) return '<div class="screen-content"><p class="admin-footnote">Organisers only.</p></div>';
  const roster = registration.getRegistrationRoster();
  const names = eventNames();
  if (selectedEvent && !names.includes(selectedEvent)) selectedEvent = null;
  const rows = selectedEvent ? roster.filter(row => row.events.includes(selectedEvent!)) : [];
  return `<div class="screen-content no-bottom-nav">
    <header class="details-top-header"><button class="btn-back-nav" id="btn-admin-registrations-back"><span>‹</span><span class="back-nav-label">ADMIN</span></button></header>
    <section class="explore-hero-section"><div class="section-index-label"><span class="cyan-num">06</span><span class="slash">/</span><span class="section-name">REGISTRATION CONTROL</span></div><h1 class="explore-heading">Event registrations<span class="cyan-period">.</span></h1><p class="explore-subtitle">Select an event to see everyone registered for it.</p></section>
    ${selectedEvent ? `<section class="admin-section"><button class="action-link-cyan" id="btn-registration-events">← ALL EVENTS</button><div class="section-index-label"><span class="cyan-num">A</span><span class="slash">/</span><span class="section-name">${escapeHtml(selectedEvent)}</span></div>${rows.length ? rows.map(renderParticipantRow).join('') : '<div class="empty-search-state">No registrations for this event yet.</div>'}</section>` : `<section class="admin-section"><div class="section-index-label"><span class="cyan-num">A</span><span class="slash">/</span><span class="section-name">EVENT DIRECTORY</span></div>${names.length ? names.map(name => renderEventCard(name, roster.filter(row => row.events.includes(name)))).join('') : '<div class="empty-search-state">No registrations yet.</div>'}</section>`}
  </div>`;
}

export function attachAdminRegistrationsEvents(): void {
  document.getElementById('btn-admin-registrations-back')?.addEventListener('click', () => appStore.setScreen('admin'));
  document.getElementById('btn-registration-events')?.addEventListener('click', () => { selectedEvent = null; appStore.refresh(); });
  document.querySelectorAll<HTMLElement>('[data-registration-event]').forEach(card => card.addEventListener('click', () => { selectedEvent = card.dataset.registrationEvent ?? null; appStore.refresh(); }));
}
