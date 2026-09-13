import { appStore } from '../../state/appStore.ts';
import { SymposiumEvent, EventSection, CATEGORY_LABELS } from '../../data/eventTypes.ts';
import { eventContextLine } from '../../data/events.ts';
import { resolvePrice, defaultParticipation, formatINR, Participation } from '../../services/pricing.ts';
import * as registration from '../../services/registrationService.ts';
import { isFullDayWorkshop, LunchChoice } from '../../services/workshop.ts';
import { icon, slotButton } from '../shell.ts';

/**
 * Desktop event detail.
 *
 * Everything that decides "do I register?" — fee, capacity, participation
 * shape, lunch, the Delegate Pass requirement and the button itself — moves
 * into a console that stays in view while the brochure detail scrolls beside
 * it. On the phone those are separated by a screen's worth of scrolling.
 */

/** Per-event choices made on this screen. Desktop keeps its own, as the
 *  mobile view does, and hands the result to the cart on add. */
const chosenParticipation: Record<string, Participation> = {};
const chosenLunch: Record<string, LunchChoice> = {};

function participationFor(event: SymposiumEvent): Participation {
  return chosenParticipation[event.id] ?? defaultParticipation(event);
}

function teamLabel(event: SymposiumEvent): string {
  if (!event.teamSize) return 'Team';
  const { min, max } = event.teamSize;
  const size = Math.max(min, 2);
  return size === max ? 'Team of ' + max : 'Team of ' + size + '–' + max;
}

function teamSizeCaption(event: SymposiumEvent): string | null {
  if (!event.teamSize) return null;
  const { min, max } = event.teamSize;
  if (min === max) return min === 1 ? 'Individual' : 'Team of ' + min;
  return 'Team of ' + min + '–' + max;
}

function renderFacts(event: SymposiumEvent): string {
  const price = resolvePrice(event, participationFor(event));
  const capacity = registration.getCapacity(event.id);
  const cells: { label: string; value: string; caption?: string }[] = [];

  if (event.date) {
    // A reporting time is not a start time. Where the brochure publishes only
    // the former, it is labelled rather than shown bare.
    cells.push({
      label: 'DATE',
      value: event.date,
      caption: event.startTime
        ? event.endTime
          ? event.startTime + ' – ' + event.endTime
          : event.startTime
        : event.reportingTime
        ? 'Report ' + event.reportingTime
        : undefined
    });
  }

  cells.push({
    label: 'FORMAT',
    value: event.format,
    caption: teamSizeCaption(event) ?? (event.participation === 'either' ? 'Individual or team' : undefined)
  });

  if (capacity.slots !== null) {
    cells.push({
      label: 'SLOTS',
      value: String(capacity.slots),
      caption: capacity.available === 0 ? 'Full' : capacity.available + ' available'
    });
  }

  if (event.venue) cells.push({ label: 'VENUE', value: event.venue });
  if (event.prizes?.totalValue) cells.push({ label: 'PRIZE POOL', value: formatINR(event.prizes.totalValue) });
  if (event.mode) cells.push({ label: 'MODE', value: event.mode.toUpperCase() });

  if (!cells.length) return '';

  return `
    <div class="d-facts">
      ${cells
        .slice(0, 5)
        .map(
          cell => `
        <div class="d-fact">
          <span class="d-fact-label">${cell.label}</span>
          <span class="d-fact-value">${cell.value}</span>
          ${cell.caption ? `<span class="d-fact-caption">${cell.caption}</span>` : ''}
        </div>`
        )
        .join('')}
    </div>`;
}

function renderDeadlines(event: SymposiumEvent): string {
  const rows: { label: string; value: string }[] = [];
  if (event.abstractDeadline) rows.push({ label: 'ABSTRACT DEADLINE', value: event.abstractDeadline });
  if (event.submissionDeadline) rows.push({ label: 'SUBMISSION DEADLINE', value: event.submissionDeadline });
  if (event.submissionEmail) rows.push({ label: 'SUBMIT TO', value: event.submissionEmail });
  if (!rows.length) return '';

  return `
    <dl class="d-deadlines">
      ${rows
        .map(row => `<div class="d-deadline"><dt>${row.label}</dt><dd>${row.value}</dd></div>`)
        .join('')}
    </dl>`;
}

function sectionBody(section: EventSection): string {
  const parts: string[] = [];
  if (section.body) parts.push(`<p class="d-prose" style="margin-top: 0;">${section.body}</p>`);
  if (section.facts?.length) {
    parts.push(`
      <dl class="d-factlist">
        ${section.facts
          .map(fact => `<div class="d-factlist-row"><dt>${fact.label}</dt><dd>${fact.value}</dd></div>`)
          .join('')}
      </dl>`);
  }
  if (section.items?.length) {
    parts.push(`<ul class="d-bullets">${section.items.map(item => `<li>${item}</li>`).join('')}</ul>`);
  }
  return parts.join('');
}

function renderSections(event: SymposiumEvent): string {
  const sections = event.sections ?? [];
  if (!sections.length) return '';

  return `
    <div>
      ${sections
        .map(
          (section, index) => `
        <div class="d-acc ${section.defaultOpen ? 'is-open' : ''}" id="d-acc-${index}">
          <button class="d-acc-trigger" data-d-acc="${index}" aria-expanded="${section.defaultOpen ? 'true' : 'false'}" aria-controls="d-acc-body-${index}">
            <span class="d-acc-title">
              <span class="d-acc-ring"></span>
              <span class="d-acc-label">${section.title}</span>
            </span>
            <span class="d-acc-chevron">${icon('chevron', 18, 2)}</span>
          </button>
          <div class="d-acc-body" id="d-acc-body-${index}" role="region">${sectionBody(section)}</div>
        </div>`
        )
        .join('')}
    </div>`;
}

function renderDelegateNotice(event: SymposiumEvent): string {
  const info = icon('info', 15, 2);

  switch (event.delegatePassRequirement) {
    case 'required': {
      const status = registration.getDelegateStatus();
      if (status === 'approved') {
        return `<div class="d-notice">${info}<p>Covered by your verified Delegate Pass.</p></div>`;
      }
      if (status === 'pending') {
        return `<div class="d-notice">${info}<p>Covered by your Delegate Pass &middot; verification in progress.</p></div>`;
      }
      const body =
        status === 'revoked'
          ? 'Your Delegate Pass has been revoked. Contact the organisers to restore access.'
          : status === 'rejected'
          ? 'Your delegate application needs attention before you can register for this event.'
          : 'A <a href="#delegate" id="d-need-delegate">Delegate Pass</a> is required for this event.';
      return `<div class="d-notice is-blocking">${info}<p>${body}</p></div>`;
    }
    case 'not_required':
      return `<div class="d-notice">${info}<p>No Delegate Pass required.</p></div>`;
    case 'not_required_for_submission':
      return `<div class="d-notice">${info}<p>A Delegate Pass is <strong>not required</strong> to submit an abstract.</p></div>`;
    default:
      return '';
  }
}

function renderParticipationChoice(event: SymposiumEvent): string {
  if (event.participation !== 'either') return '';
  const current = participationFor(event);
  const individual = resolvePrice(event, 'individual');
  const team = resolvePrice(event, 'team');

  return `
    <div class="d-choice">
      <span class="d-hud-label">PARTICIPATE AS</span>
      <div class="d-choice-options">
        <button class="d-choice-btn ${current === 'individual' ? 'is-on' : ''}" data-d-participation="individual">
          <strong>Individual</strong>
          ${individual.unspecified ? '' : `<small>${individual.display}</small>`}
        </button>
        <button class="d-choice-btn ${current === 'team' ? 'is-on' : ''}" data-d-participation="team">
          <strong>${teamLabel(event)}</strong>
          ${team.unspecified ? '' : `<small>${team.display}</small>`}
        </button>
      </div>
    </div>`;
}

function renderLunchChoice(event: SymposiumEvent): string {
  if (!isFullDayWorkshop(event)) return '';
  const current = chosenLunch[event.id];
  return `
    <div class="d-choice">
      <span class="d-hud-label">LUNCH PREFERENCE</span>
      <div class="d-choice-options">
        <button class="d-choice-btn ${current === 'veg' ? 'is-on' : ''}" data-d-lunch="veg">
          <strong>Vegetarian</strong><small>LUNCH</small>
        </button>
        <button class="d-choice-btn ${current === 'non_veg' ? 'is-on' : ''}" data-d-lunch="non_veg">
          <strong>Non-vegetarian</strong><small>LUNCH</small>
        </button>
      </div>
    </div>`;
}

function renderConsole(event: SymposiumEvent): string {
  const price = resolvePrice(event, participationFor(event));
  const capacity = registration.getCapacity(event.id);
  const cta = registration.getCtaState(event.id);
  const label = registration.CTA_LABELS[cta];
  const disabled = cta === 'full' || cta === 'closed' || cta === 'not_registerable';

  const filled =
    capacity.slots !== null && capacity.available !== null
      ? Math.max(0, Math.min(100, ((capacity.slots - capacity.available) / capacity.slots) * 100))
      : null;

  const lateFee = event.pricing.lateBird ?? event.pricing.spot ?? null;

  const facts: { label: string; value: string }[] = [];
  if (event.date) {
    facts.push({
      label: 'WHEN',
      value: event.startTime ? event.date + ' · ' + event.startTime : event.date
    });
  }
  if (event.reportingTime) facts.push({ label: 'REPORTING', value: event.reportingTime });
  if (event.venue) facts.push({ label: 'VENUE', value: event.venue });
  if (capacity.slots !== null) facts.push({ label: 'CAPACITY', value: 'Limited to ' + capacity.slots });

  return `
    <aside class="d-console" aria-label="Registration">
      <div class="d-console-card d-hud">
        ${
          cta === 'not_registerable'
            ? `<p class="d-lede" style="color: var(--text-silver);">
                 ${event.name} is an open symposium activity &mdash; no delegate registration is taken through this app.
               </p>`
            : `
        <div class="d-price-row">
          <div class="d-price-main">
            <span class="d-hud-label">${price.unspecified ? 'FEE' : 'YOUR FEE'}</span>
            <span class="d-price-value">${price.unspecified ? '—' : price.display}</span>
            <span class="d-price-basis">${price.unspecified ? 'NOT YET PUBLISHED' : price.basis}</span>
          </div>
          ${
            lateFee && !price.unspecified
              ? `<div class="d-price-alt">
                  <span class="d-hud-label">LATE</span>
                  <s>${formatINR(lateFee)}</s>
                </div>`
              : ''
          }
        </div>

        ${
          filled !== null
            ? `<div class="d-meter">
                <div class="d-meter-head">
                  <span class="d-hud-label">CAPACITY</span>
                  <span class="d-meta" style="color: ${capacity.available === 0 ? '#ff9a9a' : 'var(--cyan-glow)'};">
                    ${capacity.available === 0 ? 'FULL' : capacity.available + ' OF ' + capacity.slots + ' LEFT'}
                  </span>
                </div>
                <div class="d-meter-track"><div class="d-meter-fill" style="width: ${filled.toFixed(1)}%;"></div></div>
              </div>`
            : '<div style="height: 22px;"></div>'
        }

        ${renderParticipationChoice(event)}
        ${renderLunchChoice(event)}
        ${slotButton('btn-event-primary-action', label, disabled)}
        ${renderDelegateNotice(event)}`
        }
      </div>

      ${
        facts.length
          ? `<div class="d-panel-soft" style="padding: 18px 20px;">
              <dl style="display: flex; flex-direction: column; gap: 13px;">
                ${facts
                  .map(
                    fact => `<div class="d-ledger-row"><dt>${fact.label}</dt><dd style="font-family: var(--font-sans-ui); font-size: 12.5px; text-align: right;">${fact.value}</dd></div>`
                  )
                  .join('')}
              </dl>
            </div>`
          : ''
      }
    </aside>`;
}

export function renderDesktopEventDetails(): string {
  const event = appStore.getSelectedEvent();
  const about = event.description ?? event.summary ?? '';

  return `
    <div class="d-page">
      <div class="d-detail d-pad">
        <div class="d-detail-main">
          <button class="d-back" id="btn-details-back">
            ${icon('back', 17, 2.2)}<span>BACK</span>
          </button>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="d-detail-code-row">
              <span class="d-detail-code">${event.code}</span>
              <span class="d-pill">${CATEGORY_LABELS[event.category]}</span>
            </div>
            <h1 class="d-detail-title">${event.name}<span class="d-dot">.</span></h1>
            <p class="d-detail-context">${eventContextLine(event)}</p>
            ${event.tagline ? `<p class="d-detail-tagline">${event.tagline}</p>` : ''}
            ${event.summary ? `<p class="d-detail-lede">${event.summary}</p>` : ''}
          </div>

          ${renderFacts(event)}

          ${
            about
              ? `<section>
                  <div class="d-prose-head"><span>&mdash;</span><span>ABOUT</span></div>
                  <p class="d-prose">${about}</p>
                </section>`
              : ''
          }

          ${renderDeadlines(event)}
          ${renderSections(event)}

          ${
            event.coordinators?.length
              ? `<div class="d-people">
                  <span class="d-people-label">EVENT IN-CHARGES</span>
                  ${event.coordinators
                    .map(
                      person => `<span class="d-person">${person.name}${
                        person.phone ? ` <a href="tel:${person.phone}">${person.phone}</a>` : ''
                      }</span>`
                    )
                    .join('')}
                </div>`
              : ''
          }

          <footer class="d-footer" style="margin-top: 24px;">
            <div class="d-foot-stack">
              <b>STRIATUM 4.0</b>
              <span>IGMCRI &middot; SIGMA 2026</span>
            </div>
          </footer>
        </div>

        ${renderConsole(event)}
      </div>
    </div>`;
}

export function attachDesktopEventDetails(): void {
  const event = appStore.getSelectedEvent();

  document.getElementById('btn-details-back')?.addEventListener('click', () => {
    appStore.goBackFromDetails();
  });

  document.getElementById('d-need-delegate')?.addEventListener('click', clickEvent => {
    clickEvent.preventDefault();
    appStore.setScreen('delegate-registration');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-participation]').forEach(button => {
    button.addEventListener('click', () => {
      chosenParticipation[event.id] = button.getAttribute('data-d-participation') as Participation;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-lunch]').forEach(button => {
    button.addEventListener('click', () => {
      chosenLunch[event.id] = button.getAttribute('data-d-lunch') as LunchChoice;
      appStore.refresh();
    });
  });

  document.getElementById('btn-event-primary-action')?.addEventListener('click', () => {
    const cta = registration.getCtaState(event.id);

    if (cta === 'in_cart') {
      appStore.setScreen('cart');
      return;
    }
    if (cta === 'under_review' || cta === 'registered') {
      appStore.setScreen('my-events');
      return;
    }
    if (cta !== 'add_to_cart') return;

    const result = registration.addToCart(event.id, participationFor(event), chosenLunch[event.id]);
    appStore.showToast(result.message);
  });

  // One section open at a time, matching the mobile detail rhythm.
  document.querySelectorAll<HTMLButtonElement>('[data-d-acc]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.d-acc');
      if (!item) return;
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll<HTMLElement>('.d-acc.is-open').forEach(open => {
        if (open !== item) {
          open.classList.remove('is-open');
          open.querySelector<HTMLButtonElement>('.d-acc-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !wasOpen);
      trigger.setAttribute('aria-expanded', String(!wasOpen));
    });
  });
}
