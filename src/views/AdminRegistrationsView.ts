import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { escapeHtml } from '../services/text.ts';

let selectedEvent: string | null = null;
let eventSearch = '';

function eventNames(): string[] {
  const names = new Set<string>();
  for (const order of registration.listAllOrdersForAdmin()) {
    for (const line of order.lines) names.add(line.eventName);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function renderEventCard(name: string, rows: registration.RosterEntry[], index: number): string {
  const count = rows.length;
  const confirmed = rows.filter(r => r.orderStatus === 'approved').length;
  return `<div class="explore-event-entry admin-registration-entry" data-registration-event="${escapeHtml(name)}" role="button" tabindex="0" aria-label="Open ${escapeHtml(name)} registrations">
    <div class="explore-timeline-bead"></div>
    <div class="event-card admin-registration-event-card">
      <div class="event-card-art-bg bg-variant-${(index % 4) + 1}" aria-hidden="true"></div>
      <div class="event-card-reef-bg"></div>
      <div class="event-card-top-row"><span class="event-card-code">EVENT DIRECTORY</span><span class="event-badge-pill">OPEN →</span></div>
      <h3 class="event-card-title is-brand">${escapeHtml(name)}</h3>
      <p class="event-card-context">Registered participants and team details</p>
      <div class="event-card-facts"><span class="fact-schedule">${count} registration${count === 1 ? '' : 's'}</span><span class="fact-commercial">${confirmed} confirmed · ${count - confirmed} pending review</span></div>
      <div class="event-card-footer"><div class="event-card-tag-row"><span class="card-specialty-tag">READ ONLY</span><span class="card-specialty-tag">ROSTER</span></div><span class="btn-view-event"><span class="circle-arrow-icon">→</span><span>VIEW ROSTER</span></span></div>
    </div>
  </div>`;
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
  const visibleNames = names.filter(name => name.toLowerCase().includes(eventSearch.trim().toLowerCase()));
  if (selectedEvent && !names.includes(selectedEvent)) selectedEvent = null;
  const rows = selectedEvent ? roster.filter(row => row.events.includes(selectedEvent!)) : [];
  return `<div class="screen-content no-bottom-nav admin-registrations-screen">
    <header class="details-top-header"><button class="btn-back-nav" id="btn-admin-registrations-back"><span>‹</span><span class="back-nav-label">ADMIN</span></button></header>
    <section class="explore-hero-section"><div class="section-index-label"><span class="cyan-num">06</span><span class="slash">/</span><span class="section-name">REGISTRATION CONTROL</span></div><h1 class="explore-heading">Event registrations<span class="cyan-period">.</span></h1><p class="explore-subtitle">Select an event to see everyone registered for it.</p></section>
    ${selectedEvent ? `<section class="admin-section"><button class="action-link-cyan" id="btn-registration-events">← ALL EVENTS</button><div class="section-index-label"><span class="cyan-num">A</span><span class="slash">/</span><span class="section-name">${escapeHtml(selectedEvent)}</span></div>${rows.length ? rows.map(renderParticipantRow).join('') : '<div class="empty-search-state">No registrations for this event yet.</div>'}</section>` : `<section class="admin-section"><div class="section-index-label"><span class="cyan-num">A</span><span class="slash">/</span><span class="section-name">EVENT DIRECTORY</span></div><div class="search-filter-row admin-event-search-row"><div class="search-input-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" id="admin-event-search" class="search-input-box" placeholder="Search events..." value="${escapeHtml(eventSearch)}" autocomplete="off" spellcheck="false" />${eventSearch ? '<button id="btn-clear-admin-event-search" class="clear-search-btn" title="Clear search">✕</button>' : ''}</div></div><div class="explore-result-meta"><span>${visibleNames.length} ${visibleNames.length === 1 ? 'EVENT' : 'EVENTS'}</span></div><div class="explore-cards-timeline"><div class="explore-timeline-rail"></div>${visibleNames.length ? visibleNames.map((name, index) => renderEventCard(name, roster.filter(row => row.events.includes(name)), index)).join('') : '<div class="empty-search-state">No events match this search.</div>'}</div></section>`}
  </div>`;
}

export function attachAdminRegistrationsEvents(): void {
  document.getElementById('btn-admin-registrations-back')?.addEventListener('click', () => appStore.setScreen('admin'));
  document.getElementById('btn-registration-events')?.addEventListener('click', () => { selectedEvent = null; appStore.refresh(); });
  document.getElementById('admin-event-search')?.addEventListener('input', event => {
    eventSearch = (event.target as HTMLInputElement).value;
    appStore.refresh();
    requestAnimationFrame(() => {
      const input = document.getElementById('admin-event-search') as HTMLInputElement | null;
      input?.focus();
      input?.setSelectionRange(eventSearch.length, eventSearch.length);
    });
  });
  document.getElementById('btn-clear-admin-event-search')?.addEventListener('click', () => { eventSearch = ''; appStore.refresh(); });
  document.querySelectorAll<HTMLElement>('[data-registration-event]').forEach(card => {
    const open = () => { selectedEvent = card.dataset.registrationEvent ?? null; appStore.refresh(); };
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
}
