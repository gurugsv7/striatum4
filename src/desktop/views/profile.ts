import { appStore } from '../../state/appStore.ts';
import * as registration from '../../services/registrationService.ts';
import { signOut } from '../../services/authService.ts';
import { getProfileGender, setProfileGender } from '../../views/ProfileView.ts';
import { EVENTS } from '../../data/events.ts';
import { crest, esc, icon } from '../shell.ts';
import { minutesOf } from '../../services/time.ts';

/**
 * Desktop profile.
 *
 * The phone hides personal details and settings behind bottom sheets because it
 * has nowhere else to put them. Here the credential sits on the left and the
 * editable details sit beside it, open — no modal, no round-trip.
 */

/** The delegate's own next confirmed session, or null when they have none. */
function nextCommitted() {
  const committed = new Set(registration.committedEventIds());
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    EVENTS.filter(event => committed.has(event.id) && event.isoDate && event.isoDate >= todayIso)
      .sort((a, b) => {
        if (a.isoDate !== b.isoDate) return a.isoDate!.localeCompare(b.isoDate!);
        return (minutesOf(a.startTime) ?? 0) - (minutesOf(b.startTime) ?? 0);
      })[0] ?? null
  );
}

function actionCard(id: string, num: string, title: string, sub: string, iconMarkup: string): string {
  return `
    <button class="d-action" id="${id}">
      <span class="d-action-top">
        <span class="d-action-icon">${iconMarkup}</span>
        <span class="d-action-num">${num}</span>
      </span>
      <span class="d-action-title">${title}</span>
      <span class="d-action-sub">${sub}</span>
    </button>`;
}

export function renderDesktopProfile(): string {
  const state = appStore.getState();
  const delegate = registration.getDelegate();
  const status = registration.getDelegateStatus();
  const approved = status === 'approved';

  const rawName = delegate?.fullName || state.delegateForm.fullName || '';
  const firstName = rawName.trim().split(' ')[0] || 'Delegate';
  const institution = delegate?.institution || state.delegateForm.college || '';
  const email = delegate?.email || state.userEmail || '';
  const phone = delegate?.phone || state.delegateForm.phone || '';
  const year = delegate?.yearOfStudy || state.delegateForm.yearOfStudy || '';

  const role = approved ? 'Delegate' : status === 'pending' ? 'Delegate (pending)' : 'Delegate';
  // Issued on application, not on approval — see ProfileView.
  const code = delegate?.delegateId ?? 'NOT ISSUED';

  const gender = getProfileGender();
  const avatar = gender === 'female' ? '/femaleprofile.webp' : '/maleprofile.png';

  const groups = registration.getMyEvents();
  const next = nextCommitted();

  return `
    <div class="d-page">
      <section class="d-prof-hero">
        <div class="d-prof-hero-bg" aria-hidden="true"></div>
        <div class="d-prof-hero-veil" aria-hidden="true"></div>

        <div class="d-prof-hero-inner d-pad">
          <div class="d-prof-identity">
            <div class="d-prof-avatar">
              <img src="${avatar}" alt="Generic ${gender} profile icon" />
            </div>
            <div class="d-prof-names">
              <span class="d-prof-hello">Hello,</span>
              <h1 class="d-prof-name">${esc(firstName)}<span class="d-dot">.</span></h1>
              <span class="d-prof-role">${esc(role.toUpperCase())} &middot; ${esc(institution.toUpperCase())}</span>
            </div>
          </div>

          <div class="d-prof-code-col">
            <span class="d-prof-code">${esc(code)}</span>
            <span class="d-prof-motto">&ldquo;Same curiosity. A deeper tomorrow.&rdquo;</span>
          </div>
        </div>
      </section>

      <div class="d-prof-body d-pad">
        <div class="d-prof-left">
          <div class="d-pass">
            <span class="d-pass-bloom" aria-hidden="true"></span>
            <div class="d-pass-top">
              <div class="d-pass-kicker">
                <b>STRIATUM 4.0</b>
                <em>DELEGATE PASS</em>
              </div>
              <span class="d-pass-crest">${crest(22)}</span>
            </div>

            <div class="d-pass-main">
              <div>
                <span class="d-hud-label">DELEGATE ID</span>
                <div class="d-pass-id">${esc(code)}</div>
                ${rawName ? `<div class="d-pass-holder">${esc(rawName)}</div>` : ''}
                <div class="d-pass-tier">
                  ${esc(state.delegateForm.tier)} TIER${year ? ' &middot; ' + esc(year.toUpperCase()) : ''}
                </div>
              </div>
            </div>

            <div class="d-pass-foot">
              <span>${approved ? 'VERIFIED BY ORGANISERS' : 'NOT YET VERIFIED'}</span>
              <em>${
                approved
                  ? 'ACTIVE'
                  : status === 'none'
                  ? 'NOT REGISTERED'
                  : status === 'pending'
                  ? 'AWAITING VERIFICATION'
                  : status.toUpperCase()
              }</em>
            </div>
          </div>

          <button class="d-btn-ghost" id="btn-profile-view-pass">
            <span>${approved || status === 'pending' ? 'View delegate pass' : 'Register as delegate'}</span>
            ${icon('arrow', 17, 2)}
          </button>

          <form class="d-panel-soft d-editform" id="d-profile-form">
            <span class="d-filter-legend">PERSONAL DETAILS</span>
            <p class="d-readonly-note">
              As recorded on your delegate application, which the organisers verify
              against. Contact the registration desk to correct anything here.
            </p>
            <div class="d-editform-grid">
              <div class="d-editfield">
                <label>FULL NAME</label>
                <p class="d-readonly-value">${esc(rawName || 'Not provided')}</p>
              </div>
              <div class="d-editfield">
                <label>EMAIL</label>
                <p class="d-readonly-value">${esc(email || 'Not provided')}</p>
              </div>
              <div class="d-editfield">
                <label>PHONE</label>
                <p class="d-readonly-value">${esc(phone || 'Not provided')}</p>
              </div>
              <div class="d-editfield">
                <label>INSTITUTION</label>
                <p class="d-readonly-value">${esc(institution || 'Not provided')}</p>
              </div>
              <div class="d-editfield" style="grid-column: 1 / -1;">
                <label>YEAR OF STUDY</label>
                <p class="d-readonly-value">${esc(year || 'Not provided')}</p>
              </div>
            </div>

            <div class="d-editform-foot">
              <div class="d-avatar-toggle" role="group" aria-label="Profile icon">
                <button type="button" class="d-avatar-opt ${gender === 'male' ? 'is-on' : ''}" data-d-gender="male">ICON A</button>
                <button type="button" class="d-avatar-opt ${gender === 'female' ? 'is-on' : ''}" data-d-gender="female">ICON B</button>
              </div>
            </div>
          </form>
        </div>

        <div class="d-prof-right">
          <div class="d-actions">
            ${actionCard(
              'btn-card-registrations',
              '01',
              'My bookings',
              `${groups.confirmed.length} confirmed &middot; ${groups.pending.length} pending`,
              icon('mine', 19)
            )}
            ${actionCard('btn-card-schedule', '02', 'My schedule', 'The full six-day programme', icon('clock', 19))}
            ${actionCard('btn-card-cart', '03', 'Your selection', `${registration.cartCount()} event${registration.cartCount() === 1 ? '' : 's'} in the cart`, icon('cart', 19))}
          </div>

          ${
            next
              ? `<div class="d-nextup">
                  <div class="d-nextup-head">
                    <span class="d-column-title">NEXT UP</span>
                    <span class="d-meta">${next.date ?? ''}</span>
                  </div>
                  <div class="d-nextup-body">
                    <div class="d-nextup-day">
                      <span class="d-nextup-daynum">${(next.date ?? '').split(' ')[0] || '—'}</span>
                      <span class="d-hud-label">${(next.date ?? '').split(' ')[1] ?? ''}</span>
                    </div>
                    <span class="d-nextup-rule"></span>
                    <div class="d-nextup-main">
                      <h3 class="d-nextup-title">${next.name}</h3>
                      ${
                        next.startTime
                          ? `<span class="d-nextup-time">${next.startTime}${next.endTime ? ' – ' + next.endTime : ''}</span>`
                          : ''
                      }
                      <span class="d-nextup-meta">${next.format}${next.venue ? ' &middot; ' + next.venue : ''}</span>
                    </div>
                    <button class="d-link" data-open-event-id="${next.id}"><span>OPEN</span><span>&rarr;</span></button>
                  </div>
                </div>`
              : `<div class="d-nextup">
                  <div class="d-nextup-head">
                    <span class="d-column-title">NEXT UP</span>
                  </div>
                  <p class="d-lede">Nothing confirmed yet. Registered events appear here with their date and time.</p>
                </div>`
          }

          <div class="d-panel-soft" style="padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span class="d-filter-legend">ACCOUNT</span>
              <span style="font-size: 13px; color: var(--text-muted);">${esc(email || 'Signed in')}</span>
            </div>
            <button class="d-danger-btn" id="btn-profile-sign-out">Sign out</button>
          </div>

          <div style="display: flex; gap: 18px; flex-wrap: wrap;">
            <button class="d-link" id="d-prof-privacy"><span>PRIVACY POLICY</span><span>&rarr;</span></button>
            <button class="d-link" id="d-prof-terms"><span>REGISTRATION TERMS</span><span>&rarr;</span></button>
            <button class="d-link" id="d-prof-credits"><span>WEBSITE CREDITS</span><span>&rarr;</span></button>
          </div>
        </div>
      </div>
    </div>`;
}

export function attachDesktopProfile(): void {
  document.getElementById('btn-profile-view-pass')?.addEventListener('click', () => {
    const status = registration.getDelegateStatus();
    appStore.setScreen(status === 'approved' || status === 'pending' ? 'delegate-confirm' : 'delegate-registration');
  });

  // The only route to My Events now that it has left the bottom navigation.
  document.getElementById('btn-card-registrations')?.addEventListener('click', () => {
    appStore.setScreen('my-events');
  });

  document.getElementById('btn-card-schedule')?.addEventListener('click', () => {
    appStore.setScreen('programme');
  });

  document.getElementById('btn-card-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

  document.querySelectorAll<HTMLElement>('[data-open-event-id]').forEach(element => {
    element.addEventListener('click', () => {
      const id = element.getAttribute('data-open-event-id');
      if (id) appStore.openEvent(id);
    });
  });

  // The avatar choice is a local preference; apply it immediately.
  document.querySelectorAll<HTMLButtonElement>('[data-d-gender]').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-d-gender');
      if (value !== 'male' && value !== 'female') return;
      setProfileGender(value);
      appStore.refresh();
    });
  });

  document.getElementById('d-profile-form')?.addEventListener('submit', event => {
    // Nothing to submit: the delegate application is the server's record and
    // the avatar buttons save themselves. See ProfileView for the full note.
    event.preventDefault();
  });

  document.getElementById('btn-profile-sign-out')?.addEventListener('click', async event => {
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true;
    let message = 'Signed out of STRIATUM 4.0';
    try {
      message = (await signOut()).message;
    } finally {
      // Leaving the screen is not conditional on the network. Whatever the
      // server did, the delegate pressed Sign out and must end up signed out.
      appStore.signOut();
      appStore.showToast(message);
    }
  });

  document.getElementById('d-prof-privacy')?.addEventListener('click', () => appStore.setScreen('privacy'));
  document.getElementById('d-prof-terms')?.addEventListener('click', () => appStore.setScreen('terms'));
  document.getElementById('d-prof-credits')?.addEventListener('click', () => appStore.setScreen('credits'));
}
