import { appStore, ScreenType } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { renderBottomNav, renderHomeIndicatorBar, attachBottomNavEvents } from './BottomNav.ts';

export function renderDesktopSurround(screenContentHtml: string): string {
  const state = appStore.getState();

  const screens: { id: ScreenType; num: string; label: string; desc: string }[] = [
    { id: 'onboarding', num: '00', label: 'Sign In', desc: 'Crest & Access' },
    { id: 'home', num: '01', label: 'Homepage', desc: 'Symposium Journey' },
    { id: 'explore', num: '02', label: 'Explore Events', desc: '26 Events Directory' },
    { id: 'event-details', num: '03', label: 'Event Details', desc: 'Adaptive Event Page' },
    { id: 'delegate-registration', num: '04', label: 'Delegate Registration', desc: 'Pass Tier & Form' },
    { id: 'delegate-payment', num: '05', label: 'Delegate Payment', desc: 'UPI QR & Screenshot' },
    { id: 'delegate-confirm', num: '06', label: 'Delegate Pass Ready', desc: 'Holographic Pass' },
    { id: 'cart', num: '07', label: 'Cart', desc: 'Selected Events' },
    { id: 'event-payment', num: '08', label: 'Event Payment', desc: 'Checkout & Proof' },
    { id: 'my-events', num: '09', label: 'My Events', desc: 'Registration Status' },
    { id: 'programme', num: '10', label: 'Programme', desc: 'Day Timeline' },
    { id: 'profile', num: '11', label: 'Delegate Profile', desc: 'Credential & Pass' },
    { id: 'admin', num: '12', label: 'Verification', desc: 'Manual Payment Review' }
  ];

  const hasBottomNav = ['home', 'explore', 'my-events', 'profile', 'delegate-confirm'].includes(state.currentScreen);

  const delegate = registration.getDelegate();
  const delegateApproved = delegate?.status === 'approved';
  // Never surface an identifier before manual approval has issued one.
  const delegateCode = delegateApproved
    ? (delegate?.delegateId ?? 'S4 — ISSUED')
    : delegate?.status === 'pending'
    ? 'S4 — AWAITING VERIFICATION'
    : delegate?.status === 'rejected'
    ? 'S4 — NEEDS ATTENTION'
    : 'S4 — UNREGISTERED';

  return `
    <div class="desktop-workbench-root" id="desktop-workbench">
      
      <!-- ===================================== -->
      <!-- LEFT SIDEBAR: Brand, Nav & Controls   -->
      <!-- ===================================== -->
      <aside class="workbench-left-sidebar" aria-label="Symposium Navigation & Controls">
        
        <!-- Brand Block -->
        <div class="sidebar-brand-block">
          <div class="sidebar-brand-badge">
            <span class="brand-pulse-dot"></span>
            <span class="sidebar-brand-title">STRIATUM 4.0</span>
          </div>
          <div class="sidebar-institution-text">
            INDIRA GANDHI MEDICAL COLLEGE &amp; RI
          </div>
          <div class="sidebar-motto-tag">
            SIGMA 2026 · MEDICAL SYMPOSIUM
          </div>
        </div>

        <!-- Screens Navigation List -->
        <nav class="sidebar-nav-container" aria-label="Screens">
          <div class="sidebar-section-header">
            <span>SCREENS / MOCKUPS</span>
            <span class="section-count">${screens.length}</span>
          </div>

          <div class="sidebar-screen-items">
            ${screens.map(s => {
              const isActive = state.currentScreen === s.id;
              return `
                <button 
                  class="sidebar-screen-nav-btn ${isActive ? 'active' : ''}" 
                  data-screen-target="${s.id}"
                  id="nav-to-${s.id}"
                >
                  <span class="screen-item-num">${s.num}</span>
                  <div class="screen-item-text">
                    <span class="screen-item-title">${s.label}</span>
                    <span class="screen-item-desc">${s.desc}</span>
                  </div>
                  <span class="screen-item-indicator">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </nav>

        <!-- Device View & Scale Controls -->
        <div class="sidebar-device-box">
          <div class="sidebar-section-header">
            <span>DEVICE MOCKUP SIZE</span>
          </div>

          <div class="device-identity-row">
            <div class="device-phone-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                <path d="M12 18h.01"/>
              </svg>
            </div>
            <div class="device-meta-col">
              <span class="device-name">Apple iPhone 15 Pro</span>
              <span class="device-dims">Exact 393 × 852 px</span>
            </div>
          </div>

          <div class="scale-switcher-row">
            <button class="scale-btn active" data-scale-val="fit" id="btn-scale-fit">Fit Screen</button>
            <button class="scale-btn" data-scale-val="0.9" id="btn-scale-90">90%</button>
            <button class="scale-btn" data-scale-val="1.0" id="btn-scale-100">100%</button>
          </div>
        </div>

        <!-- Delegate Status Card -->
        <div class="sidebar-delegate-card" id="sidebar-delegate-box">
          <div class="delegate-card-header">
            <span class="delegate-dot" style="background: ${delegateApproved ? 'var(--cyan-glow)' : 'var(--text-dim)'};"></span>
            <span class="delegate-title">DELEGATE ACCESS</span>
          </div>
          <div class="delegate-id-code">
            ${delegateCode}
          </div>
          <button class="action-link-cyan" id="btn-sidebar-delegate-action" style="font-size: 10px; margin-top: 6px;">
            ${delegateApproved ? 'Manage Delegate Pass →' : 'Register as Delegate →'}
          </button>
        </div>

      </aside>

      <!-- ===================================== -->
      <!-- RIGHT STAGE: Pure Mobile Screen Frame -->
      <!-- ===================================== -->
      <section class="workbench-right-stage" id="workbench-stage">
        
        <!-- Scalable phone container -->
        <div class="phone-viewport-container" id="phone-container-wrapper">
          
          <!-- Exact iPhone 15 Pro Physical Canvas -->
          <main class="mobile-canvas-frame" id="mobile-phone-frame">
            
            <!-- 1. Fixed Background Layer (Canvas Backdrop) -->
            <div class="screen-bg-container">
              <div class="screen-bg-base"></div>
              <div class="screen-bg-onboarding-layer"></div>
              <div class="screen-bg-onboarding-overlay"></div>
            </div>

            <!-- 2. Independent Scrollable Viewport Wrapper -->
            <div class="app-viewport-wrapper" id="viewport-scroller">
              ${screenContentHtml}
            </div>

            <!-- 3. Fixed Bottom Navigation Bar or Home Indicator -->
            ${hasBottomNav ? renderBottomNav(state.currentScreen) : renderHomeIndicatorBar()}

          </main>

        </div>

      </section>

      <!-- Floating Toast Feedback Notice -->
      <div class="toast-notice ${state.notificationMessage ? 'visible' : ''}" id="toast-notice"
           role="status" aria-live="polite" aria-atomic="true">
        ${state.notificationMessage || ''}
      </div>

    </div>
  `;
}

export function attachDesktopSurroundEvents(): void {
  // Screen selector handlers
  const switchButtons = document.querySelectorAll<HTMLButtonElement>('.sidebar-screen-nav-btn');
  switchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-screen-target') as ScreenType;
      if (target) {
        appStore.setScreen(target);
      }
    });
  });

  // Delegate action button in sidebar
  const btnDelegate = document.getElementById('btn-sidebar-delegate-action');
  if (btnDelegate) {
    btnDelegate.addEventListener('click', () => {
      appStore.setScreen('delegate-registration');
    });
  }

  // Scale buttons
  const phoneWrapper = document.getElementById('phone-container-wrapper');
  const scaleButtons = document.querySelectorAll<HTMLButtonElement>('.scale-btn');
  
  function applyScale(scaleVal: string) {
    if (!phoneWrapper) return;
    scaleButtons.forEach(b => b.classList.remove('active'));
    
    if (scaleVal === 'fit') {
      const stage = document.getElementById('workbench-stage');
      const stageHeight = stage ? stage.clientHeight : window.innerHeight;
      const targetHeight = 852 + 32; // phone frame + margins
      const scale = Math.min(1.0, Math.max(0.65, (stageHeight - 40) / targetHeight));
      phoneWrapper.style.transform = `scale(${scale})`;
      const fitBtn = document.getElementById('btn-scale-fit');
      if (fitBtn) fitBtn.classList.add('active');
    } else {
      const num = parseFloat(scaleVal);
      phoneWrapper.style.transform = `scale(${num})`;
      const activeBtn = document.querySelector(`.scale-btn[data-scale-val="${scaleVal}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  }

  scaleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-scale-val') || 'fit';
      applyScale(val);
    });
  });

  // Automatically apply fit on resize
  window.addEventListener('resize', () => {
    const isFitActive = document.getElementById('btn-scale-fit')?.classList.contains('active');
    if (isFitActive) {
      applyScale('fit');
    }
  });

  // Initial fit execution
  setTimeout(() => {
    applyScale('fit');
  }, 50);

  // Attach bottom nav clicks
  attachBottomNavEvents();
}
