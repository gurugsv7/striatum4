import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { formatINR } from '../services/pricing.ts';

/**
 * Manual verification console. This reads and mutates the same localStorage-backed
 * registrationService used by the rest of the app -- there is no server-side admin
 * yet, and this screen builds no fake login. See the closing note rendered below.
 *
 * Module-level UI state, since the whole app re-renders from scratch on every
 * state change and none of this belongs in the shared appStore.
 */
let ordersViewMode: 'awaiting' | 'all' = 'awaiting';
let expandedRejectOrderId: string | null = null;
let delegateRejectOpenId: string | null = null;
let enlargedScreenshotOrderId: string | null = null;
let revokeOpenId: string | null = null;

/** Reasons offered as one-tap chips when revoking an active delegate pass. */
const REVOKE_REASONS = [
  'Payment could not be verified.',
  'Details do not match the delegate.',
  'Duplicate application.'
];

type RosterFilter = 'ALL' | 'CONFIRMED' | 'AWAITING REVIEW' | 'NEEDS RE-UPLOAD';
let rosterFilter: RosterFilter = 'ALL';
let rosterSearch = '';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(ts?: number): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* --------------------------------------------------------- delegate section -- */

function renderRevokePanel(id: string): string {
  if (revokeOpenId !== id) return '';
  return `
    <div class="admin-reason-panel">
      <label class="input-field-label">Reason for revocation</label>
      <div class="admin-reason-chips">
        ${REVOKE_REASONS.map(reason => `
          <button class="filter-chip-btn admin-reason-chip" data-revoke-reason-chip="${id}" data-reason-text="${escapeHtml(reason)}">
            ${escapeHtml(reason)}
          </button>
        `).join('')}
      </div>
      <div class="input-control-box" style="margin-top: 10px;">
        <input type="text" id="revoke-reason-${id}" class="text-input-field" placeholder="Or type a custom reason" />
      </div>
      <button class="action-link-cyan" data-confirm-revoke-delegate="${id}" style="margin-top: 10px;">
        CONFIRM REVOCATION →
      </button>
    </div>
  `;
}

function renderDelegateApplication(app: registration.DelegateApplication, id: string | undefined): string {
  const canAct = !!id && (app.status === 'pending' || app.status === 'approved');

  if (app.status === 'pending') {
    return `
      <div class="admin-panel">
        <div class="hud-corner-tl"></div>
        <div class="hud-corner-br"></div>

        <div class="admin-panel-top-row">
          <span class="admin-panel-name">${escapeHtml(app.fullName)}</span>
          <span class="event-badge-pill">ACTIVE · AWAITING VERIFICATION</span>
        </div>

        <div class="admin-ledger">
          <div class="admin-ledger-row">
            <span class="admin-ledger-key">INSTITUTION</span>
            <span class="admin-ledger-val">${escapeHtml(app.institution)}</span>
          </div>
          <div class="admin-ledger-row">
            <span class="admin-ledger-key">EMAIL</span>
            <span class="admin-ledger-val">${escapeHtml(app.email)}</span>
          </div>
          ${app.yearOfStudy ? `
            <div class="admin-ledger-row">
              <span class="admin-ledger-key">YEAR</span>
              <span class="admin-ledger-val">${escapeHtml(app.yearOfStudy)}</span>
            </div>
          ` : ''}
          ${app.phone ? `
            <div class="admin-ledger-row">
              <span class="admin-ledger-key">PHONE</span>
              <span class="admin-ledger-val">${escapeHtml(app.phone)}</span>
            </div>
          ` : ''}
          ${app.delegateId ? `
            <div class="admin-ledger-row">
              <span class="admin-ledger-key">DELEGATE ID</span>
              <span class="admin-ledger-val admin-ledger-val--cyan">${escapeHtml(app.delegateId)}</span>
            </div>
          ` : ''}
          <div class="admin-ledger-row">
            <span class="admin-ledger-key">SUBMITTED</span>
            <span class="admin-ledger-val">${formatTimestamp(app.submittedAt)}</span>
          </div>
        </div>

        ${canAct ? `
          <div class="admin-action-row">
            <button class="btn-chamfer-primary admin-btn-approve" data-approve-delegate="${id}">
              <span class="btn-cyan-bead"></span>
              <span>VERIFY</span>
            </button>
            <button class="btn-chamfer-dark admin-btn-reject" data-reject-delegate="${id}">REJECT</button>
            <button class="btn-chamfer-dark admin-btn-reject" data-revoke-delegate="${id}">REVOKE PASS</button>
          </div>

          ${delegateRejectOpenId === id ? `
            <div class="admin-reason-panel">
              <label class="input-field-label">Rejection reason</label>
              <div class="input-control-box">
                <input type="text" id="delegate-reject-reason-${id}" class="text-input-field" placeholder="Reason for rejection" />
              </div>
              <button class="action-link-cyan" data-confirm-reject-delegate="${id}" style="margin-top: 10px;">
                CONFIRM REJECTION →
              </button>
            </div>
          ` : ''}

          ${renderRevokePanel(id!)}
        ` : ''}
      </div>
    `;
  }

  const resolvedLabel = app.status === 'approved' ? 'APPROVED' : app.status === 'revoked' ? 'REVOKED' : 'REJECTED';
  const isAmber = app.status === 'rejected' || app.status === 'revoked';
  const pillStyle = isAmber ? ' style="color: #d8b26a; border-color: rgba(216, 178, 106, 0.4);"' : '';
  return `
    <div class="admin-panel admin-panel--quiet">
      <div class="admin-panel-top-row">
        <span class="admin-panel-name">${escapeHtml(app.fullName)}</span>
        <span class="event-badge-pill ${isAmber ? 'event-badge-pill--dim' : ''}"${pillStyle}>${resolvedLabel}</span>
      </div>
      <div class="admin-ledger">
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">EMAIL</span>
          <span class="admin-ledger-val">${escapeHtml(app.email)}</span>
        </div>
        ${app.delegateId ? `
          <div class="admin-ledger-row">
            <span class="admin-ledger-key">DELEGATE ID</span>
            <span class="admin-ledger-val admin-ledger-val--cyan">${escapeHtml(app.delegateId)}</span>
          </div>
        ` : ''}
        ${app.status === 'rejected' || app.status === 'revoked' ? `
          <div class="admin-ledger-row">
            <span class="admin-ledger-key">REASON</span>
            <span class="admin-ledger-val">${escapeHtml(app.rejectionReason ?? '—')}</span>
          </div>
        ` : ''}
      </div>
      ${canAct && app.status === 'approved' ? `
        <div class="admin-action-row">
          <button class="btn-chamfer-dark admin-btn-reject" data-revoke-delegate="${id}">REVOKE PASS</button>
        </div>
        ${renderRevokePanel(id!)}
      ` : ''}
    </div>
  `;
}

function renderDelegateSection(): string {
  const applications = registration.listDelegateApplications();

  if (!applications.length) {
    return `
      <section class="admin-section">
        <div class="section-index-label">
          <span class="cyan-num">C</span>
          <span class="slash">/</span>
          <span class="section-name">DELEGATE APPLICATIONS</span>
        </div>
        <div class="empty-search-state">Nothing awaiting verification.</div>
      </section>
    `;
  }

  return `
    <section class="admin-section">
      <div class="section-index-label">
        <span class="cyan-num">C</span>
        <span class="slash">/</span>
        <span class="section-name">DELEGATE APPLICATIONS</span>
      </div>
      ${(() => {
        const ids = registration.delegateApplicationIds();
        return applications
          .map((app, i) => renderDelegateApplication(app, ids[i]))
          .join('');
      })()}
    </section>
  `;
}

/* --------------------------------------------------------- overview section -- */

function renderOverviewSection(): string {
  const stats = registration.getAdminStats();

  const figures: Array<{ label: string; value: string; extraClass?: string; caption?: string }> = [
    { label: 'REGISTRATIONS CONFIRMED', value: String(stats.registrationsConfirmed) },
    { label: 'AWAITING REVIEW', value: String(stats.ordersAwaitingReview) },
    { label: 'NEEDS RE-UPLOAD', value: String(stats.ordersNeedingReupload), extraClass: 'admin-figure-val--amber' },
    { label: 'DELEGATES APPROVED', value: String(stats.delegatesApproved) },
    { label: 'REVENUE VERIFIED', value: formatINR(stats.revenueVerified), extraClass: 'admin-figure-val--verified' },
    { label: 'REVENUE PENDING', value: formatINR(stats.revenuePending), extraClass: 'admin-figure-val--quiet', caption: 'unverified' }
  ];

  const figureGrid = `
    <div class="admin-figure-grid">
      ${figures.map(f => `
        <div class="admin-figure-cell">
          <span class="admin-figure-label">${escapeHtml(f.label)}</span>
          <span class="admin-figure-val ${f.extraClass ?? ''}">${f.value}</span>
          ${f.caption ? `<span class="admin-figure-caption">${escapeHtml(f.caption)}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  const demandRows = stats.demand.length
    ? `
      <div class="admin-demand-table">
        <div class="admin-demand-header">
          <span class="admin-demand-header-name">EVENT</span>
          <span class="admin-demand-header-figs">CONF / PEND / AVAIL</span>
        </div>
        ${stats.demand.map(d => {
          const isFull = d.available === 0;
          const availableText = d.slots === null ? '—' : isFull ? 'FULL' : String(d.available);
          return `
            <div class="admin-demand-row">
              <span class="admin-demand-name">${escapeHtml(d.name)}</span>
              <span class="admin-demand-figs">
                <span>${d.confirmed}</span>
                <span class="admin-demand-sep">/</span>
                <span>${d.pending}</span>
                <span class="admin-demand-sep">/</span>
                <span class="${isFull ? 'admin-demand-full' : ''}">${availableText}</span>
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `
    : '';

  return `
    <section class="admin-section">
      <div class="section-index-label">
        <span class="cyan-num">A</span>
        <span class="slash">/</span>
        <span class="section-name">OVERVIEW</span>
      </div>
      ${figureGrid}
      ${demandRows}
    </section>
  `;
}

/* ----------------------------------------------------------- roster section -- */

const ROSTER_FILTERS: RosterFilter[] = ['ALL', 'CONFIRMED', 'AWAITING REVIEW', 'NEEDS RE-UPLOAD'];

function matchesRosterFilter(entry: registration.RosterEntry, filter: RosterFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'CONFIRMED':
      return entry.orderStatus === 'approved';
    case 'AWAITING REVIEW':
      return ['payment_submitted', 'under_review', 'awaiting_payment'].includes(entry.orderStatus);
    case 'NEEDS RE-UPLOAD':
      return entry.orderStatus === 'rejected';
  }
}

function matchesRosterSearch(entry: registration.RosterEntry, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    entry.delegateName,
    entry.email,
    entry.delegateId ?? '',
    entry.orderReference,
    ...entry.events
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

function renderRosterRow(entry: registration.RosterEntry): string {
  return `
    <div class="admin-panel">
      <div class="hud-corner-tl"></div>
      <div class="hud-corner-br"></div>

      <div class="admin-panel-top-row">
        <span class="admin-panel-name">${escapeHtml(entry.delegateName)}</span>
        <span class="event-badge-pill ${entry.orderStatus === 'approved' ? '' : entry.orderStatus === 'rejected' ? 'event-badge-pill--dim' : ''}">
          ${registration.orderStatusLabel(entry.orderStatus)}
        </span>
      </div>

      <div class="admin-ledger">
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">EMAIL</span>
          <span class="admin-ledger-val">${escapeHtml(entry.email || '—')}</span>
        </div>
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">${entry.delegateId ? 'DELEGATE ID' : 'DELEGATE STATUS'}</span>
          <span class="admin-ledger-val ${entry.delegateId ? 'admin-ledger-val--cyan' : ''}">
            ${entry.delegateId ? escapeHtml(entry.delegateId) : escapeHtml(entry.delegateStatus.toUpperCase() === 'NONE' ? 'NO APPLICATION' : 'DELEGATE ' + entry.delegateStatus.toUpperCase())}
          </span>
        </div>
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">ORDER</span>
          <span class="admin-ledger-val">${escapeHtml(entry.orderReference)}</span>
        </div>
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">EVENTS</span>
          <span class="admin-ledger-val">${escapeHtml(entry.events.join(' · ') || '—')}</span>
        </div>
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">TOTAL</span>
          <span class="admin-ledger-val">${formatINR(entry.total)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderRosterSection(): string {
  const roster = registration.getRegistrationRoster();
  const filtered = roster
    .filter(entry => matchesRosterFilter(entry, rosterFilter))
    .filter(entry => matchesRosterSearch(entry, rosterSearch));

  const filterRow = `
    <div class="admin-toggle-row admin-roster-filter-row">
      ${ROSTER_FILTERS.map(f => `
        <button class="filter-chip-btn ${rosterFilter === f ? 'active' : ''}" data-roster-filter="${f}">
          ${rosterFilter === f ? '<span class="chip-glow-dot"></span>' : ''}
          <span>${f}</span>
        </button>
      `).join('')}
    </div>
  `;

  const searchRow = `
    <div class="search-input-pill admin-roster-search-pill">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
      </svg>
      <input
        type="text"
        id="admin-roster-search"
        class="search-input-box"
        placeholder="Search name, email, delegate ID, order or event"
        value="${escapeHtml(rosterSearch)}"
      />
    </div>
  `;

  let body: string;
  if (!roster.length) {
    body = `<div class="empty-search-state">No registrations yet.</div>`;
  } else if (!filtered.length) {
    body = `<div class="empty-search-state">No registrations match this filter or search.</div>`;
  } else {
    body = filtered.map(renderRosterRow).join('');
  }

  return `
    <section class="admin-section">
      <div class="section-index-label">
        <span class="cyan-num">B</span>
        <span class="slash">/</span>
        <span class="section-name">REGISTERED DELEGATES</span>
      </div>
      ${searchRow}
      ${filterRow}
      ${body}
    </section>
  `;
}

/* ------------------------------------------------------------ order section -- */

function renderOrderPanel(order: registration.Order): string {
  const delegate = registration.getDelegate();
  /*
   * PRIVACY NOTE: payment proofs are read from local device storage via
   * registration.readProofImage(). This is acceptable only because the whole app
   * is a single-device local prototype. A production deployment must never persist
   * payment screenshots in localStorage or serve them as plain data URLs — they
   * must live in authenticated/signed storage, fetched per-request for an
   * authorised admin only.
   */
  const proofDataUrl = registration.readProofImage(order.id);
  const isEnlarged = enlargedScreenshotOrderId === order.id;
  const isRejectOpen = expandedRejectOrderId === order.id;
  const canAct = order.status === 'payment_submitted' || order.status === 'under_review';

  return `
    <div class="admin-panel ${!canAct ? 'admin-panel--quiet' : ''}">
      <div class="hud-corner-tl"></div>
      <div class="hud-corner-br"></div>

      <div class="admin-panel-top-row">
        <span class="admin-panel-name">${escapeHtml(order.reference)}</span>
        <span class="event-badge-pill ${order.status === 'approved' ? '' : order.status === 'rejected' ? 'event-badge-pill--dim' : ''}">
          ${registration.orderStatusLabel(order.status)}
        </span>
      </div>

      <div class="admin-ledger">
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">DELEGATE</span>
          <span class="admin-ledger-val">${escapeHtml(delegate?.fullName ?? 'Unknown')}</span>
        </div>
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">EMAIL</span>
          <span class="admin-ledger-val">${escapeHtml(delegate?.email ?? '—')}</span>
        </div>
        ${delegate?.status === 'approved' ? `
          <div class="admin-ledger-row">
            <span class="admin-ledger-key">DELEGATE ID</span>
            <span class="admin-ledger-val admin-ledger-val--cyan">${escapeHtml(delegate.delegateId ?? '—')}</span>
          </div>
        ` : ''}
      </div>

      <div class="admin-line-ledger">
        ${order.lines.map(line => `
          <div class="admin-line-row">
            <div class="admin-line-main">
              <span class="admin-line-name">${escapeHtml(line.eventName)}</span>
              <span class="admin-line-context">${escapeHtml(line.context)}</span>
            </div>
            <span class="admin-line-price">${formatINR(line.unitPrice)}</span>
          </div>
        `).join('')}

        ${order.discountAmount > 0 ? `
          <div class="admin-line-row admin-line-row--discount">
            <span class="admin-line-name">${escapeHtml(order.discountLabel ?? 'Discount')}</span>
            <span class="admin-line-price">&minus;${formatINR(order.discountAmount)}</span>
          </div>
        ` : ''}

        <div class="admin-line-row admin-line-row--total">
          <span class="admin-line-name">TOTAL</span>
          <span class="admin-line-price admin-line-price--total">${formatINR(order.total)}</span>
        </div>
      </div>

      <div class="admin-proof-frame ${isEnlarged ? 'admin-proof-frame--expanded' : ''}" data-toggle-screenshot="${order.id}">
        <div class="admin-proof-corner-tl"></div>
        <div class="admin-proof-corner-br"></div>
        ${proofDataUrl
          ? `<img src="${proofDataUrl}" alt="Payment screenshot for ${escapeHtml(order.reference)}" class="admin-proof-img" />`
          : `<div class="admin-proof-empty">No screenshot on file.</div>`}
      </div>

      <div class="admin-ledger" style="margin-top: 10px;">
        <div class="admin-ledger-row">
          <span class="admin-ledger-key">SUBMITTED</span>
          <span class="admin-ledger-val">${formatTimestamp(order.submittedAt)}</span>
        </div>
      </div>

      ${canAct ? `
        <div class="admin-action-row">
          <button class="btn-chamfer-primary admin-btn-approve" data-approve-order="${order.id}">
            <span class="btn-cyan-bead"></span>
            <span>APPROVE</span>
          </button>
          <button class="btn-chamfer-dark admin-btn-reject" data-reject-order="${order.id}">REJECT / REQUEST RE-UPLOAD</button>
        </div>

        ${isRejectOpen ? `
          <div class="admin-reason-panel">
            <label class="input-field-label">Reason</label>
            <div class="admin-reason-chips">
              ${registration.REJECTION_REASONS.map(reason => `
                <button class="filter-chip-btn admin-reason-chip" data-reason-chip="${order.id}" data-reason-text="${escapeHtml(reason)}">
                  ${escapeHtml(reason)}
                </button>
              `).join('')}
            </div>
            <div class="input-control-box" style="margin-top: 10px;">
              <input type="text" id="reject-reason-${order.id}" class="text-input-field" placeholder="Or type a custom reason" />
            </div>
            <button class="action-link-cyan" data-confirm-reject-order="${order.id}" style="margin-top: 10px;">
              CONFIRM REJECTION →
            </button>
          </div>
        ` : ''}
      ` : order.status === 'rejected' ? `
        <div class="admin-ledger">
          <div class="admin-ledger-row">
            <span class="admin-ledger-key">REASON</span>
            <span class="admin-ledger-val">${escapeHtml(order.rejectionReason ?? '—')}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderOrdersSection(): string {
  const orders = ordersViewMode === 'awaiting'
    ? registration.listOrdersForReview()
    : registration.listAllOrdersForAdmin();

  return `
    <section class="admin-section">
      <div class="section-index-label">
        <span class="cyan-num">D</span>
        <span class="slash">/</span>
        <span class="section-name">PAYMENT VERIFICATION</span>
      </div>

      <div class="admin-toggle-row">
        <button class="filter-chip-btn ${ordersViewMode === 'awaiting' ? 'active' : ''}" data-orders-view="awaiting">
          ${ordersViewMode === 'awaiting' ? '<span class="chip-glow-dot"></span>' : ''}
          <span>AWAITING REVIEW</span>
        </button>
        <button class="filter-chip-btn ${ordersViewMode === 'all' ? 'active' : ''}" data-orders-view="all">
          ${ordersViewMode === 'all' ? '<span class="chip-glow-dot"></span>' : ''}
          <span>ALL ORDERS</span>
        </button>
      </div>

      ${orders.length
        ? orders.map(renderOrderPanel).join('')
        : `<div class="empty-search-state">Nothing awaiting verification.</div>`}
    </section>
  `;
}

/* -------------------------------------------------------------------- root -- */

export function renderAdminView(): string {
  return `
    <div class="screen-content no-bottom-nav">

      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-admin-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span class="back-nav-label">PROFILE</span>
        </button>
      </header>

      <section class="explore-hero-section">
        <div class="section-index-label" style="margin-bottom: 4px;">
          <span class="cyan-num">05</span>
          <span class="slash">/</span>
          <span class="section-name">VERIFICATION</span>
        </div>
        <h1 class="explore-heading">
          Payment verification<span class="cyan-period">.</span>
        </h1>
        <p class="explore-subtitle">
          Registrations, delegate applications and payment proofs — all verified by hand.
        </p>
      </section>

      ${renderOverviewSection()}
      ${renderRosterSection()}
      ${renderDelegateSection()}
      ${renderOrdersSection()}

      <p class="admin-footnote">
        This console reads the registrations persisted on this device only. A production
        deployment needs a server-side admin surface with real authentication — this screen
        builds no login of its own.
      </p>

    </div>
  `;
}

export function attachAdminEvents(): void {
  const btnBack = document.getElementById('btn-admin-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => appStore.setScreen('profile'));
  }

  document.querySelectorAll<HTMLButtonElement>('[data-roster-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-roster-filter') as RosterFilter | null;
      if (!filter || !ROSTER_FILTERS.includes(filter)) return;
      rosterFilter = filter;
      appStore.refresh();
    });
  });

  const rosterSearchInput = document.getElementById('admin-roster-search') as HTMLInputElement | null;
  if (rosterSearchInput) {
    rosterSearchInput.addEventListener('input', () => {
      rosterSearch = rosterSearchInput.value;
      appStore.refresh();
    });
  }

  document.querySelectorAll<HTMLButtonElement>('[data-orders-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-orders-view');
      if (mode === 'awaiting' || mode === 'all') {
        ordersViewMode = mode;
        expandedRejectOrderId = null;
        appStore.refresh();
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-toggle-screenshot]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-toggle-screenshot');
      if (!id) return;
      enlargedScreenshotOrderId = enlargedScreenshotOrderId === id ? null : id;
      appStore.refresh();
    });
  });

  /* ---- delegate verify / reject / revoke ---- */

  document.querySelectorAll<HTMLButtonElement>('[data-approve-delegate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-approve-delegate') || undefined;
      const result = await registration.approveDelegate(id);
      appStore.showToast(result.message);
      if (result.ok) delegateRejectOpenId = null;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-reject-delegate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-reject-delegate');
      if (!id) return;
      delegateRejectOpenId = delegateRejectOpenId === id ? null : id;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-confirm-reject-delegate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-confirm-reject-delegate');
      if (!id) return;
      const input = document.getElementById('delegate-reject-reason-' + id) as HTMLInputElement | null;
      const reason = (input?.value ?? '').trim();
      if (!reason) {
        appStore.showToast('A rejection reason is required.');
        return;
      }
      const result = await registration.rejectDelegate(reason, id);
      appStore.showToast(result.message);
      delegateRejectOpenId = null;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-revoke-delegate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-revoke-delegate');
      if (!id) return;
      revokeOpenId = revokeOpenId === id ? null : id;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-revoke-reason-chip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-revoke-reason-chip');
      const reasonText = btn.getAttribute('data-reason-text') ?? '';
      if (!id) return;
      const input = document.getElementById('revoke-reason-' + id) as HTMLInputElement | null;
      if (input) input.value = reasonText;
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-confirm-revoke-delegate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-confirm-revoke-delegate');
      if (!id) return;
      const input = document.getElementById('revoke-reason-' + id) as HTMLInputElement | null;
      const reason = (input?.value ?? '').trim();
      if (!reason) {
        appStore.showToast('A reason is required to revoke a pass.');
        return;
      }
      const result = await registration.revokeDelegate(id, reason);
      appStore.showToast(result.message);
      revokeOpenId = null;
      appStore.refresh();
    });
  });

  /* ---- order approve / reject ---- */

  document.querySelectorAll<HTMLButtonElement>('[data-approve-order]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-approve-order');
      if (!id) return;
      const result = await registration.approveOrder(id);
      appStore.showToast(result.message);
      if (result.ok) expandedRejectOrderId = null;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-reject-order]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-reject-order');
      if (!id) return;
      expandedRejectOrderId = expandedRejectOrderId === id ? null : id;
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-reason-chip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-reason-chip');
      const reasonText = btn.getAttribute('data-reason-text') ?? '';
      if (!orderId) return;
      const input = document.getElementById('reject-reason-' + orderId) as HTMLInputElement | null;
      if (input) input.value = reasonText;
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-confirm-reject-order]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.getAttribute('data-confirm-reject-order');
      if (!orderId) return;
      const input = document.getElementById('reject-reason-' + orderId) as HTMLInputElement | null;
      const reason = (input?.value ?? '').trim();
      if (!reason) {
        appStore.showToast('A rejection reason is required.');
        return;
      }
      const result = await registration.rejectOrder(orderId, reason);
      appStore.showToast(result.message);
      expandedRejectOrderId = null;
      appStore.refresh();
    });
  });
}
