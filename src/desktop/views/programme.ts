import { appStore } from '../../state/appStore.ts';
import * as registration from '../../services/registrationService.ts';
import { EVENTS, allEventDates, eventContextLine, getEvent } from '../../data/events.ts';
import type { SymposiumEvent } from '../../data/eventTypes.ts';
import { eyebrow } from '../shell.ts';
import { minutesOf } from '../../services/time.ts';

/**
 * Desktop programme.
 *
 * The phone can only show one event after another, so two workshops running at
 * the same hour look like a list. Here the day is a real time grid: hours down
 * the side, concurrent sessions side by side. A clash is something you see
 * rather than something you have to be told about.
 */

const PX_PER_HOUR = 76;
/**
 * An event whose end time the brochure does not publish is drawn as a
 * fixed-height chip rather than a block, so its height never implies a duration
 * nobody has confirmed. Lane packing reserves exactly the chip's own extent —
 * the same space it occupies on screen — so chips and blocks cannot collide.
 */
const CHIP_HEIGHT = 96;
const CHIP_MINUTES = (CHIP_HEIGHT / PX_PER_HOUR) * 60;

function hourLabel(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  return h + ':00 ' + (hour < 12 ? 'AM' : 'PM');
}

interface Placed {
  event: SymposiumEvent;
  start: number;
  end: number;
  /** True when only a start time is published. */
  openEnded: boolean;
  lane: number;
}

/**
 * Greedy lane packing: an event takes the first lane whose last session has
 * already finished. Overlapping sessions therefore always land side by side.
 */
function packDay(events: SymposiumEvent[]): { placed: Placed[]; lanes: number } {
  const timed = events
    .map(event => {
      const start = minutesOf(event.startTime);
      if (start === null) return null;
      const declaredEnd = minutesOf(event.endTime);
      return {
        event,
        start,
        end: declaredEnd !== null && declaredEnd > start ? declaredEnd : start + CHIP_MINUTES,
        openEnded: declaredEnd === null || declaredEnd <= start,
        lane: 0
      } as Placed;
    })
    .filter((entry): entry is Placed => entry !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const laneEnds: number[] = [];
  timed.forEach(entry => {
    let lane = laneEnds.findIndex(end => end <= entry.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.end);
    } else {
      laneEnds[lane] = entry.end;
    }
    entry.lane = lane;
  });

  return { placed: timed, lanes: Math.max(1, laneEnds.length) };
}

function nowNext(days: { iso: string; display: string }[]): string {
  if (!days.length) return '';
  const todayIso = new Date().toISOString().slice(0, 10);
  const first = days[0];
  const last = days[days.length - 1];

  if (todayIso < first.iso) {
    return `<p class="d-nownext">SYMPOSIUM BEGINS &middot; ${first.display.toUpperCase()}</p>`;
  }
  if (todayIso > last.iso) return '';

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = EVENTS.filter(event => event.isoDate && event.startTime)
    .filter(event => {
      if (event.isoDate! > todayIso) return true;
      if (event.isoDate! === todayIso) {
        const start = minutesOf(event.startTime);
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
  return `<p class="d-nownext">NEXT &middot; ${next.name.toUpperCase()} &middot; ${(next.date ?? '').toUpperCase()} &middot; ${next.startTime}</p>`;
}

function renderGrid(iso: string, committed: Set<string>): string {
  const dayEvents = EVENTS.filter(event => event.isoDate === iso);
  if (!dayEvents.length) {
    return '<div class="d-empty"><p>No events published for this day yet.</p></div>';
  }

  const { placed, lanes } = packDay(dayEvents);
  const untimed = dayEvents.filter(event => minutesOf(event.startTime) === null);

  if (!placed.length) {
    return `
      <div class="d-column-rail" style="padding-top: 10px;">
        ${untimed.map(event => untimedRow(event, committed)).join('')}
      </div>`;
  }

  const firstHour = Math.floor(Math.min(...placed.map(p => p.start)) / 60);
  const lastHour = Math.ceil(Math.max(...placed.map(p => p.end)) / 60);
  const hours: number[] = [];
  for (let hour = firstHour; hour <= lastHour; hour += 1) hours.push(hour);

  const top = (minutes: number) => ((minutes - firstHour * 60) / 60) * PX_PER_HOUR;
  const gridHeight = (lastHour - firstHour) * PX_PER_HOUR + 24;

  return `
    <div class="d-timegrid d-pad">
      <div class="d-hours">
        ${hours
          .map(hour => `<div class="d-hour" style="height: ${PX_PER_HOUR}px;"><span>${hourLabel(hour)}</span></div>`)
          .join('')}
      </div>

      <div class="d-lanes">
        ${hours
          .map(
            (_, index) =>
              `<div class="d-hourline ${index % 2 === 0 ? 'is-major' : ''}" style="top: ${26 + index * PX_PER_HOUR}px;"></div>`
          )
          .join('')}

        <div class="d-lane-grid" style="grid-template-columns: repeat(${lanes}, minmax(0, 1fr)); height: ${gridHeight}px;">
          ${Array.from({ length: lanes }, (_, lane) => `<div class="d-lane" style="grid-column: ${lane + 1};">
            ${placed
              .filter(entry => entry.lane === lane)
              .map(entry => {
                const yours = committed.has(entry.event.id);
                // A published end time sizes its block; an unpublished one gets
                // the chip height, which stands for nothing but itself.
                const height = entry.openEnded
                  ? CHIP_HEIGHT
                  : Math.max(74, top(entry.end) - top(entry.start) - 8);
                const time = entry.openEnded
                  ? `FROM ${entry.event.startTime ?? ''}`
                  : `${entry.event.startTime} – ${entry.event.endTime}`;
                return `
                <button class="d-session ${yours ? 'is-yours' : ''} ${entry.openEnded ? 'd-session--chip' : ''}"
                        data-open-event-id="${entry.event.id}"
                        title="${entry.openEnded ? 'End time not yet published' : ''}"
                        style="top: ${top(entry.start)}px; height: ${height}px;">
                  <span class="d-session-top">
                    <span class="d-session-code">${entry.event.code}</span>
                    ${yours ? '<span class="d-yours-flag">YOURS</span>' : ''}
                  </span>
                  <span class="d-session-title">${entry.event.name}</span>
                  <span class="d-session-time">${time}</span>
                  <span class="d-session-venue">${entry.event.venue ?? eventContextLine(entry.event)}</span>
                </button>`;
              })
              .join('')}
          </div>`).join('')}
        </div>
      </div>
    </div>

    ${
      untimed.length
        ? `<div class="d-pad" style="padding-bottom: 22px;">
            <div class="d-column-head" style="max-width: 520px;">
              <span class="d-column-dot"></span>
              <span class="d-column-title">TIME NOT YET PUBLISHED</span>
              <span class="d-column-count">${untimed.length}</span>
            </div>
            <div class="d-column-rail" style="max-width: 520px; margin-top: 14px;">
              ${untimed.map(event => untimedRow(event, committed)).join('')}
            </div>
          </div>`
        : ''
    }`;
}

function untimedRow(event: SymposiumEvent, committed: Set<string>): string {
  return `
    <div class="d-row is-clickable" data-open-event-id="${event.id}">
      <span class="d-row-title">${event.name}</span>
      ${
        // A reporting time is worth showing, but only under its own label —
        // this group exists precisely because no start time is published.
        event.reportingTime
          ? `<span class="d-row-when">REPORT ${event.reportingTime}</span>`
          : ''
      }
      <span class="d-row-meta">${eventContextLine(event).toUpperCase()}</span>
      ${committed.has(event.id) ? '<div class="d-row-foot"><span class="d-state">YOURS</span></div>' : ''}
    </div>`;
}

function dayCountWord(count: number): string {
  const words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  return (words[count] ?? String(count)) + ' day' + (count === 1 ? '' : 's');
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function renderDesktopProgramme(): string {
  const state = appStore.getState();
  const days = allEventDates();
  const activeIso = state.selectedProgrammeDate ?? days[0]?.iso ?? null;
  const committed = new Set(registration.committedEventIds());
  const conflicts = registration.findScheduleConflicts(registration.committedEventIds());
  const unpublished = EVENTS.filter(event => !event.isoDate).length;

  return `
    <div class="d-page">
      <header class="d-prog-head d-pad">
        <div style="display: flex; flex-direction: column; gap: 13px;">
          ${eyebrow('03', 'PROGRAMME')}
          <h1 class="d-display">${dayCountWord(days.length)}<span class="d-dot">.</span></h1>
          <p class="d-lede">What happens each day, when it starts, and what&rsquo;s yours.</p>
        </div>
        ${nowNext(days)}
      </header>

      ${
        days.length
          ? `
        <div class="d-daytabs d-pad" role="tablist" aria-label="Programme days">
          ${days
            .map(day => {
              const count = EVENTS.filter(event => event.isoDate === day.iso).length;
              const weekday = WEEKDAYS[new Date(day.iso + 'T00:00:00').getDay()] ?? '';
              const on = activeIso === day.iso;
              return `
                <button class="d-daytab ${on ? 'is-active' : ''}" data-d-programme-day="${day.iso}" role="tab" aria-selected="${on}">
                  <span class="d-daytab-wd">${weekday}</span>
                  <span class="d-daytab-date">${day.display}</span>
                  <span class="d-daytab-count">${count} EVENT${count === 1 ? '' : 'S'}</span>
                </button>`;
            })
            .join('')}
        </div>

        ${activeIso ? renderGrid(activeIso, committed) : ''}

        ${
          conflicts.length
            ? `<div class="d-conflict d-pad" style="margin-left: clamp(32px, 4vw, 64px); margin-right: clamp(32px, 4vw, 64px); padding-left: 22px; padding-right: 22px;">
                <span class="d-conflict-label">SCHEDULE CONFLICT</span>
                <div>${conflicts.map(conflict => `<p>${conflict.message}</p>`).join('')}</div>
              </div>`
            : ''
        }
      `
          : '<div class="d-empty"><p>No event dates have been published yet.</p></div>'
      }

      ${
        unpublished > 0
          ? `<p class="d-footnote d-pad">${unpublished} event${unpublished === 1 ? '' : 's'} do${
              unpublished === 1 ? 'es' : ''
            } not yet have a published date or time and will appear here once organisers confirm ${
              unpublished === 1 ? 'it' : 'them'
            }.</p>`
          : ''
      }
    </div>`;
}

export function attachDesktopProgramme(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-d-programme-day]').forEach(button => {
    button.addEventListener('click', () => {
      const iso = button.getAttribute('data-d-programme-day');
      if (iso) appStore.setSelectedProgrammeDate(iso);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(element => {
    element.addEventListener('click', () => {
      const id = element.getAttribute('data-open-event-id');
      if (id && getEvent(id)) appStore.openEvent(id);
    });
  });
}
