import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { formatINR } from '../services/pricing.ts';
import {
  ComboOffer,
  COMBO_DEADLINE_DISPLAY,
  combosOfKind,
  comboEvents,
  comboNormalTotal,
  comboSavings,
  isComboOpen
} from '../data/combos.ts';
import { REGISTRATION_CONTACT, telNumber, whatsappNumber } from '../data/contacts.ts';
import { startComboRegistration } from '../views/RegistrationFormView.ts';

/**
 * 04 / COMBOS.
 *
 * Combos are drawn as confluences on the expedition rail: a bead on the main
 * current, the events in the bundle branching from it, and the ledger beneath.
 * The page never states a price of its own — event fees come from the
 * catalogue, the saving from the organisers' combo document, and the amount
 * actually owed is recomputed by create_order at checkout.
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

  return `
    <article class="combo-entry ${availability.state === 'unavailable' || availability.state === 'closed' ? 'is-muted' : ''}"
             data-combo-id="${combo.id}">
      <span class="combo-bead"></span>

      <div class="combo-card">
        ${bulk ? `<div class="combo-bulk-tag">${combo.teamsPerEvent} TEAMS &middot; ONE BUNDLE</div>` : ''}

        <div class="combo-nodes">
          ${events
            .map(
              (event, index) => `
            <div class="combo-node">
              <span class="combo-node-dot"></span>
              ${index < events.length - 1 ? '<span class="combo-node-link"></span>' : ''}
              <div class="combo-node-body">
                <h3 class="combo-node-name">${event.name}</h3>
                <div class="combo-node-meta">
                  <span>${event.code}</span>
                  ${event.date ? `<span class="combo-dot-sep">&middot;</span><span>${event.date}</span>` : ''}
                  ${
                    event.price !== null
                      ? `<span class="combo-dot-sep">&middot;</span><span>${formatINR(event.price)}${
                          bulk ? ' × ' + combo.teamsPerEvent : ''
                        }</span>`
                      : ''
                  }
                </div>
              </div>
            </div>`
            )
            .join('')}
        </div>

        <div class="combo-ledger">
          <div class="combo-ledger-row">
            <span class="combo-ledger-label">COMBINED</span>
            <span class="combo-ledger-normal">${formatINR(normal)}</span>
          </div>
          <div class="combo-ledger-row is-combo">
            <span class="combo-ledger-label">COMBO</span>
            <span class="combo-ledger-price">${formatINR(combo.publishedComboTotal)}</span>
          </div>
          <div class="combo-save">SAVE ${formatINR(comboSavings(combo))}</div>
        </div>

        ${
          availability.reason && availability.state !== 'in_cart'
            ? `<p class="combo-reason">${availability.reason}</p>`
            : ''
        }

        <button class="combo-cta state-${availability.state}" data-combo-action="${combo.id}" ${
          cta.disabled ? 'disabled' : ''
        }>
          <span>${cta.label}</span>
          ${cta.disabled ? '' : '<span class="combo-cta-arrow">&rarr;</span>'}
        </button>
      </div>
    </article>`;
}

function renderGroup(title: string, index: string, combos: ComboOffer[]): string {
  if (!combos.length) return '';
  return `
    <section class="combo-group">
      <div class="combo-group-head">
        <span class="combo-group-index">${index}</span>
        <h2 class="combo-group-title">${title}</h2>
        <span class="combo-group-rule"></span>
        <span class="combo-group-count">${combos.length}</span>
      </div>
      <div class="combo-rail">
        <span class="combo-rail-line"></span>
        ${combos.map(renderCombo).join('')}
      </div>
    </section>`;
}

export function renderCombosView(): string {
  const open = isComboOpen();
  const cartCount = registration.cartCount();
  const inCart = registration.combosInCart().length;

  return `
    <div class="screen-content">
      <header class="app-top-header">
        <div class="app-brand-block">
          <div class="app-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="app-brand-meta">IGMCRI &middot; SIGMA 2026</div>
        </div>
        <div class="header-right-block">
          <button class="header-cart-btn ${cartCount ? 'has-items' : ''}" id="btn-combos-cart" title="View cart">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.2"/>
              <circle cx="10" cy="20" r="1"/>
              <circle cx="18" cy="20" r="1"/>
            </svg>
            ${cartCount ? `<span class="cart-count-bead">${cartCount}</span>` : ''}
          </button>
        </div>
      </header>

      <section class="explore-hero-section">
        <div class="section-index-label">
          <span class="cyan-num">04</span>
          <span class="slash">/</span>
          <span class="section-name">COMBOS</span>
        </div>

        <h1 class="explore-heading">
          Go deeper,<br />
          together<span class="cyan-period">.</span>
        </h1>

        <p class="explore-subtitle">
          Selected workshop and quiz combinations carry reduced early-bird pricing.
          Take a bundle and every event in it is registered together.
        </p>
      </section>

      <div class="combo-status ${open ? '' : 'is-closed'}">
        <span class="combo-status-dot"></span>
        <div class="combo-status-text">
          <span class="combo-status-title">EARLY-BIRD COMBOS</span>
          <span class="combo-status-sub">
            ${open ? 'AVAILABLE UNTIL ' + COMBO_DEADLINE_DISPLAY : 'CLOSED ' + COMBO_DEADLINE_DISPLAY}
          </span>
        </div>
      </div>

      ${
        inCart
          ? `<div class="combo-incart-note">
              ${inCart} combo${inCart > 1 ? 's' : ''} in your cart.
              <button class="action-link-cyan" id="btn-combos-open-cart">
                <span>REVIEW CART</span><span>&rarr;</span>
              </button>
            </div>`
          : ''
      }

      ${renderGroup('WORKSHOP COMBOS', 'A', combosOfKind('workshop'))}
      ${renderGroup('QUIZ COMBOS', 'B', combosOfKind('quiz'))}

      <footer class="combo-footer">
        <p class="combo-footnote">
          Combo pricing is applied when the order is created. Every event in a bundle
          keeps its own eligibility, capacity and Delegate Pass rules.
        </p>
        ${
          REGISTRATION_CONTACT.phone
            ? `<div class="combo-contact">
                <span class="combo-contact-label">REGISTRATION &amp; COMBOS</span>
                <span class="combo-contact-name">${REGISTRATION_CONTACT.name}</span>
                <div class="combo-contact-actions">
                  <a class="combo-contact-btn" href="tel:${telNumber(REGISTRATION_CONTACT.phone)}">CALL</a>
                  <a class="combo-contact-btn" href="https://wa.me/${whatsappNumber(REGISTRATION_CONTACT.phone)}"
                     target="_blank" rel="noopener noreferrer">WHATSAPP</a>
                </div>
              </div>`
            : ''
        }
      </footer>
    </div>`;
}

export function attachCombosEvents(): void {
  document.getElementById('btn-combos-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });
  document.getElementById('btn-combos-open-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-combo-action]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const comboId = button.getAttribute('data-combo-action');
      if (!comboId) return;

      // A second press on a bundle already held takes the delegate to the cart
      // rather than silently doing nothing.
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
