import { appStore } from '../state/appStore.ts';
import { SymposiumEvent, CATEGORY_FILTERS } from '../data/eventTypes.ts';
import {
  EVENTS,
  matchesCategoryFilter,
  matchesSearch,
  eventContextLine,
  allSpecialties,
  allEventDates
} from '../data/events.ts';
import { priceLabel } from '../services/pricing.ts';
import * as registration from '../services/registrationService.ts';

/** Secondary filters from the filter sheet. The primary category pills are separate. */
function passesSecondaryFilters(event: SymposiumEvent): boolean {
  const { filters } = appStore.getState();

  if (filters.specialties.length && !event.specialties.some(s => filters.specialties.includes(s))) {
    return false;
  }
  if (filters.dates.length && (!event.isoDate || !filters.dates.includes(event.isoDate))) {
    return false;
  }
  if (filters.participation.length) {
    const shapes: string[] =
      event.participation === 'either' ? ['individual', 'team'] : [event.participation];
    if (!shapes.some(s => filters.participation.includes(s as 'individual' | 'team'))) return false;
  }
  if (filters.noDelegatePassOnly && event.delegatePassRequirement === 'required') return false;
  if (filters.availableOnly) {
    const cap = registration.getCapacity(event.id);
    if (cap.available !== null && cap.available <= 0) return false;
  }
  return true;
}

/** Date · time line for a card. Returns '' when nothing is published — never "TBA". */
function scheduleLine(event: SymposiumEvent): string {
  if (!event.date) return '';
  return event.startTime ? event.date + ' · ' + event.startTime : event.date;
}

/** Price · capacity line. Each half is omitted independently when unpublished. */
function commercialLine(event: SymposiumEvent): string {
  const parts: string[] = [];
  const price = priceLabel(event);
  if (price) parts.push(price);

  const cap = registration.getCapacity(event.id);
  if (cap.slots !== null) {
    parts.push(cap.available === 0 ? 'FULL' : cap.available + ' of ' + cap.slots + ' slots');
  }
  return parts.join(' · ');
}

function renderEventCard(event: SymposiumEvent): string {
  const schedule = scheduleLine(event);
  const commercial = commercialLine(event);
  const cta = registration.getCtaState(event.id);
  const statusPill =
    cta === 'registered'
      ? '<span class="card-state-pill is-confirmed">REGISTERED</span>'
      : cta === 'under_review'
      ? '<span class="card-state-pill is-pending">UNDER REVIEW</span>'
      : cta === 'in_cart'
      ? '<span class="card-state-pill is-cart">IN CART</span>'
      : '';

  return `
    <div class="explore-event-entry" data-open-event-id="${event.id}">
      <div class="explore-timeline-bead"></div>

      <div class="event-card" id="card-${event.id}">
        <div class="event-card-reef-bg"></div>

        <div class="event-card-top-row">
          <span class="event-card-code">${event.code}</span>
          ${statusPill || `<span class="event-badge-pill">${event.format}</span>`}
        </div>

        <h3 class="event-card-title is-brand">${event.name}</h3>
        <p class="event-card-context">${eventContextLine(event)}</p>

        ${
          schedule || commercial
            ? `<div class="event-card-facts">
                ${schedule ? `<span class="fact-schedule">${schedule}</span>` : ''}
                ${commercial ? `<span class="fact-commercial">${commercial}</span>` : ''}
              </div>`
            : ''
        }

        <div class="event-card-footer">
          <div class="event-card-tag-row">
            ${event.specialties
              .slice(0, 2)
              .map(s => `<span class="card-specialty-tag">${s}</span>`)
              .join('')}
          </div>

          <button class="btn-view-event" data-open-event-id="${event.id}">
            <span class="circle-arrow-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </span>
            <span>VIEW EVENT</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderFilterSheet(): string {
  const state = appStore.getState();
  if (!state.isFilterSheetOpen) return '';

  const specialties = allSpecialties();
  const dates = allEventDates();
  const f = state.filters;

  return `
    <div class="filter-sheet-overlay open" id="filter-sheet-overlay">
      <div class="filter-sheet-panel" role="dialog" aria-label="Refine events">
        <div class="filter-sheet-grip"></div>

        <div class="filter-sheet-head">
          <div class="section-index-label" style="margin-bottom: 0;">
            <span class="cyan-num">02</span>
            <span class="slash">/</span>
            <span class="section-name">REFINE</span>
          </div>
          <button class="filter-sheet-close" id="btn-close-filter-sheet" aria-label="Close">✕</button>
        </div>

        <div class="filter-sheet-body">
          <div class="filter-group">
            <div class="filter-group-label">SPECIALTY / TOPIC</div>
            <div class="filter-chip-wrap">
              ${specialties
                .map(
                  s =>
                    `<button class="sheet-chip ${
                      f.specialties.includes(s) ? 'active' : ''
                    }" data-filter-specialty="${s}">${s}</button>`
                )
                .join('')}
            </div>
          </div>

          ${
            dates.length
              ? `<div class="filter-group">
                  <div class="filter-group-label">DATE</div>
                  <div class="filter-chip-wrap">
                    ${dates
                      .map(
                        d =>
                          `<button class="sheet-chip ${
                            f.dates.includes(d.iso) ? 'active' : ''
                          }" data-filter-date="${d.iso}">${d.display}</button>`
                      )
                      .join('')}
                  </div>
                </div>`
              : ''
          }

          <div class="filter-group">
            <div class="filter-group-label">PARTICIPATION</div>
            <div class="filter-chip-wrap">
              <button class="sheet-chip ${
                f.participation.includes('individual') ? 'active' : ''
              }" data-filter-participation="individual">Individual</button>
              <button class="sheet-chip ${
                f.participation.includes('team') ? 'active' : ''
              }" data-filter-participation="team">Team</button>
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-group-label">REQUIREMENTS</div>
            <div class="filter-chip-wrap">
              <button class="sheet-chip ${
                f.noDelegatePassOnly ? 'active' : ''
              }" data-filter-toggle="noDelegatePassOnly">No Delegate Pass needed</button>
              <button class="sheet-chip ${
                f.availableOnly ? 'active' : ''
              }" data-filter-toggle="availableOnly">Seats available</button>
            </div>
          </div>
        </div>

        <div class="filter-sheet-actions">
          <button class="btn-chamfer-dark" id="btn-clear-filters">Clear all</button>
          <button class="btn-chamfer-primary" id="btn-apply-filters">
            <span class="btn-cyan-bead"></span>
            <span>Show results</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderExploreView(): string {
  const state = appStore.getState();

  const filtered = EVENTS.filter(
    event =>
      matchesCategoryFilter(event, state.activeCategory) &&
      matchesSearch(event, state.searchQuery) &&
      passesSecondaryFilters(event)
  );

  const hasQuery = Boolean(state.searchQuery.trim());
  const matchesAnywhere = hasQuery
    ? EVENTS.filter(e => matchesSearch(e, state.searchQuery) && passesSecondaryFilters(e))
    : [];

  const filterCount = appStore.activeFilterCount();
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
          <button class="header-cart-btn ${cartCount ? 'has-items' : ''}" id="btn-explore-cart" title="View cart">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.2"/>
              <circle cx="10" cy="20" r="1"/>
              <circle cx="18" cy="20" r="1"/>
            </svg>
            ${cartCount ? `<span class="cart-count-bead">${cartCount}</span>` : ''}
          </button>
          <button class="user-avatar-circle" id="btn-explore-avatar" title="View Profile">
            <span>${(state.userEmail || 'G').charAt(0).toUpperCase()}</span>
          </button>
        </div>
      </header>

      <!-- 02 / EXPLORE -->
      <section class="explore-hero-section">
        <div class="section-index-label" style="margin-bottom: 4px;">
          <span class="cyan-num">02</span>
          <span class="slash">/</span>
          <span class="section-name">EXPLORE</span>
        </div>

        <div class="explore-title-row">
          <h1 class="explore-heading">
            Find your<br />
            event<span class="cyan-period">.</span>
          </h1>

          <div class="side-annotation-col" style="top: -10px;">
            <div class="side-annotation-text">
              <span>SAME</span>
              <span>CURIOSITY</span>
              <span>A DEEPER</span>
              <span>TOMORROW</span>
              <span class="bottom-dash"></span>
            </div>
          </div>
        </div>

        <p class="explore-subtitle">
          Workshops, quizzes, research and creative events<br />
          across STRIATUM 4.0.
        </p>
      </section>

      <!-- Search & Refine -->
      <div class="search-filter-row">
        <div class="search-input-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            id="explore-search-input"
            class="search-input-box"
            placeholder="Search ortho, ECG, paper, quiz…"
            value="${state.searchQuery.replace(/"/g, '&quot;')}"
            autocomplete="off"
            spellcheck="false"
          />
          ${state.searchQuery ? `<button id="btn-clear-search" class="clear-search-btn" title="Clear search">✕</button>` : ''}
        </div>

        <button class="filter-tune-btn ${filterCount ? 'has-filters' : ''}" id="btn-filter-tune" title="Refine">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="21" y2="21"/>
            <line x1="4" x2="20" y1="14" y2="14"/>
            <line x1="4" x2="20" y1="7" y2="7"/>
            <circle cx="8" cy="7" r="2" fill="currentColor"/>
            <circle cx="16" cy="14" r="2" fill="currentColor"/>
            <circle cx="10" cy="21" r="2" fill="currentColor"/>
          </svg>
          ${filterCount ? `<span class="filter-count-bead">${filterCount}</span>` : ''}
        </button>
      </div>

      <!-- Primary category pills -->
      <div class="filter-chips-carousel" role="tablist">
        ${CATEGORY_FILTERS.map(cat => {
          const isActive = state.activeCategory === cat.id;
          return `
            <button class="filter-chip-btn ${isActive ? 'active' : ''}" data-category="${cat.id}" role="tab">
              ${isActive ? '<span class="chip-glow-dot"></span>' : ''}
              <span>${cat.label}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="explore-result-meta">
        <span>${filtered.length} ${filtered.length === 1 ? 'EVENT' : 'EVENTS'}</span>
        ${filterCount ? `<button class="action-link-cyan" id="btn-clear-filters-inline">CLEAR REFINEMENTS</button>` : ''}
      </div>

      <!-- Results on the expedition rail -->
      <div class="explore-cards-timeline">
        <div class="explore-timeline-rail"></div>

        ${filtered.map(renderEventCard).join('')}

        ${
          filtered.length === 0
            ? `<div class="empty-search-state">
                ${
                  matchesAnywhere.length > 0 && state.activeCategory !== 'ALL'
                    ? `<p>Nothing in <strong>${state.activeCategory}</strong>${
                        hasQuery ? ' for "' + state.searchQuery + '"' : ''
                      }.</p>
                       <p style="margin-top: 6px; font-size: 12px; color: var(--text-dim);">
                         ${matchesAnywhere.length} matching event${
                        matchesAnywhere.length > 1 ? 's' : ''
                      } in other categories.
                       </p>
                       <button class="action-link-cyan" id="btn-show-all-matches" style="margin-top: 14px;">
                         Show all ${matchesAnywhere.length} results →
                       </button>`
                    : `<p>No events match${hasQuery ? ' "' + state.searchQuery + '"' : ' these filters'}.</p>
                       <p style="margin-top: 6px; font-size: 12px; color: var(--text-dim);">
                         Try a specialty like ortho, ECG, nephrology — or a format like paper, poster, quiz.
                       </p>
                       <button class="action-link-cyan" id="btn-reset-filters" style="margin-top: 14px;">
                         Reset search &amp; filters
                       </button>`
                }
              </div>`
            : ''
        }
      </div>

      <!-- Footer -->
      <footer class="explore-footer">
        <div class="footer-left-quote">
          <span>BENEATH</span>
          <span>SURFACES</span>
          <span>GREATER</span>
          <span>HORIZONS</span>
          <span class="motto-dash"></span>
        </div>

        <div class="footer-right-sig">
          <span class="sig-name">STRIATUM 4.0</span>
          <span class="sig-college">IGMCRI · SIGMA 2026</span>
          <span class="motto-dash"></span>
        </div>
      </footer>

      ${renderFilterSheet()}
    </div>
  `;
}

export function attachExploreEvents(): void {
  const searchInput = document.getElementById('explore-search-input') as HTMLInputElement | null;
  searchInput?.addEventListener('input', e => {
    appStore.setSearchQuery((e.target as HTMLInputElement).value);
  });

  document.getElementById('btn-clear-search')?.addEventListener('click', () => {
    appStore.setSearchQuery('');
    (document.getElementById('explore-search-input') as HTMLInputElement | null)?.focus();
  });

  document.getElementById('btn-explore-avatar')?.addEventListener('click', () => {
    appStore.setScreen('profile');
  });

  document.getElementById('btn-explore-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.getElementById('btn-filter-tune')?.addEventListener('click', () => {
    appStore.setFilterSheetOpen(true);
  });

  document.querySelectorAll<HTMLButtonElement>('.filter-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      if (category) appStore.setActiveCategory(category);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const id = el.getAttribute('data-open-event-id');
      if (id) appStore.openEvent(id);
    });
  });

  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    appStore.setSearchQuery('');
    appStore.setActiveCategory('ALL');
    appStore.clearFilters();
  });

  document.getElementById('btn-show-all-matches')?.addEventListener('click', () => {
    appStore.setActiveCategory('ALL');
  });

  document.getElementById('btn-clear-filters-inline')?.addEventListener('click', () => {
    appStore.clearFilters();
  });

  attachFilterSheetEvents();
}

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

function attachFilterSheetEvents(): void {
  const overlay = document.getElementById('filter-sheet-overlay');
  if (!overlay) return;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) appStore.setFilterSheetOpen(false);
  });

  document.getElementById('btn-close-filter-sheet')?.addEventListener('click', () => {
    appStore.setFilterSheetOpen(false);
  });

  document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
    appStore.setFilterSheetOpen(false);
  });

  document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
    appStore.clearFilters();
  });

  overlay.querySelectorAll<HTMLButtonElement>('[data-filter-specialty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-filter-specialty') as string;
      appStore.setFilters({ specialties: toggleInList(appStore.getState().filters.specialties, value) });
    });
  });

  overlay.querySelectorAll<HTMLButtonElement>('[data-filter-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-filter-date') as string;
      appStore.setFilters({ dates: toggleInList(appStore.getState().filters.dates, value) });
    });
  });

  overlay.querySelectorAll<HTMLButtonElement>('[data-filter-participation]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-filter-participation') as 'individual' | 'team';
      appStore.setFilters({
        participation: toggleInList(appStore.getState().filters.participation, value)
      });
    });
  });

  overlay.querySelectorAll<HTMLButtonElement>('[data-filter-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-filter-toggle') as 'noDelegatePassOnly' | 'availableOnly';
      const current = appStore.getState().filters;
      appStore.setFilters({ [key]: !current[key] });
    });
  });
}
