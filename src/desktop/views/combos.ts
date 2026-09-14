import { appStore } from '../../state/appStore.ts';
import * as registration from '../../services/registrationService.ts';
import { formatINR } from '../../services/pricing.ts';
import {
  ComboOffer,
  COMBO_DEADLINE_DISPLAY,
  combosOfKind,
  comboEvents,
  comboNormalTotal,
  comboSavings,
  isComboOpen
} from '../../data/combos.ts';
import { REGISTRATION_CONTACT, telNumber, whatsappNumber } from '../../data/contacts.ts';
import { startComboRegistration } from '../../views/RegistrationFormView.ts';
import { eyebrow, icon } from '../shell.ts';

/**
 * Desktop combos.
 *
 * The phone reads the bundles as one column on the current. With the width
 * available the two families sit side by side, each on its own current, and a
 * bundle's events branch across rather than stacking — the confluence is
 * legible at a glance instead of needing a scroll.
 */

function ctaFor(state: registration.ComboState): { label: string; disabled: boolean } {
  switch (state) {
    case 'in_cart':
      return { label: 'COMBO IN CART', disabled: false };
    case 'closed':
      return { label: 'OFFER CLOSED', disabled: true };
    case 'unavailable':
      return { label: 'UNAVAILABLE', disabled: true };
    default:
      return { label: 'REGISTER COMBO', disabled: false };
  }
}

function renderCombo(combo: ComboOffer): string {
  const events = comboEvents(combo);
  const normal = comboNormalTotal(combo) ?? combo.publishedNormalTotal;
  const availability = registration.comboAvailability(combo.id);
  const cta = ctaFor(availability.state);
  const bulk = combo.teamsPerEvent > 1;
  const muted = availability.state === 'unavailable' || availability.state === 'closed';

  return `
    <article class="d-combo ${muted ? 'is-muted' : ''}">
      <span class="d-combo-bead"></span>

      <div class="d-combo-card">
        ${bulk ? `<span class="d-combo-bulk">${combo.teamsPerEvent} TEAMS &middot; ONE BUNDLE</span>` : ''}

        <div class="d-combo-nodes">
          ${events
            .map(
              (event, index) => `
            ${index > 0 ? '<span class="d-combo-join" aria-hidden="true"></span>' : ''}
            <div class="d-combo-node">
              <span class="d-combo-node-dot"></span>
              <span class="d-combo-node-name">${event.name}</span>
              <span class="d-combo-node-meta">
                ${event.code}${event.date ? ' &middot; ' + event.date : ''}${
                event.price !== null
                  ? ' &middot; ' + formatINR(event.price) + (bulk ? ' × ' + combo.teamsPerEvent : '')
                  : ''
              }
              </span>
            </div>`
            )
            .join('')}
        </div>

        <div class="d-combo-foot">
          <div class="d-combo-ledger">
            <span class="d-combo-normal">${formatINR(normal)}</span>
            <span class="d-combo-price">${formatINR(combo.publishedComboTotal)}</span>
            <span class="d-combo-save">SAVE ${formatINR(comboSavings(combo))}</span>
          </div>

          <button class="d-combo-cta state-${availability.state}" data-combo-action="${combo.id}" ${
            cta.disabled ? 'disabled' : ''
          }>
            <span>${cta.label}</span>
            ${cta.disabled ? '' : icon('arrow', 14, 2)}
          </button>
        </div>

        ${
          availability.reason && availability.state !== 'in_cart'
            ? `<p class="d-combo-reason">${availability.reason}</p>`
            : ''
        }
      </div>
    </article>`;
}

function renderGroup(title: string, index: string, combos: ComboOffer[]): string {
  if (!combos.length) return '';
  return `
    <section class="d-combo-group">
      <div class="d-combo-group-head">
        <span class="d-combo-group-index">${index}</span>
        <h2 class="d-combo-group-title">${title}</h2>
        <span class="d-combo-group-rule"></span>
        <span class="d-meta">${combos.length}</span>
      </div>
      <div class="d-combo-rail">
        ${combos.map(renderCombo).join('')}
      </div>
    </section>`;
}

export function renderDesktopCombos(): string {
  const open = isComboOpen();
  const inCart = registration.combosInCart().length;

  return `
    <div class="d-page">
      <header class="d-explore-head d-pad">
        <div class="d-explore-intro">
          ${eyebrow('04', 'COMBOS')}
          <h1 class="d-display">Go deeper, together<span class="d-dot">.</span></h1>
          <p class="d-lede" style="max-width: 480px;">
            Selected workshop and quiz combinations carry reduced early-bird pricing.
            Take a bundle and every event in it is registered together.
          </p>
        </div>

        <div class="d-explore-tools">
          <div class="d-combo-status ${open ? '' : 'is-closed'}">
            <span class="d-combo-status-dot"></span>
            <div>
              <span class="d-combo-status-title">EARLY-BIRD COMBOS</span>
              <span class="d-combo-status-sub">
                ${open ? 'AVAILABLE UNTIL ' + COMBO_DEADLINE_DISPLAY : 'CLOSED ' + COMBO_DEADLINE_DISPLAY}
              </span>
            </div>
          </div>
          ${
            inCart
              ? `<button class="d-link" id="d-combos-open-cart">
                  <span>${inCart} IN CART &middot; REVIEW</span><span>&rarr;</span>
                </button>`
              : '<p class="d-annot">BUNDLE THE DIVE<br>KEEP THE DEPTH</p>'
          }
        </div>
      </header>

      <div class="d-combo-body d-pad">
        ${renderGroup('WORKSHOP COMBOS', 'A', combosOfKind('workshop'))}
        ${renderGroup('QUIZ COMBOS', 'B', combosOfKind('quiz'))}
      </div>

      <footer class="d-footer d-pad">
        <div class="d-foot-stack">
          <b>COMBO PRICING IS APPLIED WHEN THE ORDER IS CREATED</b>
          <span>EVERY EVENT KEEPS ITS OWN CAPACITY AND DELEGATE PASS RULES</span>
        </div>
        ${
          REGISTRATION_CONTACT.phone
            ? `<div class="d-combo-contact">
                <span class="d-hud-label">REGISTRATION &amp; COMBOS</span>
                <span class="d-combo-contact-name">${REGISTRATION_CONTACT.name}</span>
                <div class="d-combo-contact-actions">
                  <a class="incharge-action" href="tel:${telNumber(REGISTRATION_CONTACT.phone)}">CALL</a>
                  <a class="incharge-action" href="https://wa.me/${whatsappNumber(REGISTRATION_CONTACT.phone)}"
                     target="_blank" rel="noopener noreferrer">WHATSAPP</a>
                </div>
              </div>`
            : ''
        }
      </footer>
    </div>`;
}

export function attachDesktopCombos(): void {
  document.getElementById('d-combos-open-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-combo-action]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const comboId = button.getAttribute('data-combo-action');
      if (!comboId) return;

      if (registration.comboAvailability(comboId).state === 'in_cart') {
        appStore.setScreen('cart');
        return;
      }

      // One unified form for the whole bundle; nothing is added until it is
      // completed.
      if (!startComboRegistration(comboId)) {
        appStore.showToast('That combo cannot be registered right now.');
      }
    });
  });
}
