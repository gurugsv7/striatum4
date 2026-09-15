import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { signOut } from '../services/authService.ts';
import { escapeHtml } from '../services/text.ts';

const GENDER_KEY = 'striatum4.profile.gender';

export function getProfileGender(): 'male' | 'female' {
  const saved = localStorage.getItem(GENDER_KEY);
  if (saved === 'female' || saved === 'male') return saved;
  return 'male';
}

export function setProfileGender(gender: 'male' | 'female'): void {
  localStorage.setItem(GENDER_KEY, gender);
}

export function renderProfileView(): string {
  const state = appStore.getState();
  const delegate = registration.getDelegate();
  const status = registration.getDelegateStatus();
  const approved = status === 'approved';

  /*
   * Nothing here is invented. These fields used to fall back to the mockup's
   * sample delegate — "Guru", "IGMCRI", "3rd Year MBBS", "S4 / 01" — so a
   * student who had only just signed in was shown somebody else's name,
   * college and credential as if they were their own.
   *
   * The delegate application is the record. Failing that, the name the
   * account was created with, which login() puts on the delegate form.
   * Failing that, nothing at all.
   */
  const rawName = delegate?.fullName || state.delegateForm?.fullName || '';
  const firstName = rawName.trim().split(' ')[0] || 'Delegate';
  const institution = delegate?.institution || state.delegateForm?.college || '';
  const role = approved ? 'Delegate' : status === 'pending' ? 'Delegate (Pending)' : 'Delegate';
  // The ID is issued the moment the application is filed, before verification,
  // so a pending delegate has a real one to be shown.
  const delegateCode = delegate?.delegateId ?? 'NOT ISSUED';

  const cartCount = registration.cartCount();

  const gender = getProfileGender();
  const avatarSrc = gender === 'female' ? '/femaleprofile.webp' : '/maleprofile.png';

  return `
    <div class="profile-screen-container">
      
      <!-- ================================================================= -->
      <!-- 1. HERO BACKDROP SECTION (OCEAN SUNBURST + SWIMMING WHALE)        -->
      <!-- ================================================================= -->
      <section class="profile-hero-backdrop">
        
        <!-- Top App Header inside Hero -->
        <header class="profile-top-header">
          <div class="profile-brand-col">
            <div class="profile-brand-title">
              STRIATUM <span class="cyan-text">4.0</span>
            </div>
            <div class="profile-brand-sub">
              IGMCRI · SIGMA 2026
            </div>
          </div>

          <div class="header-right-block">
            <button class="header-cart-btn ${cartCount ? 'has-items' : ''}" id="btn-profile-cart" title="View cart">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6.2"/>
                <circle cx="10" cy="20" r="1"/>
                <circle cx="18" cy="20" r="1"/>
              </svg>
              ${cartCount ? `<span class="cart-count-bead">${cartCount}</span>` : ''}
            </button>
          </div>
        </header>

        <!-- Identity & Swimming Whale Row -->
        <div class="profile-identity-row">
          
          <div class="profile-left-block">
            <!-- Generic profile icon; no personal portrait is used. -->
            <div class="profile-avatar-wrapper">
              <div class="profile-avatar-ring">
                <img src="${avatarSrc}" alt="Generic ${gender} profile icon" class="profile-avatar-img profile-avatar-generic ${gender}" id="profile-avatar-display" />
              </div>
            </div>

            <!-- Identity Typography -->
            <div class="profile-identity-info">
              <div class="profile-greeting-hello">Hello,</div>
              <h1 class="profile-greeting-name">
                ${escapeHtml(firstName)}<span class="cyan-dot">.</span>
              </h1>
              <div class="profile-role-title">${escapeHtml(role)}</div>
              <div class="profile-role-inst">${escapeHtml(institution)}</div>
              <div class="profile-motto-quote">
                &ldquo;Same curiosity. A deeper tomorrow.&rdquo;
              </div>
            </div>
          </div>

          <!-- Right Expedition Code beneath swimming whale -->
          <div class="profile-right-pillar">
            <div class="profile-s4-code-row">
              <span class="profile-cyan-pulse-dot"></span>
              <span class="profile-s4-code">${escapeHtml(delegateCode)}</span>
            </div>
          </div>

        </div>

      </section>

      <!-- ================================================================= -->
      <!-- 2. "MY DELEGATE ID" BANNER CARD                                   -->
      <!-- ================================================================= -->
      <section class="profile-banner-section">
        <div class="profile-delegate-banner-card">
          <div class="profile-banner-left">
            <div class="profile-banner-label">MY DELEGATE ID</div>
            <div class="profile-banner-sub">Your pass to STRIATUM 4.0</div>
            <button class="profile-view-pass-btn" id="btn-profile-view-pass">
              <span>View Pass</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M5 12h14m-7-7 7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div class="profile-banner-right-graphic">
            <img 
              src="/assets/profile/pass_3d_card.png" 
              alt="STRIATUM 4.0 Holographic Pass" 
              class="profile-pass-3d-img"
            />
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 3. 2x3 ACTION CARDS GRID                                          -->
      <!-- ================================================================= -->
      <section class="profile-cards-section">
        <div class="profile-cards-grid">
          
          <!-- My Registrations includes the delegate's event bookings. -->
          <button class="profile-action-card" id="btn-card-registrations">
            <div class="profile-card-left-col">
              <div class="profile-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div class="profile-card-text-col">
                <div class="profile-card-title">My Bookings</div>
                <div class="profile-card-desc">My Events &middot; view and manage</div>
              </div>
            </div>
            <svg class="profile-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <!-- Schedule -->
          <button class="profile-action-card" id="btn-card-schedule">
            <div class="profile-card-left-col">
              <div class="profile-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="profile-card-text-col">
                <div class="profile-card-title">Schedule</div>
                <div class="profile-card-desc">Your personalised plan</div>
              </div>
            </div>
            <svg class="profile-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <!-- Card 5: Personal Details -->
          <button class="profile-action-card" id="btn-card-personal">
            <div class="profile-card-left-col">
              <div class="profile-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="profile-card-text-col">
                <div class="profile-card-title">Personal Details</div>
                <div class="profile-card-desc">View or edit your information</div>
              </div>
            </div>
            <svg class="profile-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <!-- Card 6: The council behind the conclave -->
          <button class="profile-action-card" id="btn-card-council">
            <div class="profile-card-left-col">
              <div class="profile-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="profile-card-text-col">
                <div class="profile-card-title">SIGMA Council</div>
                <div class="profile-card-desc">The students who run the conclave</div>
              </div>
            </div>
            <svg class="profile-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <!-- Card 7: Settings -->
          <button class="profile-action-card" id="btn-card-settings">
            <div class="profile-card-left-col">
              <div class="profile-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div class="profile-card-text-col">
                <div class="profile-card-title">Settings</div>
                <div class="profile-card-desc">Preferences &amp; app settings</div>
              </div>
            </div>
            <svg class="profile-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 4. QUOTE & BIOLUMINESCENT JELLYFISH SECTION                       -->
      <!-- ================================================================= -->
      <section class="profile-quote-section">
        <div class="profile-jellyfish-box">
          <img 
            src="/assets/profile/jellyfish_glowing.png" 
            alt="Bioluminescent Jellyfish" 
            class="profile-jellyfish-img"
          />
        </div>

        <div class="profile-quote-middle-col">
          <div class="profile-quote-head">
            More than an event,<br>
            <span class="cyan-text">a shared current.</span>
          </div>
          <div class="profile-quote-sub">
            Thank you for being a part of STRIATUM 4.0.
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 5. FOOTER SEABED ARTWORK & SIGNOFF                                -->
      <!-- ================================================================= -->
      <footer class="profile-footer-seabed-backdrop">
        <div class="profile-footer-right">
          <div class="profile-footer-brand-title">
            STRIATUM <span class="cyan-text">4.0</span>
          </div>
          <div class="profile-footer-brand-sub">
            IGMCRI · SIGMA 2026
          </div>
        </div>
      </footer>

      <!-- ================================================================= -->
      <!-- 6. MODALS / BOTTOM SHEETS                                         -->
      <!-- ================================================================= -->

      <!-- Personal Details Sheet -->
      <div class="profile-modal-overlay" id="modal-personal-details" role="dialog" aria-modal="true">
        <div class="profile-bottom-sheet">
          <div class="profile-sheet-handle"></div>
          <div class="profile-sheet-header">
            <h2 class="profile-sheet-title">Personal Details</h2>
            <button class="profile-sheet-close-btn" id="btn-close-personal" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form id="form-personal-details">
            <p class="profile-readonly-note">
              These are the details on your delegate application, which the organisers
              verify against. To correct any of them, contact the registration desk.
            </p>

            <div class="profile-field-group">
              <label class="profile-field-label">FULL NAME</label>
              <p class="profile-field-readonly">${escapeHtml(rawName || 'Not provided')}</p>
            </div>

            <div class="profile-field-group">
              <label class="profile-field-label">DELEGATE GENDER / AVATAR</label>
              <div style="display: flex; gap: 16px; margin-top: 6px;">
                <label style="display: flex; align-items: center; gap: 8px; font-family: var(--font-sans-ui); font-size: 13px; color: #ffffff; cursor: pointer;">
                  <input type="radio" name="profile-gender" value="male" ${gender === 'male' ? 'checked' : ''} style="accent-color: var(--cyan-glow); width: 16px; height: 16px;" />
                  <span>Male (Dr.)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-family: var(--font-sans-ui); font-size: 13px; color: #ffffff; cursor: pointer;">
                  <input type="radio" name="profile-gender" value="female" ${gender === 'female' ? 'checked' : ''} style="accent-color: var(--cyan-glow); width: 16px; height: 16px;" />
                  <span>Female (Dr.)</span>
                </label>
              </div>
            </div>

            <div class="profile-field-group">
              <label class="profile-field-label">EMAIL ADDRESS</label>
              <p class="profile-field-readonly">${escapeHtml(delegate?.email || state.userEmail || 'Not provided')}</p>
            </div>

            <div class="profile-field-group">
              <label class="profile-field-label">PHONE NUMBER</label>
              <p class="profile-field-readonly">${escapeHtml(delegate?.phone || 'Not provided')}</p>
            </div>

            <div class="profile-field-group">
              <label class="profile-field-label">COLLEGE / INSTITUTION</label>
              <p class="profile-field-readonly">${escapeHtml(institution || 'Not provided')}</p>
            </div>

            <div class="profile-field-group">
              <label class="profile-field-label">YEAR OF STUDY</label>
              <p class="profile-field-readonly">${escapeHtml(delegate?.yearOfStudy || 'Not provided')}</p>
            </div>

            <button type="submit" class="profile-btn-primary-action" id="btn-save-personal">
              SAVE AVATAR
            </button>
          </form>
        </div>
      </div>

      <!-- Settings Sheet -->
      <div class="profile-modal-overlay" id="modal-settings" role="dialog" aria-modal="true">
        <div class="profile-bottom-sheet">
          <div class="profile-sheet-handle"></div>
          <div class="profile-sheet-header">
            <h2 class="profile-sheet-title">Settings</h2>
            <button class="profile-sheet-close-btn" id="btn-close-settings" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-family: var(--font-sans-ui); font-size: 13px; color: #ffffff;">Conclave Notifications</div>
                <div style="font-family: var(--font-sans-ui); font-size: 10px; color: var(--text-muted);">Alerts for workshops, schedule shifts &amp; venues</div>
              </div>
              <input type="checkbox" checked style="accent-color: var(--cyan-glow); width: 18px; height: 18px; cursor: pointer;" />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-family: var(--font-sans-ui); font-size: 13px; color: #ffffff;">Deep Oceanic Atmosphere</div>
                <div style="font-family: var(--font-sans-ui); font-size: 10px; color: var(--text-muted);">Cinematic audio cues and micro-animations</div>
              </div>
              <input type="checkbox" checked style="accent-color: var(--cyan-glow); width: 18px; height: 18px; cursor: pointer;" />
            </div>

          </div>

          <button class="profile-btn-primary-action" id="btn-profile-sign-out" style="background: rgba(240, 60, 60, 0.15); border: 1px solid rgba(240, 60, 60, 0.4); color: #ff8888;">
            SIGN OUT OF STRIATUM 4.0
          </button>
        </div>
      </div>

    </div>
  `;
}

export function attachProfileEvents(): void {
  // A profile render replaces the whole screen. Always start with sheets
  // closed so a stale class from a previous interaction can never cover the
  // profile or make Settings appear on route entry.
  document.querySelectorAll<HTMLElement>('.profile-modal-overlay').forEach((overlay) => {
    overlay.classList.remove('open');
  });

  // 1. "View Pass" button navigation
  document.getElementById('btn-profile-view-pass')?.addEventListener('click', () => {
    const status = registration.getDelegateStatus();
    if (status === 'approved' || status === 'pending') {
      appStore.setScreen('delegate-confirm');
    } else {
      appStore.setScreen('delegate-registration');
    }
  });

  // Registrations includes the delegate's event and workshop bookings.
  document.getElementById('btn-card-registrations')?.addEventListener('click', () => {
    appStore.setScreen('my-events');
  });

  // Schedule -> Programme timeline
  document.getElementById('btn-card-schedule')?.addEventListener('click', () => {
    appStore.setScreen('programme');
  });

  // 6. Action Card 5: Personal Details -> Open Personal Details Modal
  const modalPersonal = document.getElementById('modal-personal-details');
  document.getElementById('btn-card-personal')?.addEventListener('click', () => {
    modalPersonal?.classList.add('open');
  });
  document.getElementById('btn-close-personal')?.addEventListener('click', () => {
    modalPersonal?.classList.remove('open');
  });

  /*
   * The avatar is the only thing on this sheet the delegate owns.
   *
   * The rest is their delegate application, which organisers verify against —
   * it belongs to the server and there is no RPC to change it. The form used
   * to accept edits to name, college, phone and year, say "Profile updated
   * successfully", and persist none of them: the handler read the fields into
   * locals it never used, so the next sync quietly restored the old values.
   */
  document.getElementById('form-personal-details')?.addEventListener('submit', e => {
    e.preventDefault();
    const chosen = document.querySelector<HTMLInputElement>('input[name="profile-gender"]:checked');
    if (chosen && (chosen.value === 'male' || chosen.value === 'female')) {
      setProfileGender(chosen.value);
      appStore.showToast('Avatar updated');
    }
    modalPersonal?.classList.remove('open');
    appStore.refresh();
  });

  // 7. Action Card 6: Settings -> Open Settings Sheet
  const modalSettings = document.getElementById('modal-settings');
  document.getElementById('btn-card-council')?.addEventListener('click', () => {
    appStore.setScreen('council');
  });

  document.getElementById('btn-card-settings')?.addEventListener('click', () => {
    modalSettings?.classList.add('open');
  });
  document.getElementById('btn-close-settings')?.addEventListener('click', () => {
    modalSettings?.classList.remove('open');
  });

  // Sign out button
  document.getElementById('btn-profile-sign-out')?.addEventListener('click', async (e) => {
    modalSettings?.classList.remove('open');
    const button = e.currentTarget as HTMLButtonElement;
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

  // Close modals on overlay backdrop click
  document.querySelectorAll<HTMLDivElement>('.profile-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  // Cart button in header
  document.getElementById('btn-profile-cart')?.addEventListener('click', () => {
    appStore.setScreen('cart');
  });

}
