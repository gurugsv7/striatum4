import { appStore } from '../state/appStore.ts';
import { SymposiumEvent, EventSection, CATEGORY_LABELS } from '../data/eventTypes.ts';
import { eventContextLine } from '../data/events.ts';
import { resolvePrice, defaultParticipation, formatINR, Participation } from '../services/pricing.ts';
import * as registration from '../services/registrationService.ts';
import { isFullDayWorkshop, LunchChoice } from '../services/workshop.ts';

/**
 * Participation shape chosen on this screen for events that accept either an
 * individual or a team, since it changes the payable fee. Cleared once the event
 * reaches the cart, which then owns the choice.
 */
const chosenParticipation: Record<string, Participation> = {};
const chosenLunch: Record<string, LunchChoice> = {};

function participationFor(event: SymposiumEvent): Participation {
  return chosenParticipation[event.id] ?? defaultParticipation(event);
}

function teamSizeLabel(event: SymposiumEvent): string | null {
  if (!event.teamSize) return null;
  const { min, max } = event.teamSize;
  if (min === max) return min === 1 ? 'Individual' : 'Team of ' + min;
  return 'Team of ' + min + '–' + max;
}

/**
 * Label for the team side of the participation switch. The individual option is
 * shown separately, so the team option names the team size itself rather than a
 * range that starts at one person.
 */
function teamLabelForChoice(event: SymposiumEvent): string {
  if (!event.teamSize) return 'Team';
  const { min, max } = event.teamSize;
  const size = Math.max(min, 2);
  return size === max ? 'Team of ' + max : 'Team of ' + size + '–' + max;
}

/** Key facts. Only cells with published values are emitted. */
function renderKeyFacts(event: SymposiumEvent): string {
  const price = resolvePrice(event, participationFor(event));
  const capacity = registration.getCapacity(event.id);

  const cells: { label: string; value: string; caption?: string }[] = [];

  if (event.date) {
    cells.push({
      label: 'DATE',
      value: event.date,
      caption: event.startTime
        ? event.endTime
          ? event.startTime + ' – ' + event.endTime
          : event.startTime
        : undefined
    });
  }

  const team = teamSizeLabel(event);
  cells.push({
    label: 'FORMAT',
    value: event.format,
    caption: team ?? (event.participation === 'either' ? 'Individual or team' : undefined)
  });

  if (capacity.slots !== null) {
    cells.push({
      label: 'SLOTS',
      value: String(capacity.slots),
      caption: capacity.available === 0 ? 'Full' : capacity.available + ' available'
    });
  }

  if (!price.unspecified) {
    cells.push({ label: 'FEE', value: price.display, caption: price.basis });
  } else if (event.prizes?.totalValue) {
    cells.push({ label: 'PRIZE POOL', value: formatINR(event.prizes.totalValue) });
  }

  if (price.amount !== null && event.prizes?.totalValue && cells.length < 4) {
    cells.push({ label: 'PRIZE POOL', value: formatINR(event.prizes.totalValue) });
  }

  if (!cells.length) return '';

  return `
    <div class="key-facts-grid cols-${Math.min(cells.length, 4)}">
      ${cells
        .map(
          cell => `
        <div class="key-fact-cell">
          <span class="key-fact-label">${cell.label}</span>
          <span class="key-fact-value">${cell.value}</span>
          ${cell.caption ? `<span class="key-fact-caption">${cell.caption}</span>` : ''}
        </div>`
        )
        .join('')}
    </div>
  `;
}

/** Deadlines and submission address, when the brochure publishes them. */
function renderDeadlineRail(event: SymposiumEvent): string {
  const rows: { label: string; value: string }[] = [];
  if (event.abstractDeadline) rows.push({ label: 'ABSTRACT DEADLINE', value: event.abstractDeadline });
  if (event.submissionDeadline) rows.push({ label: 'SUBMISSION DEADLINE', value: event.submissionDeadline });
  if (event.submissionEmail) rows.push({ label: 'SUBMIT TO', value: event.submissionEmail });
  if (!rows.length) return '';

  return `
    <div class="deadline-rail">
      <div class="deadline-rail-line"></div>
      ${rows
        .map(
          row => `
        <div class="deadline-row">
          <span class="deadline-node"></span>
          <span class="deadline-label">${row.label}</span>
          <span class="deadline-value">${row.value}</span>
        </div>`
        )
        .join('')}
    </div>
  `;
}

function renderSectionBody(section: EventSection): string {
  const parts: string[] = [];

  if (section.body) parts.push(`<p class="section-body-text">${section.body}</p>`);

  if (section.facts?.length) {
    parts.push(`
      <div class="section-fact-list">
        ${section.facts
          .map(
            fact => `
          <div class="section-fact-row">
            <span class="section-fact-label">${fact.label}</span>
            <span class="section-fact-value">${fact.value}</span>
          </div>`
          )
          .join('')}
      </div>
    `);
  }

  if (section.items?.length) {
    parts.push(`
      <ul class="section-bullet-list">
        ${section.items.map(item => `<li><span class="section-bullet-node"></span><span>${item}</span></li>`).join('')}
      </ul>
    `);
  }

  return parts.join('');
}

/** Adaptive detail sections — the shell is shared, the content is per event type. */
function renderSections(event: SymposiumEvent): string {
  const sections = event.sections ?? [];
  if (!sections.length) return '';

  return `
    <section class="details-accordions-section">
      <div class="accordion-group">
        ${sections
          .map(
            (section, index) => `
          <div class="accordion-item ${section.defaultOpen ? 'open' : ''}" id="accordion-item-${index}">
            <button class="accordion-trigger" data-accordion-index="${index}">
              <div class="accordion-title-row">
                <span class="accordion-ring-icon"></span>
                <span>${section.title}</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="accordion-chevron">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div class="accordion-content">
              ${renderSectionBody(section)}
            </div>
          </div>`
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderDelegateNotice(event: SymposiumEvent): string {
  const icon = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`;

  switch (event.delegatePassRequirement) {
    case 'required': {
      const status = registration.getDelegateStatus();
      if (status === 'approved') {
        return `<div class="delegate-required-notice">${icon}<span>Covered by your verified Delegate Pass.</span></div>`;
      }
      if (status === 'pending') {
        // The pass works immediately; verification happens alongside.
        return `<div class="delegate-required-notice">${icon}<span>Covered by your Delegate Pass · verification in progress.</span></div>`;
      }
      const body =
        status === 'revoked'
          ? 'Your Delegate Pass has been revoked. Contact the organisers to restore access.'
          : status === 'rejected'
          ? 'Your delegate application needs attention before you can register for this event.'
          : 'A <a href="#delegate" id="link-need-delegate" class="cyan-link">Delegate Pass</a> is required for this event.';
      return `<div class="delegate-required-notice is-blocking">${icon}<span>${body}</span></div>`;
    }
    case 'not_required':
      return `<div class="delegate-required-notice">${icon}<span>No Delegate Pass required.</span></div>`;
    case 'not_required_for_submission':
      return `<div class="delegate-required-notice">${icon}<span>A Delegate Pass is <strong>not required</strong> to submit an abstract.</span></div>`;
    default:
      // The brochure does not state a requirement — say nothing rather than guess.
      return '';
  }
}

function renderParticipationChoice(event: SymposiumEvent): string {
  if (event.participation !== 'either') return '';
  const current = participationFor(event);
  const individual = resolvePrice(event, 'individual');
  const team = resolvePrice(event, 'team');

  return `
    <div class="participation-switch">
      <div class="participation-label">PARTICIPATE AS</div>
      <div class="participation-options">
        <button class="participation-option ${current === 'individual' ? 'active' : ''}" data-participation="individual">
          <span>Individual</span>
          ${individual.unspecified ? '' : `<span class="participation-price">${individual.display}</span>`}
        </button>
        <button class="participation-option ${current === 'team' ? 'active' : ''}" data-participation="team">
          <span>${teamLabelForChoice(event)}</span>
          ${team.unspecified ? '' : `<span class="participation-price">${team.display}</span>`}
        </button>
      </div>
    </div>
  `;
}

function renderLunchChoice(event: SymposiumEvent): string {
  if (!isFullDayWorkshop(event)) return '';
  const current = chosenLunch[event.id];
  return `
    <div class="participation-switch lunch-choice-block">
      <div class="participation-label">LUNCH PREFERENCE</div>
      <div class="participation-options">
        <button class="participation-option ${current === 'veg' ? 'active' : ''}" data-lunch-choice="veg">
          <span>Vegetarian</span><span class="participation-price">LUNCH</span>
        </button>
        <button class="participation-option ${current === 'non_veg' ? 'active' : ''}" data-lunch-choice="non_veg">
          <span>Non-vegetarian</span><span class="participation-price">LUNCH</span>
        </button>
      </div>
    </div>`;
}

function renderPrimaryAction(event: SymposiumEvent): string {
  const cta = registration.getCtaState(event.id);
  const label = registration.CTA_LABELS[cta];

  // A missing Delegate ID does NOT block adding to the cart — it is caught before
  // checkout, so the delegate can still assemble their selection while the
  // application is being verified.
  const disabled = cta === 'full' || cta === 'closed' || cta === 'not_registerable';

  const arrow = `
    <span class="circle-arrow-icon" style="background: rgba(42, 241, 250, 0.1);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
      </svg>
    </span>`;

  if (cta === 'not_registerable') {
    return `
      <div class="details-action-block">
        <div class="non-registerable-note">
          ${event.name} is an open symposium activity — no delegate registration is taken through this app.
        </div>
      </div>
    `;
  }

  return `
    <div class="details-action-block">
      ${renderParticipationChoice(event)}
      ${renderLunchChoice(event)}
      <button class="btn-chamfer-primary btn-register-event-slot state-${cta}" id="btn-event-primary-action" ${disabled ? 'disabled' : ''}>
        <span>${label}</span>
      </button>
      ${renderDelegateNotice(event)}
    </div>
  `;
}

function renderCoordinators(event: SymposiumEvent): string {
  if (!event.coordinators?.length) return '';
  return `
    <div class="incharges-card-strip">
      <div class="incharges-label">EVENT IN-CHARGES</div>
      <div class="incharges-names-list">
        ${event.coordinators
          .map(
            person => `
          <div class="incharge-item">
            <span class="incharge-bullet"></span>
            <span class="incharge-name">${person.name}</span>
            ${person.phone ? `<a href="tel:${person.phone}" class="incharge-phone">${person.phone}</a>` : ''}
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;
}

export function renderEventDetailsView(): string {
  const event = appStore.getSelectedEvent();
  const cartCount = registration.cartCount();
  const about = event.description ?? event.summary ?? '';

  return `
    <div class="screen-content no-bottom-nav">

      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-details-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span class="back-nav-label">BACK</span>
        </button>

        <div class="details-header-right">
          <button class="header-cart-btn ${cartCount ? 'has-items' : ''}" id="btn-details-cart" title="View cart">
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
      <section class="event-hero-section">
        <div class="event-meta-badge-row">
          <span class="event-meta-code">${event.code}</span>
          <span class="event-badge-pill">${CATEGORY_LABELS[event.category]}</span>
        </div>

        <h1 class="event-details-title is-brand">${event.name}<span class="cyan-period">.</span></h1>

        <div class="event-context-line">${eventContextLine(event)}</div>

        ${event.tagline ? `<div class="event-tagline-cyan">${event.tagline}</div>` : ''}

        ${event.summary ? `<p class="event-lead-description">${event.summary}</p>` : ''}
      </section>

      ${renderPrimaryAction(event)}

      ${renderKeyFacts(event)}

      ${
        about
          ? `<section class="about-event-section">
              <div class="about-title-row">
                <div class="about-heading-label"><span class="dash">—</span> ABOUT</div>
              </div>
              <p class="about-body-paragraph">${about}</p>
            </section>`
          : ''
      }

      ${renderDeadlineRail(event)}

      ${renderSections(event)}

      ${renderCoordinators(event)}

      <footer class="details-footer">
        <div class="footer-left-meta">
          <span class="symp-name">STRIATUM 4.0</span>
          <span class="symp-sub">IGMCRI · SIGMA 2026</span>
          <span class="footer-dash-line"></span>
        </div>
      </footer>

    </div>
  `;
}

export function attachEventDetailsEvents(): void {
  const event = appStore.getSelectedEvent();

  document.getElementById('btn-details-back')?.addEventListener('click', () => {
    appStore.goBackFromDetails();
  });

  document.getElementById('btn-details-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.getElementById('link-need-delegate')?.addEventListener('click', e => {
    e.preventDefault();
    appStore.setScreen('delegate-registration');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-participation]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-participation') as Participation;
      chosenParticipation[event.id] = value;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-lunch-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-lunch-choice') as LunchChoice;
      chosenLunch[event.id] = value;
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

  // Accordions: one open at a time, matching the established detail rhythm.
  document.querySelectorAll<HTMLButtonElement>('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      if (!item) return;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}
