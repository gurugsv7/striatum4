import { appStore } from '../state/appStore.ts';

/**
 * Courses the brochure names as eligible (see the NEURONOVA eligibility block in
 * the event master data). "Select a course" is the empty default so the form
 * never silently submits a course the delegate did not choose.
 */
const COURSE_OPTIONS = [
  '',
  'MBBS',
  'BDS / Dentistry',
  'Allied Health Sciences',
  'Biomedical Sciences',
  'Pharmacy',
  'Nursing',
  'Physiotherapy',
  'Postgraduate'
];

const YEAR_OPTIONS = ['', '1st Year', '2nd Year', '3rd Year', 'Final Year', 'CRRI / Intern'];

export function renderDelegateRegistrationView(): string {
  const state = appStore.getState();
  const form = state.delegateForm;
  const isAqualume = form.tier === 'AQUALUME';
  const isSynexa = form.tier === 'SYNEXA';

  return `
    <div class="screen-content mockup-flow-page">
      
      <!-- Top Bar: Back Chevron, Brand & Right Motto Block -->
      <header class="mockup-top-bar">
        <button class="top-bar-back-btn" id="btn-delegate-reg-back" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div class="top-bar-brand">
          <div class="top-bar-brand-title">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="top-bar-brand-meta">IGMCRI · SIGMA 2026</div>
        </div>
      </header>

      <!-- Main Timeline Flow Wrap with Vertical Guide Rail -->
      <div class="mockup-timeline-wrap">
        <div class="mockup-timeline-rail"></div>

        <!-- 01 / DELEGATE ACCESS Hero Block -->
        <div class="timeline-step-block">
          <div class="timeline-bead"></div>
          
          <div class="timeline-step-header">
            <span class="step-label-tag">01 <span style="opacity: 0.5;">/</span> DELEGATE ACCESS</span>
          </div>

          <h1 class="hero-display-title">
            Become a<br />
            Delegate<span class="cyan-dot">.</span>
          </h1>

          <p class="hero-display-sub">
            Register as a delegate to unlock workshops, network, and attend STRIATUM 4.0.
          </p>
        </div>

        <!-- CHOOSE YOUR DELEGATE PASS (HORIZONTAL ALIGNED TIERS) -->
        <div class="timeline-step-block">
          <div class="timeline-bead"></div>

          <div class="timeline-step-header">
            <span class="step-label-tag">CHOOSE YOUR DELEGATE PASS</span>
          </div>

          <!-- HORIZONTAL 2-COLUMN PASS TIERS -->
          <div class="horizontal-pass-grid" role="radiogroup" aria-label="Select Delegate Pass Tier">
            
            <!-- Aqualume Pass Card -->
            <div 
              class="pass-tier-card ${isAqualume ? 'active' : ''}" 
              id="pass-opt-aqualume"
              role="radio"
              aria-checked="${isAqualume}"
              tabindex="0"
            >
              <div>
                <div class="pass-card-radio-circle">
                  <span class="pass-card-radio-inner"></span>
                </div>
                <div class="pass-card-title serif-font">AQUALUME</div>
                <div class="pass-card-price">₹500</div>
                <div class="pass-card-dash"></div>
                <div class="pass-card-desc">
                  Delegate access to<br />
                  STRIATUM 4.0
                </div>
              </div>

              <!-- Bioluminescent Jellyfish Artwork -->
              <div class="pass-card-art-bg">
                <img src="/art_jellyfish_card.png" alt="Aqualume Jellyfish" />
              </div>
            </div>

            <!-- Synexa Pass Card -->
            <div 
              class="pass-tier-card ${isSynexa ? 'active' : ''}" 
              id="pass-opt-synexa"
              role="radio"
              aria-checked="${isSynexa}"
              tabindex="0"
            >
              <div>
                <div class="pass-card-radio-circle">
                  <span class="pass-card-radio-inner"></span>
                </div>
                <div class="pass-card-title serif-font">SYNEXA</div>
                <div class="pass-card-price">₹600</div>
                <div class="pass-card-dash"></div>
                <ul class="pass-card-bullets">
                  <li>Delegate access</li>
                  <li>Gala Night access</li>
                  <li>Treasure Hunt access</li>
                </ul>
              </div>

              <!-- Bioluminescent Manta Ray Artwork -->
              <div class="pass-card-art-bg">
                <img src="/art_manta_card.png" alt="Synexa Manta" />
              </div>
            </div>

          </div>
        </div>

        <!-- YOUR DETAILS Form Section -->
        <div class="timeline-step-block">
          <div class="timeline-bead"></div>

          <div class="timeline-step-header">
            <span class="step-label-tag">YOUR DETAILS</span>
          </div>

          <form class="details-input-stack" id="delegate-form" onsubmit="return false;">
            
            <!-- Full Name -->
            <div class="input-card-box">
              <div class="input-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="input-card-col">
                <label class="input-card-lbl" for="delegate-fullname">Full Name</label>
                <input 
                  type="text" 
                  id="delegate-fullname" 
                  class="input-card-core" 
                  placeholder="Enter your full name" 
                  value="${escapeHtml(form.fullName)}" 
                />
              </div>
            </div>

            <!-- Phone Number -->
            <div class="input-card-box">
              <div class="input-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div class="input-card-col">
                <label class="input-card-lbl" for="delegate-phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="delegate-phone" 
                  class="input-card-core" 
                  placeholder="Enter your phone number" 
                  value="${escapeHtml(form.phone)}" 
                />
              </div>
            </div>

            <!-- Email Address -->
            <div class="input-card-box">
              <div class="input-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <div class="input-card-col">
                <label class="input-card-lbl" for="delegate-email">Email Address</label>
                <input 
                  type="email" 
                  id="delegate-email" 
                  class="input-card-core" 
                  placeholder="you@example.com" 
                  value="${escapeHtml(form.email)}" 
                />
              </div>
            </div>

            <!-- College / Institution -->
            <div class="input-card-box">
              <div class="input-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2 2 7h20L12 2z"/>
                </svg>
              </div>
              <div class="input-card-col">
                <label class="input-card-lbl" for="delegate-college">College / Institution</label>
                <input 
                  type="text" 
                  id="delegate-college" 
                  class="input-card-core" 
                  placeholder="Enter your college or institution" 
                  value="${escapeHtml(form.college)}" 
                />
              </div>
            </div>

            <!-- Split 2-col: Course & Year -->
            <div class="input-card-split-row">
              <div class="input-card-box">
                <div class="input-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <div class="input-card-col">
                  <label class="input-card-lbl" for="delegate-course">Course</label>
                  <select id="delegate-course" class="input-card-select">
                    ${COURSE_OPTIONS.map(
                      option =>
                        `<option value="${escapeHtml(option)}" ${form.course === option ? 'selected' : ''}>${
                          option === '' ? 'Select course' : escapeHtml(option)
                        }</option>`
                    ).join('')}
                  </select>
                </div>
              </div>

              <div class="input-card-box">
                <div class="input-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" x2="16" y1="2" y2="6"/>
                    <line x1="8" x2="8" y1="2" y2="6"/>
                    <line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                </div>
                <div class="input-card-col">
                  <label class="input-card-lbl" for="delegate-year">Year of Study</label>
                  <select id="delegate-year" class="input-card-select">
                    ${YEAR_OPTIONS.map(
                      option =>
                        `<option value="${escapeHtml(option)}" ${
                          form.yearOfStudy === option ? 'selected' : ''
                        }>${option === '' ? 'Select year' : escapeHtml(option)}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Beveled Action Button connected to Timeline -->
        <div class="timeline-step-block button-step-block">
          <div class="timeline-bead" style="top: 20px;"></div>

          <button class="beveled-cyan-btn" id="btn-proceed-to-payment">
            <span>Proceed to Payment</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14m-7-7 7 7-7 7"/>
            </svg>
          </button>

          <div class="btn-bottom-subtext">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            <span>You'll be asked to pay via UPI and upload the payment screenshot in the next step.</span>
          </div>
        </div>

      </div>

      <!-- Footer Metadata -->
      <footer class="mockup-flow-footer">
        <div class="footer-left-col">
          <span class="f-title-main">STRIATUM 4.0</span>
          <span class="f-title-sub">MEDICAL SYMPOSIUM · 2026</span>
          <span class="f-line-dash"></span>
        </div>
      </footer>

    </div>
  `;
}

export function attachDelegateRegistrationEvents(): void {
  const optAqualume = document.getElementById('pass-opt-aqualume');
  const optSynexa = document.getElementById('pass-opt-synexa');
  const btnBack = document.getElementById('btn-delegate-reg-back');
  const btnProceed = document.getElementById('btn-proceed-to-payment');

  const saveFormState = () => {
    const fullName = (document.getElementById('delegate-fullname') as HTMLInputElement)?.value ?? '';
    const phone = (document.getElementById('delegate-phone') as HTMLInputElement)?.value ?? '';
    const email = (document.getElementById('delegate-email') as HTMLInputElement)?.value ?? '';
    const college = (document.getElementById('delegate-college') as HTMLInputElement)?.value ?? '';
    const course = (document.getElementById('delegate-course') as HTMLSelectElement)?.value ?? '';
    const yearOfStudy = (document.getElementById('delegate-year') as HTMLSelectElement)?.value ?? '';

    appStore.setDelegateForm({
      fullName,
      phone,
      email,
      college,
      course,
      yearOfStudy
    });
  };

  optAqualume?.addEventListener('click', () => {
    saveFormState();
    appStore.setPassTier('AQUALUME');
  });

  optSynexa?.addEventListener('click', () => {
    saveFormState();
    appStore.setPassTier('SYNEXA');
  });

  btnBack?.addEventListener('click', () => {
    saveFormState();
    appStore.setScreen('home');
  });

  btnProceed?.addEventListener('click', () => {
    saveFormState();
    const st = appStore.getState().delegateForm;

    // The college becomes the institution on the delegate application an
    // organiser verifies, so it is required rather than optional.
    const missing: string[] = [];
    if (!st.fullName.trim()) missing.push('name');
    if (!st.phone.trim()) missing.push('phone number');
    if (!st.email.trim()) missing.push('email');
    if (!st.college.trim()) missing.push('college');

    if (missing.length) {
      appStore.showToast('Please fill in your ' + missing.join(', ') + '.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email.trim())) {
      appStore.showToast('That email address does not look right.');
      return;
    }

    appStore.setScreen('delegate-payment');
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
