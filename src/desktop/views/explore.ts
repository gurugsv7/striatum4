import { appStore } from '../../state/appStore.ts';
import { SymposiumEvent, CATEGORY_FILTERS } from '../../data/eventTypes.ts';
import {
  EVENTS,
  matchesCategoryFilter,
  matchesSearch,
  eventContextLine,
  allSpecialties,
  allEventDates
} from '../../data/events.ts';
import { priceLabel, formatINR } from '../../services/pricing.ts';
import * as registration from '../../services/registrationService.ts';
import { eyebrow, icon } from '../shell.ts';

/**
 * Desktop explore.
 *
 * The single change that matters: the phone's filter bottom-sheet becomes a
 * permanent left column. Refining stops being a modal round-trip, so the result
 * count and the grid update under the delegate's eye as they tick things.
 */

/** Secondary filters. Mirrors the mobile rules against the same store slice. */
function passesSecondaryFilters(event: SymposiumEvent): boolean {
  const { filters } = appStore.getState();

  if (filters.specialties.length && !event.specialties.some(s => filters.specialties.includes(s))) {
    return false;
  }
  if (filters.dates.length && (!event.isoDate || !filters.dates.includes(event.isoDate))) {
    return false;
  }
  if (filters.participation.length) {
    const shapes: string[] = event.participation === 'either' ? ['individual', 'team'] : [event.participation];
    if (!shapes.some(shape => filters.participation.includes(shape as 'individual' | 'team'))) return false;
  }
  if (filters.noDelegatePassOnly && event.delegatePassRequirement === 'required') return false;
  if (filters.availableOnly) {
    const capacity = registration.getCapacity(event.id);
    if (capacity.available !== null && capacity.available <= 0) return false;
  }
  return true;
}

function scheduleLine(event: SymposiumEvent): string {
  if (!event.date) return '';
  return event.startTime ? event.date + ' · ' + event.startTime : event.date;
}

function capacityLine(event: SymposiumEvent): string {
  const capacity = registration.getCapacity(event.id);
  if (capacity.slots === null) return '';
  return capacity.available === 0 ? 'FULL' : capacity.available + ' of ' + capacity.slots + ' slots';
}

function stateChip(eventId: string): string {
  switch (registration.getCtaState(eventId)) {
    case 'registered':
      return '<span class="d-state">REGISTERED</span>';
    case 'under_review':
      return '<span class="d-state is-muted">UNDER REVIEW</span>';
    case 'in_cart':
      return '<span class="d-state">IN CART</span>';
    case 'full':
      return '<span class="d-state is-warn">FULL</span>';
    default:
      return '';
  }
}

function renderCard(event: SymposiumEvent, index: number): string {
  const schedule = scheduleLine(event);
  const price = priceLabel(event);
  const capacity = capacityLine(event);
  const chip = stateChip(event.id);

  return `
    <button class="d-card" data-open-event-id="${event.id}" id="d-card-${event.id}">
      <span class="d-card-art v${(index % 4) + 1}" aria-hidden="true"></span>

      <span class="d-card-gutter">
        <span class="d-card-bead"></span>
        <span class="d-card-code">${event.code}</span>
      </span>

      <span class="d-card-body">
        <span class="d-card-top">
          ${chip || `<span class="d-pill">${event.format}</span>`}
          ${capacity ? `<span class="d-meta">${capacity}</span>` : ''}
        </span>

        <span class="d-card-title">${event.name}</span>
        <span class="d-card-context">${eventContextLine(event)}</span>

        ${
          schedule || price
            ? `<span class="d-card-facts">
                ${schedule ? `<span>${schedule}</span>` : ''}
                ${schedule && price ? '<span style="color:#2a3f52;">|</span>' : ''}
                ${price ? `<em>${price}</em>` : ''}
              </span>`
            : ''
        }

        <span class="d-card-foot">
          <span class="d-card-tags">
            ${event.specialties.slice(0, 3).map(s => `<span class="d-tag">${s}</span>`).join('')}
          </span>
          <span class="d-card-cta">
            <span class="d-arrow">${icon('arrow', 13, 2)}</span>
            <span>VIEW EVENT</span>
          </span>
        </span>
      </span>
    </button>`;
}

function filterGroup(legend: string, chips: { label: string; attr: string; on: boolean }[]): string {
  if (!chips.length) return '';
  return `
    <div class="d-filter-group">
      <span class="d-filter-legend">${legend}</span>
      <div class="d-filter-chips">
        ${chips
          .map(chip => `<button class="d-chip ${chip.on ? 'is-on' : ''}" ${chip.attr}>${chip.label}</button>`)
          .join('')}
      </div>
    </div>`;
}

export function renderDesktopExplore(): string {
  const state = appStore.getState();

  const filtered = EVENTS.filter(
    event =>
      matchesCategoryFilter(event, state.activeCategory) &&
      matchesSearch(event, state.searchQuery) &&
      passesSecondaryFilters(event)
  );

  const hasQuery = Boolean(state.searchQuery.trim());
  const matchesAnywhere = hasQuery
    ? EVENTS.filter(event => matchesSearch(event, state.searchQuery) && passesSecondaryFilters(event))
    : [];

  const filterCount = appStore.activeFilterCount();
  const filters = state.filters;
  const pricing = registration.priceCart();

  return `
    <div class="d-page">
      <header class="d-explore-head d-pad">
        <div class="d-explore-intro">
          ${eyebrow('02', 'EXPLORE')}
          <h1 class="d-display">Find your event<span class="d-dot">.</span></h1>
          <p class="d-lede" style="max-width: 430px;">
            Workshops, quizzes, research and creative events across STRIATUM 4.0.
          </p>
        </div>

        <div class="d-explore-tools">
          <div class="d-searchbar">
            ${icon('search', 18, 2)}
            <input
              type="text"
              id="explore-search-input"
              placeholder="Search ortho, ECG, paper, quiz&hellip;"
              value="${state.searchQuery.replace(/"/g, '&quot;')}"
              autocomplete="off"
              spellcheck="false"
              aria-label="Search events"
            />
            ${
              state.searchQuery
                ? `<button class="d-search-clear" id="btn-clear-search" aria-label="Clear search">&#10005;</button>`
                : `<span class="d-meta">${EVENTS.length} EVENTS</span>`
            }
          </div>
          <p class="d-annot">BENEATH SURFACES<br>GREATER HORIZONS</p>
        </div>
      </header>

      <div class="d-explore-body d-pad">
        <aside class="d-filters" aria-label="Refine events">
          <div class="d-filters-head">
            <span class="d-filters-title">REFINE</span>
            ${filterCount ? `<button class="d-filters-clear" id="d-clear-filters">CLEAR ${filterCount}</button>` : ''}
          </div>

          ${filterGroup(
            'SPECIALTY / TOPIC',
            allSpecialties().map(specialty => ({
              label: specialty,
              attr: `data-d-specialty="${specialty}"`,
              on: filters.specialties.includes(specialty)
            }))
          )}

          ${filterGroup(
            'DATE',
            allEventDates().map(day => ({
              label: day.display,
              attr: `data-d-date="${day.iso}"`,
              on: filters.dates.includes(day.iso)
            }))
          )}

          ${filterGroup('PARTICIPATION', [
            { label: 'Individual', attr: 'data-d-participation="individual"', on: filters.participation.includes('individual') },
            { label: 'Team', attr: 'data-d-participation="team"', on: filters.participation.includes('team') }
          ])}

          ${filterGroup('REQUIREMENTS', [
            { label: 'No Delegate Pass needed', attr: 'data-d-toggle="noDelegatePassOnly"', on: filters.noDelegatePassOnly },
            { label: 'Seats available', attr: 'data-d-toggle="availableOnly"', on: filters.availableOnly }
          ])}

          ${
            pricing.lines.length
              ? `<div class="d-filters-foot">
                  <span class="d-filter-legend">YOUR SELECTION</span>
                  <div class="d-filters-foot-row">
                    <span>${pricing.lines.length} event${pricing.lines.length === 1 ? '' : 's'} &middot; ${formatINR(pricing.total)}</span>
                    <button class="d-filters-clear" id="d-goto-cart">CART &rarr;</button>
                  </div>
                </div>`
              : ''
          }
        </aside>

        <div class="d-results">
          <div class="d-results-bar">
            <div class="d-cats" role="tablist" aria-label="Event categories">
              ${CATEGORY_FILTERS.map(category => {
                const on = state.activeCategory === category.id;
                return `
                  <button class="d-cat ${on ? 'is-on' : ''}" data-d-category="${category.id}" role="tab" aria-selected="${on}">
                    ${on ? '<span class="d-cat-dot"></span>' : ''}
                    <span>${category.label}</span>
                  </button>`;
              }).join('')}
            </div>
            <span class="d-meta" style="white-space: nowrap;">
              ${filtered.length} ${filtered.length === 1 ? 'EVENT' : 'EVENTS'}
            </span>
          </div>

          <div class="d-grid">
            ${filtered.map(renderCard).join('')}

            ${
              filtered.length === 0
                ? `<div class="d-empty">
                    ${
                      matchesAnywhere.length > 0 && state.activeCategory !== 'ALL'
                        ? `<p>Nothing in <strong>${state.activeCategory}</strong>${hasQuery ? ' for &ldquo;' + state.searchQuery + '&rdquo;' : ''}.</p>
                           <small>${matchesAnywhere.length} matching event${matchesAnywhere.length > 1 ? 's' : ''} in other categories.</small>
                           <button class="d-link" id="d-show-all-matches" style="margin-top: 12px;">
                             <span>SHOW ALL ${matchesAnywhere.length} RESULTS</span><span>&rarr;</span>
                           </button>`
                        : `<p>No events match${hasQuery ? ' &ldquo;' + state.searchQuery + '&rdquo;' : ' these filters'}.</p>
                           <small>Try a specialty like ortho, ECG, nephrology &mdash; or a format like paper, poster, quiz.</small>
                           <button class="d-link" id="d-reset-filters" style="margin-top: 12px;">
                             <span>RESET SEARCH &amp; FILTERS</span><span>&rarr;</span>
                           </button>`
                    }
                  </div>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>`;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

export function attachDesktopExplore(): void {
  const search = document.getElementById('explore-search-input') as HTMLInputElement | null;
  search?.addEventListener('input', event => {
    appStore.setSearchQuery((event.target as HTMLInputElement).value);
  });

  document.getElementById('btn-clear-search')?.addEventListener('click', () => {
    appStore.setSearchQuery('');
    (document.getElementById('explore-search-input') as HTMLInputElement | null)?.focus();
  });

  document.getElementById('d-goto-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-category]').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-d-category');
      if (category) appStore.setActiveCategory(category);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(element => {
    element.addEventListener('click', () => {
      const id = element.getAttribute('data-open-event-id');
      if (id) appStore.openEvent(id);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-specialty]').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-d-specialty') as string;
      appStore.setFilters({ specialties: toggle(appStore.getState().filters.specialties, value) });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-date]').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-d-date') as string;
      appStore.setFilters({ dates: toggle(appStore.getState().filters.dates, value) });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-participation]').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-d-participation') as 'individual' | 'team';
      appStore.setFilters({ participation: toggle(appStore.getState().filters.participation, value) });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-d-toggle') as 'noDelegatePassOnly' | 'availableOnly';
      appStore.setFilters({ [key]: !appStore.getState().filters[key] });
    });
  });

  document.getElementById('d-clear-filters')?.addEventListener('click', () => {
    appStore.clearFilters();
  });

  document.getElementById('d-show-all-matches')?.addEventListener('click', () => {
    appStore.setActiveCategory('ALL');
  });

  document.getElementById('d-reset-filters')?.addEventListener('click', () => {
    appStore.setSearchQuery('');
    appStore.setActiveCategory('ALL');
    appStore.clearFilters();
  });
}
