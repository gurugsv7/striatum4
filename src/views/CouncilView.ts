import { appStore } from '../state/appStore.ts';
import { escapeHtml } from '../services/text.ts';
import { COUNCIL_TIERS, COUNCIL_BODY, COUNCIL_COUNT, CouncilTier } from '../data/council.ts';

/**
 * 05 / COUNCIL.
 *
 * The obvious build for eighteen people is a grid of portrait cards. There are
 * no portraits, and eighteen identical name tiles is the most templatish page
 * this site could have.
 *
 * What the content actually has is rank: a president, a board that advises, and
 * a board that runs the portfolios. So it is drawn as a descent — the same
 * beaded rail the payment and registration screens already use, but each bead a
 * tier rather than a step, and each tier lighter than the one above it. The
 * president reads largest and alone; the executive board is a dense two-column
 * register. Weight carries the hierarchy, so nothing has to be labelled
 * "senior".
 *
 * Roles and names are marked up as a description list, which is what they are:
 * the role is the term and the person is the definition.
 */

function renderTier(tier: CouncilTier, isLead: boolean): string {
  return `
    <section class="council-tier ${isLead ? 'is-lead' : ''}" aria-labelledby="council-${tier.index}">
      <div class="timeline-bead"></div>

      <header class="council-tier-head">
        <span class="step-label-tag">${tier.index} <span style="opacity: 0.5;">/</span> ${escapeHtml(
          tier.title
        )}</span>
        <span class="council-tier-count">${tier.members.length}</span>
      </header>

      <p class="council-tier-blurb">${escapeHtml(tier.blurb)}</p>

      <dl class="council-roll ${isLead ? '' : 'is-dense'}" id="council-${tier.index}">
        ${tier.members
          .map(
            member => `
          <div class="council-entry">
            <dt class="council-role">${escapeHtml(member.role)}</dt>
            <dd class="council-name">${escapeHtml(member.name)}</dd>
          </div>`
          )
          .join('')}
      </dl>
    </section>`;
}

export function renderCouncilView(): string {
  return `
    <div class="screen-content">
      <header class="app-top-header">
        <button class="top-bar-back-btn" id="btn-council-back" aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div class="app-brand-block">
          <div class="app-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="app-brand-meta">IGMCRI &middot; SIGMA 2026</div>
        </div>
      </header>

      <section class="council-hero">
        <div class="council-seal-wrap" aria-hidden="true">
          <img src="/sigma-seal.png" alt="" class="council-seal" width="150" height="143" />
        </div>

        <div class="section-index-label">
          <span class="cyan-num">05</span>
          <span class="slash">/</span>
          <span class="section-name">COUNCIL</span>
        </div>

        <h1 class="explore-heading">
          The people<br />
          behind it<span class="cyan-period">.</span>
        </h1>

        <p class="explore-subtitle">
          ${escapeHtml(COUNCIL_BODY)}. ${COUNCIL_COUNT} students hold the portfolios
          that STRIATUM 4.0 is built from.
        </p>
      </section>

      <div class="council-rail">
        <span class="council-rail-line" aria-hidden="true"></span>
        ${COUNCIL_TIERS.map((tier, index) => renderTier(tier, index === 0)).join('')}
      </div>

      <footer class="council-footer">
        <span class="council-footer-mark">SIGMA &middot; STUDENTS&rsquo; COUNCIL</span>
        <span class="council-footer-sub">INDIRA GANDHI MEDICAL COLLEGE &amp; RESEARCH INSTITUTE</span>
      </footer>
    </div>`;
}

export function attachCouncilEvents(): void {
  document.getElementById('btn-council-back')?.addEventListener('click', () => {
    appStore.setScreen('home');
  });
}
