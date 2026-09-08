import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { EVENTS, allEventDates, eventContextLine, getEvent } from '../data/events.ts';
import type { SymposiumEvent } from '../data/eventTypes.ts';

function minutesOf(time?: string): number | null {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10) % 12;
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  if (/pm/i.test(match[3])) hours += 12;
  return hours * 60 + mins;
}

/** Quiet "now / next" line — never fabricated, derived only from real dates. */
function nowNextLine(days: { iso: string; display: string }[]): string {
  if (!days.length) return '';
  const todayIso = new Date().toISOString().slice(0, 10);
  const first = days[0];
  const last = days[days.length - 1];

  if (todayIso < first.iso) {
    return `<div class="programme-nownext">SYMPOSIUM BEGINS · ${first.display.toUpperCase()}</div>`;
  }
  if (todayIso > last.iso) {
    return '';
  }

  // Within the symposium window — find the actual next event by date/time.
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = EVENTS.filter(e => e.isoDate && e.startTime)
    .filter(e => {
      if (e.isoDate! > todayIso) return true;
      if (e.isoDate! === todayIso) {
        const start = minutesOf(e.startTime);
        return start !== null && start >= nowMinutes;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.isoDate !== b.isoDate) return a.isoDate!.localeCompare(b.isoDate!);
      return (minutesOf(a.startTime) ?? 0) - (minutesOf(b.startTime) ?? 0);
    });

  const next = upcoming[0];
  if (!next) return '';
  return `<div class="programme-nownext">NEXT · ${next.name.toUpperCase()} · ${(next.date ?? '').toUpperCase()} · ${next.startTime}</div>`;
}

function dayTimeline(iso: string, committedIds: Set<string>): string {
  const dayEvents = EVENTS.filter(e => e.isoDate === iso).sort(
    (a, b) => (minutesOf(a.startTime) ?? 0) - (minutesOf(b.startTime) ?? 0)
  );

  if (!dayEvents.length) {
    return `<div class="empty-search-state">No events published for this day yet.</div>`;
  }

  return `
    <div class="programme-day-rail">
      ${dayEvents
        .map((event: SymposiumEvent) => {
          const isYours = committedIds.has(event.id);
          return `
        <div class="programme-entry ${isYours ? 'programme-entry--yours' : ''}" data-open-event-id="${event.id}">
          <div class="programme-entry-node ${isYours ? 'programme-entry-node--yours' : ''}"></div>
          <div class="programme-entry-time">${event.startTime ?? '—'}</div>
          <div class="programme-entry-body">
            <div class="programme-entry-title-row">
              <h3 class="programme-entry-title">${event.name}</h3>
              ${isYours ? '<span class="yours-marker">YOURS</span>' : ''}
            </div>
            <div class="programme-entry-context">${eventContextLine(event)}</div>
            ${event.venue ? `<div class="programme-entry-venue">${event.venue}</div>` : ''}
          </div>
        </div>
      `;
        })
        .join('')}
    </div>
  `;
}

function conflictBlock(): string {
  const committed = registration.committedEventIds();
  const conflicts = registration.findScheduleConflicts(committed);
  if (!conflicts.length) return '';
  return `
    <div class="programme-conflict-block">
      <div class="programme-conflict-heading">SCHEDULE CONFLICT</div>
      ${conflicts.map(c => `<p class="programme-conflict-line">${c.message}</p>`).join('')}
    </div>
  `;
}

/**
 * Heading for the day count. Derived from the dates the brochure actually
 * publishes — never a fixed number, since undated events join the programme as
 * organisers confirm them.
 */
function dayCountWord(count: number): string {
  const words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  const word = words[count] ?? String(count);
  return word + ' day' + (count === 1 ? '' : 's');
}

export function renderProgrammeView(): string {
  const state = appStore.getState();
  const days = allEventDates();
  const activeIso = state.selectedProgrammeDate ?? days[0]?.iso ?? null;
  const committedIds = new Set(registration.committedEventIds());
  const unpublishedCount = EVENTS.filter(e => !e.isoDate).length;

  return `
    <div class="screen-content no-bottom-nav">
      <!-- Header -->
      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-programme-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span>BACK</span>
        </button>
        <div class="details-brand-sig">
          <span class="sig-striatum">STRIATUM 4.0</span>
          <span class="sig-inst">IGMCRI · SIGMA 2026</span>
        </div>
      </header>

      <!-- Hero -->
      <section class="explore-hero-section">
        <div class="section-index-label">
          <span class="cyan-num">03</span>
          <span class="slash">/</span>
          <span class="section-name">PROGRAMME</span>
        </div>

        <h1 class="explore-heading">
          ${dayCountWord(days.length)}<span class="cyan-period">.</span>
        </h1>

        <p class="explore-subtitle">
          What happens each day, when it starts, and what's yours.
        </p>

        ${nowNextLine(days)}
      </section>

      ${
        days.length
          ? `
        <!-- Day Stepper -->
        <div class="schedule-stepper-wrap">
          <div class="stepper-nodes-row">
            <div class="stepper-connecting-line"></div>
            ${days
              .map(
                day => `
              <button class="stepper-node-item ${activeIso === day.iso ? 'active' : ''}" data-programme-day="${day.iso}">
                <span class="stepper-dot"></span>
                <span class="stepper-num">${day.display}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Day Timeline -->
        <div class="programme-timeline-wrap">
          ${activeIso ? dayTimeline(activeIso, committedIds) : ''}
        </div>

        ${conflictBlock()}
      `
          : `<div class="empty-search-state">No event dates have been published yet.</div>`
      }

      ${
        unpublishedCount > 0
          ? `<p class="programme-footnote">${unpublishedCount} event${unpublishedCount === 1 ? '' : 's'} do${unpublishedCount === 1 ? 'es' : ''} not yet have a published date or time and will appear here once organisers confirm ${unpublishedCount === 1 ? 'it' : 'them'}.</p>`
          : ''
      }
    </div>
  `;
}

export function attachProgrammeEvents(): void {
  const btnBack = document.getElementById('btn-programme-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      appStore.setScreen('home');
    });
  }

  document.querySelectorAll<HTMLButtonElement>('[data-programme-day]').forEach(btn => {
    btn.addEventListener('click', () => {
      const iso = btn.getAttribute('data-programme-day');
      if (iso) appStore.setSelectedProgrammeDate(iso);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(el => {
    el.addEventListener('click', () => {
      const eventId = el.getAttribute('data-open-event-id');
      if (eventId && getEvent(eventId)) appStore.openEvent(eventId);
    });
  });
}
