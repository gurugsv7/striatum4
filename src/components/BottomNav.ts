import { appStore, ScreenType } from '../state/appStore.ts';

export function renderBottomNav(activeTab: ScreenType = 'home'): string {
  const tabs: { id: ScreenType; label: string; icon: string }[] = [
    {
      id: 'home',
      label: 'HOME',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>`
    },
    {
      id: 'explore',
      label: 'EXPLORE',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>`
    },
    {
      id: 'combos',
      label: 'COMBOS',
      // Two events converging into one bundle, drawn from the same bead-and-rail
      // vocabulary as the expedition timeline rather than a shopping glyph.
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8.4 8.2 15 11"/>
        <path d="M8.4 15.8 15 13"/>
        <circle cx="5.5" cy="7" r="2.4"/>
        <circle cx="5.5" cy="17" r="2.4"/>
        <circle cx="17.6" cy="12" r="2.6"/>
      </svg>`
    },
    {
      id: 'profile',
      label: 'PROFILE',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`
    }
  ];

  // Calculate indicator position percentage
  const tabIndex = tabs.findIndex(t => t.id === activeTab);
  const activeIdx = tabIndex >= 0 ? tabIndex : 0;
  const leftPercent = activeIdx * 25;

  return `
    <nav class="bottom-nav-container" id="bottom-nav" aria-label="Main Navigation">
      <!-- Glowing active sliding indicator on top edge -->
      <div class="bottom-nav-track">
        <div class="bottom-nav-indicator" style="left: ${leftPercent}%;">
          <div class="indicator-glow-dot"></div>
          <div class="indicator-glow-line"></div>
        </div>
      </div>

      <div class="bottom-nav-items">
        ${tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return `
            <button class="nav-tab-btn ${isActive ? 'active' : ''}" data-nav-id="${tab.id}" id="nav-btn-${tab.id}">
              <div class="nav-icon-wrap">${tab.icon}</div>
              <span class="nav-label">${tab.label}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- iOS Home Bar -->
      <div class="ios-home-indicator"></div>
    </nav>
  `;
}

export function renderHomeIndicatorBar(): string {
  return `
    <div class="ios-bottom-bar-container">
      <div class="ios-home-indicator"></div>
    </div>
  `;
}

export function attachBottomNavEvents(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.nav-tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const navId = btn.getAttribute('data-nav-id') as ScreenType;
      if (navId) {
        appStore.setScreen(navId);
      }
    });
  });
}
