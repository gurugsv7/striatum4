import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';

/**
 * Delegate registration is separate from event registration and requires manual
 * verification. Flow: Sign in -> Register as Delegate -> manual verification ->
 * approval -> Delegate ID issued -> eligible registrations unlocked.
 *
 * A Delegate ID is never shown to the applicant until registration.getDelegateStatus()
 * reports 'approved' -- there is no "instant ID" path in this component.
 */

/** Forces the application form to show again after a rejected application. */
let forceFormView = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderModalShell(headingHtml: string, bodyHtml: string): string {
  const state = appStore.getState();

  return `
    <div class="modal-overlay ${state.isDelegateModalOpen ? 'open' : ''}" id="delegate-modal-overlay">
      <div class="modal-card">
        <div class="hud-corner-tl"></div>
        <div class="hud-corner-br"></div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
          <div>
            <div class="section-index-label" style="margin-bottom: 2px;">
              <span class="cyan-num">01</span>
              <span class="slash">/</span>
              <span class="section-name">DELEGATE ACCESS</span>
            </div>
            <h3 style="font-family: var(--font-serif-display); font-size: 22px; color: #ffffff; font-weight: 500;">
              ${headingHtml}
            </h3>
          </div>
          <button id="btn-close-modal" style="background: none; border: none; color: var(--text-dim); font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
        </div>

        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderFormState(): string {
  const state = appStore.getState();

  return renderModalShell(
    'Get your <span class="cyan-text" style="color: var(--cyan-glow);">Delegate ID</span>',
    `
      <p style="font-family: var(--font-sans-ui); font-size: 12.5px; color: var(--text-muted); margin-bottom: 18px; line-height: 1.5;">
        Submit your details for manual verification. Your Delegate ID is issued only after an
        organiser approves your application &mdash; eligible registrations unlock at that point.
      </p>

      <form id="delegate-reg-form" onsubmit="return false;">
        <div class="form-field-group" style="margin-bottom: 12px;">
          <label class="input-field-label">Full Name</label>
          <div class="input-control-box">
            <input type="text" id="delegate-name-input" class="text-input-field" placeholder="Dr. Alex Morgan" />
          </div>
        </div>

        <div class="form-field-group" style="margin-bottom: 12px;">
          <label class="input-field-label">Medical Institution</label>
          <div class="input-control-box">
            <input type="text" id="delegate-college-input" class="text-input-field" placeholder="Institution name" />
          </div>
        </div>

        <div class="admin-field-row" style="margin-bottom: 12px;">
          <div class="form-field-group">
            <label class="input-field-label">Year of Study</label>
            <div class="input-control-box">
              <input type="text" id="delegate-year-input" class="text-input-field" placeholder="Optional" />
            </div>
          </div>

          <div class="form-field-group">
            <label class="input-field-label">Phone</label>
            <div class="input-control-box">
              <input type="tel" id="delegate-phone-input" class="text-input-field" placeholder="Optional" />
            </div>
          </div>
        </div>

        <div class="form-field-group" style="margin-bottom: 20px;">
          <label class="input-field-label">Email</label>
          <div class="input-control-box">
            <input type="email" id="delegate-email-input" class="text-input-field" value="${escapeHtml(state.userEmail)}" />
          </div>
        </div>

        <button type="submit" id="btn-submit-delegate" class="btn-chamfer-primary">
          <span class="btn-cyan-bead"></span>
          <span>SUBMIT APPLICATION</span>
          <span>→</span>
        </button>
      </form>
    `
  );
}

function renderPendingState(delegate: registration.DelegateApplication): string {
  return renderModalShell(
    'Application submitted.',
    `
      <p style="font-family: var(--font-sans-ui); font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5;">
        Your Delegate application is awaiting manual verification by the organising team.
        Eligible registrations unlock once it is approved &mdash; no Delegate ID exists until then.
      </p>

      <div class="delegate-status-panel">
        <div class="delegate-status-row">
          <span class="delegate-status-key">NAME</span>
          <span class="delegate-status-val">${escapeHtml(delegate.fullName)}</span>
        </div>
        <div class="delegate-status-row">
          <span class="delegate-status-key">INSTITUTION</span>
          <span class="delegate-status-val">${escapeHtml(delegate.institution)}</span>
        </div>
        <div class="delegate-status-row">
          <span class="delegate-status-key">EMAIL</span>
          <span class="delegate-status-val">${escapeHtml(delegate.email)}</span>
        </div>
      </div>

      <button type="button" id="btn-done-delegate" class="btn-chamfer-dark" style="margin-top: 18px;">
        DONE
      </button>
    `
  );
}

function renderApprovedState(delegate: registration.DelegateApplication): string {
  return renderModalShell(
    'Delegate Pass Active',
    `
      <p style="font-family: var(--font-sans-ui); font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5;">
        Your STRIATUM 4.0 credentials are verified. You can now register for events that require an
        approved Delegate ID.
      </p>

      <div class="hud-delegate-card" style="cursor: default;">
        <div class="hud-corner-tl"></div>
        <div class="hud-corner-br"></div>

        <div class="hud-label-top">DELEGATE ID</div>

        <div class="hud-id-value-row">
          <span class="hud-id-prefix" style="font-family: var(--font-mono-meta); color: var(--cyan-glow); font-size: 20px; letter-spacing: 1.5px;">
            ${escapeHtml(delegate.delegateId ?? '')}
          </span>
          <span class="event-badge-pill" style="margin-left: auto;">VERIFIED</span>
        </div>

        <div class="hud-status-row">
          <span class="hud-status-label">STATUS</span>
          <span class="hud-status-val registered">ACTIVE (APPROVED)</span>
        </div>
      </div>

      <button type="button" id="btn-done-delegate" class="btn-chamfer-dark" style="margin-top: 18px; border-color: var(--cyan-glow); color: var(--cyan-glow);">
        DONE
      </button>
    `
  );
}

function renderRejectedState(delegate: registration.DelegateApplication): string {
  return renderModalShell(
    'Application needs attention.',
    `
      <p style="font-family: var(--font-sans-ui); font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5;">
        Your Delegate application could not be verified.
      </p>

      <div class="delegate-status-panel delegate-status-panel--rejected">
        <div class="delegate-status-row">
          <span class="delegate-status-key">REASON</span>
        </div>
        <p class="delegate-rejection-text">${escapeHtml(delegate.rejectionReason ?? 'No reason provided.')}</p>
      </div>

      <button type="button" id="btn-resubmit-delegate" class="btn-chamfer-primary" style="margin-top: 18px;">
        <span class="btn-cyan-bead"></span>
        <span>SUBMIT A NEW APPLICATION</span>
        <span>→</span>
      </button>
    `
  );
}

export function renderDelegateModal(): string {
  const status = registration.getDelegateStatus();
  const delegate = registration.getDelegate();

  if (!forceFormView && status === 'pending' && delegate) {
    return renderPendingState(delegate);
  }
  if (!forceFormView && status === 'approved' && delegate) {
    return renderApprovedState(delegate);
  }
  if (!forceFormView && status === 'rejected' && delegate) {
    return renderRejectedState(delegate);
  }
  return renderFormState();
}

export function attachDelegateModalEvents(): void {
  const overlay = document.getElementById('delegate-modal-overlay');
  const btnClose = document.getElementById('btn-close-modal');
  const form = document.getElementById('delegate-reg-form');
  const btnDone = document.getElementById('btn-done-delegate');
  const btnResubmit = document.getElementById('btn-resubmit-delegate');

  const closeModal = (): void => {
    forceFormView = false;
    appStore.setDelegateModalOpen(false);
  };

  if (btnClose) {
    btnClose.addEventListener('click', closeModal);
  }

  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });
  }

  if (btnDone) {
    btnDone.addEventListener('click', closeModal);
  }

  if (btnResubmit) {
    btnResubmit.addEventListener('click', () => {
      forceFormView = true;
      appStore.refresh();
    });
  }

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const nameInput = document.getElementById('delegate-name-input') as HTMLInputElement | null;
      const collegeInput = document.getElementById('delegate-college-input') as HTMLInputElement | null;
      const yearInput = document.getElementById('delegate-year-input') as HTMLInputElement | null;
      const phoneInput = document.getElementById('delegate-phone-input') as HTMLInputElement | null;
      const emailInput = document.getElementById('delegate-email-input') as HTMLInputElement | null;

      const fullName = (nameInput?.value ?? '').trim();
      const institution = (collegeInput?.value ?? '').trim();
      const email = (emailInput?.value ?? '').trim();
      const yearOfStudy = (yearInput?.value ?? '').trim();
      const phone = (phoneInput?.value ?? '').trim();

      if (!fullName) {
        appStore.showToast('Full Name is required');
        return;
      }
      if (!institution) {
        appStore.showToast('Medical Institution is required');
        return;
      }
      if (!email) {
        appStore.showToast('Email is required');
        return;
      }

      registration.applyForDelegate({
        fullName,
        institution,
        email,
        yearOfStudy: yearOfStudy || undefined,
        phone: phone || undefined
      });

      forceFormView = false;
      appStore.showToast('Delegate application submitted for verification');
    });
  }
}
