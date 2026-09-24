import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { signOut } from '../services/authService.ts';
import { escapeHtml } from '../services/text.ts';

let selectedEventId: string | null = null;
let attendeeSearch = '';
let categoryFilter = 'ALL';
let eventSearch = '';

/** The non-finance organiser's view of the current website catalogue. */
export function renderEventAdminView(): string {
  const events = registration.listCurrentAdminEvents();
  const rows = registration.listEventAdminRegistrations();
  const categories = [...new Set(events.map(event => event.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const eventQuery = eventSearch.trim().toLowerCase();
  const categoryEvents = categoryFilter === 'ALL' ? events : events.filter(event => event.category === categoryFilter);
  const visibleEvents = eventQuery ? categoryEvents.filter(event => [event.name, event.code, event.category].some(value => value && value.toLowerCase().includes(eventQuery))) : categoryEvents;
  const selected = visibleEvents.find(event => event.id === selectedEventId) ?? visibleEvents[0];
  const attendees = selected ? rows.filter(row => row.eventId === selected.id) : [];
  const query = attendeeSearch.trim().toLowerCase();
  const visibleAttendees = query ? attendees.filter(person =>
    [person.attendeeName, person.attendeeEmail, person.orderReference, person.attendeeCollege]
      .some(value => value.toLowerCase().includes(query))
  ) : attendees;

  return `
    <div class="screen-content no-bottom-nav">
      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-event-admin-back"><span class="back-nav-label">${registration.isFinanceAdmin() ? 'FINANCE' : 'PROFILE'}</span></button>
        <button class="action-link-cyan" id="btn-event-admin-signout">SIGN OUT</button>
      </header>
      <section class="explore-hero-section">
        <div class="section-index-label"><span class="cyan-num">05</span><span class="slash">/</span><span class="section-name">EVENT ADMIN</span></div>
        <h1 class="explore-heading">Event registrations<span class="cyan-period">.</span></h1>
        <p class="explore-subtitle">Current STRIATUM 4.0 events and their attendees.</p>
      </section>
      <section class="admin-section">
        <div class="section-index-label"><span class="cyan-num">A</span><span class="slash">/</span><span class="section-name">CURRENT EVENTS · 2026</span></div>
        <div class="input-control-box event-admin-event-search"><input id="event-admin-event-search" class="text-input-field" type="search" placeholder="Search event name, code or category" value="${escapeHtml(eventSearch)}" autocomplete="off" /></div>
        <div class="admin-toggle-row event-admin-category-filters">
          ${['ALL', ...categories].map(category => `<button class="filter-chip-btn ${categoryFilter === category ? 'active' : ''}" data-event-admin-category="${escapeHtml(category)}">
            ${categoryFilter === category ? '<span class="chip-glow-dot"></span>' : ''}<span>${escapeHtml(category)}</span>
          </button>`).join('')}
        </div>
        <div class="event-admin-event-list">
          ${visibleEvents.map(event => {
            const count = rows.filter(row => row.eventId === event.id).length;
            return `<button class="admin-demand-row event-admin-event ${event.id === selected?.id ? 'event-admin-event--active' : ''}"
                data-event-admin-id="${escapeHtml(event.id)}" aria-pressed="${event.id === selected?.id}">
              <span class="admin-demand-name">${escapeHtml(event.name)} <small>${escapeHtml(event.code)} · ${escapeHtml(event.isoDate ?? 'Date pending')}</small></span>
              <span class="admin-demand-figs">${count} attendee${count === 1 ? '' : 's'}</span>
            </button>`;
          }).join('') || '<p class="empty-search-state">No current events are available.</p>'}
        </div>
      </section>
      ${selected ? `<section class="admin-section">
        <div class="section-index-label"><span class="cyan-num">B</span><span class="slash">/</span><span class="section-name">${escapeHtml(selected.name)} · ATTENDEES</span></div>
        <p class="explore-subtitle">${attendees.filter(person => person.orderStatus === 'approved').length} confirmed · ${attendees.length} total · ${registration.getCapacity(selected.id).available ?? 'Uncapped'} places available</p>
        <div class="input-control-box"><input id="event-admin-search" class="text-input-field" type="search" placeholder="Search attendee, email, college or order" value="${escapeHtml(attendeeSearch)}" /></div>
        ${visibleAttendees.map(person => `<div class="admin-panel">
          <div class="admin-panel-top-row"><span class="admin-panel-name">${escapeHtml(person.attendeeName)}</span><span class="event-badge-pill">${escapeHtml(person.orderStatus.replace(/_/g, ' ').toUpperCase())}</span></div>
          <div class="admin-ledger">
            <div class="admin-ledger-row"><span class="admin-ledger-key">EMAIL</span><span class="admin-ledger-val">${escapeHtml(person.attendeeEmail || '—')}</span></div>
            <div class="admin-ledger-row"><span class="admin-ledger-key">PHONE</span><span class="admin-ledger-val">${escapeHtml(person.attendeePhone || '—')}</span></div>
            <div class="admin-ledger-row"><span class="admin-ledger-key">COLLEGE</span><span class="admin-ledger-val">${escapeHtml(person.attendeeCollege || '—')}</span></div>
            <div class="admin-ledger-row"><span class="admin-ledger-key">YEAR</span><span class="admin-ledger-val">${escapeHtml(person.attendeeYear || '—')}</span></div>
            <div class="admin-ledger-row"><span class="admin-ledger-key">ORDER</span><span class="admin-ledger-val">${escapeHtml(person.orderReference)}</span></div>
            ${person.lunchChoice ? `<div class="admin-ledger-row"><span class="admin-ledger-key">MEAL</span><span class="admin-ledger-val">${escapeHtml(person.lunchChoice)}</span></div>` : ''}
          </div>
        </div>`).join('') || `<p class="empty-search-state">${attendees.length ? 'No attendees match this search.' : 'No registrations for this event yet.'}</p>`}
      </section>` : ''}
    </div>`;
}

export function attachEventAdminEvents(): void {
  document.getElementById('btn-event-admin-back')?.addEventListener('click', () => appStore.setScreen(registration.isFinanceAdmin() ? 'admin' : 'profile'));
  document.getElementById('btn-event-admin-signout')?.addEventListener('click', async () => {
    await signOut();
    registration.forgetLocalState();
    appStore.signOut();
    appStore.setScreen('onboarding');
  });
  document.getElementById('event-admin-event-search')?.addEventListener('input', event => {
    eventSearch = (event.target as HTMLInputElement).value;
    selectedEventId = null;
    appStore.refresh();
    requestAnimationFrame(() => {
      const input = document.getElementById('event-admin-event-search') as HTMLInputElement | null;
      input?.focus();
      input?.setSelectionRange(eventSearch.length, eventSearch.length);
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-event-admin-category]').forEach(button => {
    button.addEventListener('click', () => {
      categoryFilter = button.dataset.eventAdminCategory ?? 'ALL';
      selectedEventId = null;
      attendeeSearch = '';
      appStore.refresh();
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-event-admin-id]').forEach(button => {
    button.addEventListener('click', () => {
      selectedEventId = button.dataset.eventAdminId ?? null;
      attendeeSearch = '';
      appStore.refresh();
      requestAnimationFrame(() => {
        document.getElementById('event-admin-attendees')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
  document.getElementById('event-admin-search')?.addEventListener('input', event => {
    attendeeSearch = (event.target as HTMLInputElement).value;
    appStore.refresh();
  });
}
