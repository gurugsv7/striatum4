import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { formatINR } from '../services/pricing.ts';

interface ManifestItem {
  indexStr: string;
  name: string;
  context: string;
  date: string;
  time: string;
  venue: string;
  thumbSrc: string;
}

const DEFAULT_MOCKUP_ITEMS: ManifestItem[] = [
  {
    indexStr: '01',
    name: 'AQUAQUEST',
    context: 'Nephrology · Senior Quiz',
    date: '18 OCT 2026',
    time: 'Report 8:00 AM',
    venue: 'Lecture Hall 2, IGMCRI',
    thumbSrc: '/art_aquaquest_inner.png'
  },
  {
    indexStr: '02',
    name: 'PLEURALIS',
    context: 'Respiratory Medicine · Workshop',
    date: '15 OCT 2026',
    time: '2:00 PM – 5:00 PM',
    venue: 'Main Auditorium, IGMCRI',
    thumbSrc: '/art_pleuralis_inner.png'
  },
  {
    indexStr: '03',
    name: 'PENUMBRA',
    context: 'Radiology · Workshop',
    date: '17 OCT 2026',
    time: '9:00 AM – 1:00 PM',
    venue: 'Main Auditorium, IGMCRI',
    thumbSrc: '/art_penumbra_inner.png'
  }
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderEventConfirmView(): string {
  const state = appStore.getState();
  const orderId = state.eventPayment.orderId || state.selectedOrderId;
  const order = orderId ? registration.getOrder(orderId) : undefined;

  // Derive order metadata or fall back to authentic specification fixture
  const orderDisplayCode = order ? order.id.toUpperCase() : 'ORDER S4 / 0038';
  const orderRefNo = order ? (order.proof?.fileName ? `S4P${order.id.slice(-6).toUpperCase()}` : 'S4P00381276') : 'S4P00381276';
  const totalPaid = order ? formatINR(order.total) : '₹1,800';

  // Build items list
  let items: ManifestItem[] = [];
  if (order && order.lines.length > 0) {
    items = order.lines.map((line, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      let thumb = '/art_aquaquest_inner.png';
      if (line.eventName.toLowerCase().includes('pleuralis')) {
        thumb = '/art_pleuralis_inner.png';
      } else if (line.eventName.toLowerCase().includes('penumbra')) {
        thumb = '/art_penumbra_inner.png';
      } else if (idx === 1) {
        thumb = '/art_pleuralis_inner.png';
      } else if (idx === 2) {
        thumb = '/art_penumbra_inner.png';
      }

      return {
        indexStr: numStr,
        name: line.eventName,
        context: line.context || 'Symposium Event',
        date: line.date || '15–18 OCT 2026',
        time: line.startTime || 'TBA',
        venue: 'IGMCRI, Puducherry',
        thumbSrc: thumb
      };
    });
  } else {
    items = DEFAULT_MOCKUP_ITEMS;
  }

  const eventCount = items.length;

  return `
    <div class="screen-content confirm-manifest-page" id="screen-confirm-manifest">

      <!-- Ambient Whale Hero Artwork in Top Right -->
      <div class="confirm-whale-backdrop" aria-hidden="true"></div>

      <!-- Top Navigation Bar -->
      <header class="confirm-top-bar">
        <div class="confirm-top-bar-left">
          <button class="confirm-back-btn" id="btn-confirm-back" aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          <div class="confirm-brand-block">
            <div class="confirm-brand-title">STRIATUM <span style="color: var(--cyan-glow);">4.0</span></div>
            <div class="confirm-brand-sub">IGMCRI · SIGMA 2026</div>
          </div>
        </div>

        <!-- Top Right Editorial Motto Block -->
        <div class="confirm-top-motto">
          <div class="confirm-motto-pipe"></div>
          <div class="confirm-motto-text-col">
            <span class="confirm-motto-line">PEOPLE</span>
            <span class="confirm-motto-line">SCIENCE</span>
            <span class="confirm-motto-line">A DEEPER</span>
            <span class="confirm-motto-line">TOMORROW</span>
            <div class="confirm-motto-underline"></div>
          </div>
        </div>
      </header>

      <!-- Hero Section: 04 / CONFIRMED -->
      <section class="confirm-hero-section">
        <div class="confirm-hero-timeline-rail"></div>
        <div class="confirm-hero-bead"></div>

        <div class="confirm-step-tag">
          <span class="confirm-step-num">04</span>
          <span class="confirm-step-slash">/</span>
          <span>CONFIRMED</span>
        </div>

        <h1 class="confirm-hero-title">
          You’re all set<span class="confirm-cyan-period">.</span>
        </h1>

        <p class="confirm-hero-sub">
          Your registrations have been received.<br />
          ${eventCount} event${eventCount === 1 ? '' : 's'} ${eventCount === 1 ? 'is' : 'are'} now linked to your account.
        </p>

        <!-- Right Side Editorial Accent -->
        <div class="confirm-hero-editorial-aside">
          <div class="confirm-hero-editorial-pipe"></div>
          <div class="confirm-hero-editorial-text-col">
            <span class="confirm-hero-editorial-line">NEW</span>
            <span class="confirm-hero-editorial-line">JOURNEYS</span>
            <span class="confirm-hero-editorial-line">AWAIT.</span>
            <div class="confirm-hero-editorial-underline"></div>
          </div>
        </div>
      </section>

      <!-- Registration Manifest Futuristic Card -->
      <div class="confirm-manifest-chassis">
        <div class="manifest-outer-bracket manifest-outer-bracket-tl"></div>
        <div class="manifest-outer-bracket manifest-outer-bracket-tr"></div>
        <div class="manifest-outer-bracket manifest-outer-bracket-bl"></div>
        <div class="manifest-outer-bracket manifest-outer-bracket-br"></div>

        <!-- Manifest Header Row -->
        <div class="manifest-chassis-header-row">
          <div class="manifest-title-tag">REGISTRATION MANIFEST</div>
          <div class="manifest-order-code">
            ${
              orderDisplayCode.includes('ORDER')
                ? escapeHtml(orderDisplayCode).replace('S4', '<span class="cyan-accent">S4</span>')
                : `ORDER <span class="cyan-accent">S4</span> / ${escapeHtml(orderDisplayCode)}`
            }
          </div>
        </div>

        <!-- Tri-Metric Summary Row -->
        <div class="manifest-tri-metric-row">
          <!-- Metric 1: Events -->
          <div class="manifest-metric-col">
            <div class="manifest-metric-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 3v4" />
                <path d="M17 3v4" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div class="manifest-metric-content">
              <span class="manifest-metric-val">${eventCount} <span style="font-size: 9px; font-weight: 500; opacity: 0.85;">EVENTS</span></span>
              <span class="manifest-metric-lbl">CONFIRMED</span>
            </div>
          </div>

          <div class="manifest-metric-divider"></div>

          <!-- Metric 2: Paid -->
          <div class="manifest-metric-col">
            <div class="manifest-metric-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 8h8" />
                <path d="M8 12h5.5a2.5 2.5 0 0 0 0-5H8" />
                <path d="m11 12 4.5 6" />
              </svg>
            </div>
            <div class="manifest-metric-content">
              <span class="manifest-metric-val">${totalPaid}</span>
              <span class="manifest-metric-lbl">PAID</span>
            </div>
          </div>

          <div class="manifest-metric-divider"></div>

          <!-- Metric 3: Your Events -->
          <div class="manifest-metric-col">
            <div class="manifest-metric-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
              </svg>
            </div>
            <div class="manifest-metric-content">
              <span class="manifest-metric-lbl" style="margin-top: 0;">YOUR</span>
              <span class="manifest-metric-val" style="font-size: 10.5px;">EVENTS</span>
            </div>
          </div>
        </div>

        <!-- Event Cards Linked with Glowing Timeline -->
        <div class="manifest-events-timeline">
          <div class="manifest-timeline-rail"></div>

          ${items
            .map(
              item => `
            <div class="manifest-event-row">
              <div class="manifest-event-bead"></div>

              <div class="manifest-event-card">
                <div class="manifest-event-card-left">
                  <span class="manifest-event-index">${item.indexStr}</span>
                  <div class="manifest-event-thumb-frame">
                    <img class="manifest-event-thumb-img" src="${item.thumbSrc}" alt="${escapeHtml(item.name)}" />
                  </div>
                </div>

                <div class="manifest-event-info">
                  <div class="manifest-event-header-line">
                    <span class="manifest-event-name">${escapeHtml(item.name)}</span>
                    <div class="manifest-registered-pill">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>REGISTERED</span>
                    </div>
                  </div>

                  <div class="manifest-event-context">${escapeHtml(item.context)}</div>

                  <div class="manifest-event-meta-row">
                    <span class="manifest-event-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8" x2="8" y1="2" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                      <span>${escapeHtml(item.date)}</span>
                    </span>

                    <span class="manifest-event-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>${escapeHtml(item.time)}</span>
                    </span>
                  </div>

                  <div class="manifest-event-venue-row">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>${escapeHtml(item.venue)}</span>
                  </div>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Notice Banner Box: Registrations received / Payment verification pending -->
        <div class="confirm-notice-box">
          <div class="confirm-notice-left">
            <div class="confirm-notice-shield-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <div class="confirm-notice-pipe"></div>

            <div class="confirm-notice-text-col">
              <span class="confirm-notice-title">Registrations received</span>
              <span class="confirm-notice-sub">Payment verification pending.</span>
            </div>
          </div>

          <div class="confirm-notice-right">
            <div class="confirm-ref-col">
              <span class="confirm-ref-lbl">Ref. No.</span>
              <span class="confirm-ref-val" id="text-confirm-ref">${escapeHtml(orderRefNo)}</span>
            </div>

            <button class="confirm-copy-ref-btn" id="btn-confirm-copy-ref" title="Copy Reference Number" aria-label="Copy Reference Number">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Action Buttons (Next line with full width and generous spacing) -->
        <div class="confirm-actions-wrap">
          <!-- Primary Button: Explore More Events -->
          <button class="confirm-btn-primary-chamfer" id="btn-confirm-explore-more">
            <div class="confirm-btn-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
              <span class="confirm-btn-text">Explore More Events</span>
            </div>

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14m-7-7 7 7-7 7"/>
            </svg>
          </button>

          <!-- Tertiary Link: View Payment Details -->
          <div class="confirm-link-row">
            <button class="confirm-link-btn" id="btn-confirm-view-payment">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" x2="8" y1="13" y2="13"/>
                <line x1="16" x2="8" y1="17" y2="17"/>
                <line x1="10" x2="8" y1="9" y2="9"/>
              </svg>
              <span>View payment details</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14m-7-7 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

      <!-- Atmospheric Ocean Floor Footer -->
      <footer class="confirm-ocean-footer">
        <div class="confirm-footer-left">
          <span class="confirm-footer-motto-line">SAME OCEAN.</span>
          <span class="confirm-footer-motto-line">DIFFERENT POSSIBILITIES.</span>
          <div class="confirm-footer-line-accent"></div>
        </div>

        <div class="confirm-footer-right">
          <div class="confirm-footer-brand">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="confirm-footer-sub">IGMCRI · SIGMA 2026</div>
        </div>
      </footer>

    </div>
  `;
}

export function attachEventConfirmEvents(): void {
  // Back button
  const btnBack = document.getElementById('btn-confirm-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      appStore.setScreen('explore');
    });
  }

  // Copy reference number
  const btnCopyRef = document.getElementById('btn-confirm-copy-ref');
  const refTextEl = document.getElementById('text-confirm-ref');
  if (btnCopyRef) {
    btnCopyRef.addEventListener('click', () => {
      const code = refTextEl?.textContent?.trim() || 'S4P00381276';
      navigator.clipboard?.writeText(code);
      appStore.showToast(`Reference ${code} copied to clipboard!`);
    });
  }

  // Explore More Events button
  const btnExploreMore = document.getElementById('btn-confirm-explore-more');
  if (btnExploreMore) {
    btnExploreMore.addEventListener('click', () => {
      appStore.setScreen('explore');
    });
  }

  // View Payment Details link
  const btnViewPayment = document.getElementById('btn-confirm-view-payment');
  if (btnViewPayment) {
    btnViewPayment.addEventListener('click', () => {
      const state = appStore.getState();
      const orderId = state.eventPayment.orderId || state.selectedOrderId;
      if (orderId) {
        appStore.openPayment(orderId);
      } else {
        appStore.setScreen('my-events');
      }
    });
  }
}
