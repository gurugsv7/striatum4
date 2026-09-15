import { appStore } from '../../state/appStore.ts';
import { eyebrow, esc } from '../shell.ts';
import { COUNCIL_TIERS, COUNCIL_BODY, COUNCIL_COUNT } from '../../data/council.ts';

/**
 * Desktop council.
 *
 * The phone reads the council as one descending rail. With the width available
 * the same hierarchy can be shown at a glance instead of scrolled through: the
 * president sits alone across the top beside the seal, the advisory board runs
 * as four columns beneath, and the executive board fills a wider grid below
 * that. Rank is carried by how much room each tier is given, which is the one
 * thing a phone cannot do.
 */

function tierGrid(index: number): string {
  const tier = COUNCIL_TIERS[index];
  return tier.members
    .map(
      member => `
      <div class="d-council-entry">
        <dt class="d-council-role">${esc(member.role)}</dt>
        <dd class="d-council-name">${esc(member.name)}</dd>
      </div>`
    )
    .join('');
}

export function renderDesktopCouncil(): string {
  const [lead, advisory, executive] = COUNCIL_TIERS;

  return `
    <div class="d-page">
      <header class="d-explore-head d-pad">
        <div class="d-explore-intro">
          ${eyebrow('05', 'COUNCIL')}
          <h1 class="d-display">The people behind it<span class="d-dot">.</span></h1>
          <p class="d-lede" style="max-width: 520px;">
            ${esc(COUNCIL_BODY)}. ${COUNCIL_COUNT} students hold the portfolios that
            STRIATUM 4.0 is built from.
          </p>
        </div>

        <div class="d-council-seal-col">
          <img src="/sigma-seal.png" alt="SIGMA Students&rsquo; Council" class="d-council-seal" width="150" height="143" />
        </div>
      </header>

      <div class="d-council-body d-pad">

        <section class="d-council-lead" aria-labelledby="d-council-lead-h">
          <div class="d-council-tier-head">
            <span class="d-council-index">${lead.index}</span>
            <h2 class="d-council-tier-title" id="d-council-lead-h">${esc(lead.title)}</h2>
            <span class="d-council-rule"></span>
            <span class="d-meta">${esc(lead.blurb)}</span>
          </div>
          <dl class="d-council-lead-roll">${tierGrid(0)}</dl>
        </section>

        <section class="d-council-tier" aria-labelledby="d-council-adv-h">
          <div class="d-council-tier-head">
            <span class="d-council-index">${advisory.index}</span>
            <h2 class="d-council-tier-title" id="d-council-adv-h">${esc(advisory.title)}</h2>
            <span class="d-council-rule"></span>
            <span class="d-meta">${advisory.members.length}</span>
          </div>
          <dl class="d-council-grid is-advisory">${tierGrid(1)}</dl>
        </section>

        <section class="d-council-tier" aria-labelledby="d-council-exec-h">
          <div class="d-council-tier-head">
            <span class="d-council-index">${executive.index}</span>
            <h2 class="d-council-tier-title" id="d-council-exec-h">${esc(executive.title)}</h2>
            <span class="d-council-rule"></span>
            <span class="d-meta">${executive.members.length}</span>
          </div>
          <dl class="d-council-grid">${tierGrid(2)}</dl>
        </section>

      </div>

      <footer class="d-footer d-pad">
        <div class="d-foot-stack">
          <b>SIGMA &middot; STUDENTS&rsquo; COUNCIL</b>
          <span>INDIRA GANDHI MEDICAL COLLEGE &amp; RESEARCH INSTITUTE</span>
        </div>
      </footer>
    </div>`;
}

export function attachDesktopCouncil(): void {
  // Nothing interactive: the page is a roll of names, and the rail owns
  // navigation on this surface.
  void appStore;
}
