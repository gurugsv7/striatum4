import { appStore } from '../../state/appStore.ts';
import { EVENTS, allEventDates } from '../../data/events.ts';
import * as registration from '../../services/registrationService.ts';
import { eyebrow, icon } from '../shell.ts';

/**
 * Desktop home.
 *
 * The phone reads the three chapters as a vertical dive. With the width to
 * spare they run across as a triptych, and the delegate HUD — a small card on
 * the phone — becomes a full strip straddling the hero's lower edge.
 */
export function renderDesktopHome(): string {
  const status = registration.getDelegateStatus();
  const days = allEventDates();
  const state = appStore.getState();
  const activeIso = state.selectedProgrammeDate ?? days[0]?.iso ?? null;

  const delegateCta =
    status === 'none'
      ? 'Register as delegate'
      : status === 'pending'
      ? 'View application'
      : status === 'rejected'
      ? 'Application needs attention'
      : 'View delegate pass';

  const chapters = [
    {
      num: '01',
      label: 'DELEGATE ACCESS',
      title: 'Get your<br />Delegate ID',
      body: 'Register once to unlock event and workshop registrations across STRIATUM 4.0.',
      id: 'btn-register-delegate-link',
      cta: delegateCta.toUpperCase()
    },
    {
      num: '02',
      label: 'EXPLORE',
      title: 'Explore<br />Events',
      body: `Workshops &middot; Competitions &middot; Presentations. ${EVENTS.length} events to choose from.`,
      id: 'btn-explore-events-link',
      cta: 'EXPLORE EVENTS'
    },
    {
      num: '03',
      label: 'PROGRAMME',
      title: 'Event<br />Schedule',
      body: 'What happens each day, when it starts, and what is yours.',
      id: 'btn-view-programme-link',
      cta: 'VIEW PROGRAMME'
    }
  ];

  const dayRange =
    days.length > 1
      ? days[0].display + ' — ' + days[days.length - 1].display
      : days[0]?.display ?? '';

  return `
    <div class="d-page">
      <section class="d-hero">
        <div class="d-hero-bg" aria-hidden="true"></div>
        <div class="d-hero-veil" aria-hidden="true"></div>

        <div class="d-hero-inner d-pad">
          <div class="d-hero-top">
            <div class="d-brand-lockup">
              <span class="d-brand-title">STRIATUM <em>4.0</em></span>
              <span class="d-brand-sub">IGMCRI &middot; SIGMA 2026</span>
              <span class="d-brand-rule"></span>
            </div>

            <div style="display: flex; align-items: center; gap: 14px;">
              <button class="d-searchcue" id="d-home-search">
                ${icon('search', 15, 2)}
                <span>Search ${EVENTS.length} events</span>
                <kbd>/</kbd>
              </button>
              <p class="d-annot" style="border-right: none; border-left: 1px solid rgba(42,241,250,0.22); padding: 0 0 0 12px; text-align: left;">
                MEDICINE &middot; PEOPLE<br>A DEEPER TOMORROW
              </p>
            </div>
          </div>

          <div class="d-hero-foot">
            <div class="d-hero-copy">
              <span class="d-hero-spark"></span>
              <h1 class="d-hero-title">Welcome to<br />STRIATUM<span class="d-dot">.</span></h1>
              <p class="d-hero-sub">Your conclave journey starts here.</p>
            </div>
            <p class="d-annot">
              ${dayRange ? dayRange.toUpperCase() + ' 2026<br>' : ''}IGMCRI &middot; PUDUCHERRY<br>
              <span style="color: var(--cyan-glow);">${EVENTS.length} EVENTS</span>
            </p>
          </div>
        </div>
      </section>

      <div class="d-pad" style="display: flex; flex-direction: column; flex: 1;">
        <div class="d-chapters">
          ${chapters
            .map(
              chapter => `
            <div class="d-chapter">
              ${eyebrow(chapter.num, chapter.label)}
              <h2 class="d-h2">${chapter.title}<span class="d-dot">.</span></h2>
              <p>${chapter.body}</p>
              <button class="d-link" id="${chapter.id}">
                <span>${chapter.cta}</span><span>&rarr;</span>
              </button>
            </div>`
            )
            .join('')}
        </div>

        ${
          days.length
            ? `<div class="d-dayruler">
                <div class="d-dayruler-head">
                  <span class="d-hud-label">${days.length} DAY${days.length === 1 ? '' : 'S'}</span>
                  <span class="d-dayruler-range">${dayRange}</span>
                </div>
                <div class="d-dayruler-track">
                  ${days
                    .map(day => {
                      const count = EVENTS.filter(event => event.isoDate === day.iso).length;
                      return `
                      <button class="d-daynode ${activeIso === day.iso ? 'is-active' : ''}" data-d-day="${day.iso}">
                        <span class="d-daynode-dot"></span>
                        <span class="d-daynode-date">${day.display}</span>
                        <span class="d-daynode-count">${count} EVENT${count === 1 ? '' : 'S'}</span>
                      </button>`;
                    })
                    .join('')}
                </div>
                <button class="d-link" id="d-home-programme-ruler"><span>VIEW PROGRAMME</span><span>&rarr;</span></button>
              </div>`
            : ''
        }

        <footer class="d-footer">
          <div class="d-foot-stack">
            <b>STRIATUM 4.0</b>
            <span>MEDICAL CONCLAVE &middot; 2026</span>
            <span><a href="/credits" id="d-home-credits">WEBSITE BY BUILT BY GSV</a></span>
          </div>
          <p class="d-footer-motto">A familiar journey,<br /><em>a deeper dive.</em></p>
        </footer>
      </div>
    </div>`;
}

export function attachDesktopHome(): void {
  document.getElementById('btn-register-delegate-link')?.addEventListener('click', () => {
    appStore.setScreen('delegate-registration');
  });
  document.getElementById('btn-explore-events-link')?.addEventListener('click', () => {
    appStore.setScreen('explore');
  });
  document.getElementById('d-home-search')?.addEventListener('click', () => {
    appStore.setScreen('explore');
  });
  ['btn-view-programme-link', 'd-home-programme-ruler'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      appStore.setScreen('programme');
    });
  });
  document.getElementById('d-home-credits')?.addEventListener('click', event => {
    event.preventDefault();
    appStore.setScreen('credits');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-d-day]').forEach(button => {
    button.addEventListener('click', () => {
      const iso = button.getAttribute('data-d-day');
      if (!iso) return;
      appStore.setSelectedProgrammeDate(iso);
      appStore.setScreen('programme');
    });
  });
}
