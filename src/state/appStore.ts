import { SymposiumEvent } from '../data/eventTypes.ts';
import { EVENTS, getEvent } from '../data/events.ts';
import * as registration from '../services/registrationService.ts';

export type ScreenType =
  | 'onboarding'
  | 'home'
  | 'explore'
  | 'event-details'
  | 'delegate-registration'
  | 'delegate-payment'
  | 'delegate-confirm'
  | 'event-payment'
  | 'cart'
  | 'my-events'
  | 'programme'
  | 'profile'
  | 'admin'
  | 'privacy'
  | 'terms';

export type PassTier = 'AQUALUME' | 'SYNEXA';

/**
 * Delegate pass tiers.
 *
 * ⚠ These fees are NOT in the brochure master data — they were added with the
 * pass-tier UI. Confirm with the organisers before launch, and keep them here so
 * there is a single place to correct.
 */
export const DELEGATE_PASS_TIERS: Record<PassTier, { label: string; fee: number }> = {
  AQUALUME: { label: 'AQUALUME', fee: 500 },
  SYNEXA: { label: 'SYNEXA', fee: 600 }
};

export interface DelegateFormData {
  tier: PassTier;
  fullName: string;
  phone: string;
  email: string;
  college: string;
  course: string;
  yearOfStudy: string;
}

export interface StagedPayment {
  orderId: string;
  amount: number;
  tier?: string;
  screenshotUrl: string | null;
  screenshotName: string | null;
}

export interface SelectedCheckoutItem {
  id: string;
  title: string;
  subtitle: string;
  fee: number;
  image: string;
}

/** Secondary (bottom-sheet) filters layered on top of the primary category pills. */
export interface ExploreFilters {
  specialties: string[];
  participation: ('individual' | 'team')[];
  /** Only events that do not require a Delegate Pass. */
  noDelegatePassOnly: boolean;
  /** Only events with seats remaining. */
  availableOnly: boolean;
  /** ISO dates. */
  dates: string[];
}

export const EMPTY_FILTERS: ExploreFilters = {
  specialties: [],
  participation: [],
  noDelegatePassOnly: false,
  availableOnly: false,
  dates: []
};

export interface AppState {
  currentScreen: ScreenType;
  /** Screen to return to when leaving Event Detail. */
  returnScreen: ScreenType;
  selectedEventId: string;
  selectedOrderId: string | null;
  isAuthenticated: boolean;
  userEmail: string;
  searchQuery: string;
  activeCategory: string;
  filters: ExploreFilters;
  selectedProgrammeDate: string | null;
  isFilterSheetOpen: boolean;
  notificationMessage: string | null;
  /** Where to return to when leaving a legal page. */
  legalReturnScreen: ScreenType;
  delegateForm: DelegateFormData;
  delegatePayment: StagedPayment;
  eventPayment: {
    orderId: string;
    items: SelectedCheckoutItem[];
    total: number;
    screenshotUrl: string | null;
    screenshotName: string | null;
  };
}

type Listener = (state: AppState) => void;

class AppStore {
  private state: AppState = {
    currentScreen: 'onboarding',
    returnScreen: 'explore',
    selectedEventId: EVENTS[0]?.id ?? 's4-01',
    selectedOrderId: null,
    isAuthenticated: false,
    userEmail: '',
    searchQuery: '',
    activeCategory: 'ALL',
    filters: { ...EMPTY_FILTERS },
    selectedProgrammeDate: null,
    isFilterSheetOpen: false,
    notificationMessage: null,
    legalReturnScreen: 'onboarding',
    // The form starts empty. Prefilling invents a delegate who does not exist.
    delegateForm: {
      tier: 'AQUALUME',
      fullName: '',
      phone: '',
      email: '',
      college: '',
      course: '',
      yearOfStudy: ''
    },
    delegatePayment: {
      orderId: '',
      amount: DELEGATE_PASS_TIERS.AQUALUME.fee,
      tier: 'AQUALUME',
      screenshotUrl: null,
      screenshotName: null
    },
    // Items and total are derived from the real order at render time — never
    // hardcoded. A fabricated line would show a delegate a fee they never chose.
    eventPayment: {
      orderId: '',
      items: [],
      total: 0,
      screenshotUrl: null,
      screenshotName: null
    }
  };

  private listeners: Set<Listener> = new Set();
  private toastTimer: number | null = null;

  constructor() {
    // Any registration/payment mutation re-renders the active screen.
    registration.subscribe(() => this.notify());
  }

  getState(): AppState {
    return { ...this.state, filters: { ...this.state.filters } };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const current = this.getState();
    this.listeners.forEach(listener => listener(current));
  }

  /** Forces a re-render without changing state. */
  refresh(): void {
    this.notify();
  }

  setScreen(screen: ScreenType): void {
    if (screen === 'event-details' && this.state.currentScreen !== 'event-details') {
      this.state.returnScreen = this.state.currentScreen;
    }
    const leavingLegal = this.state.currentScreen === 'privacy' || this.state.currentScreen === 'terms';
    if ((screen === 'privacy' || screen === 'terms') && !leavingLegal) {
      this.state.legalReturnScreen = this.state.currentScreen;
    }
    this.state.currentScreen = screen;
    this.state.isFilterSheetOpen = false;
    this.notify();
  }

  /**
   * Leaves a legal page. Someone arriving straight from Google's consent screen
   * has no history inside the app, so fall back to sign-in rather than a
   * dead end.
   */
  goBackFromLegal(): void {
    const target = this.state.legalReturnScreen;
    this.state.currentScreen = target;
    this.notify();
  }

  /** Back out of Event Detail to wherever the user came from. */
  goBackFromDetails(): void {
    const target = this.state.returnScreen === 'event-details' ? 'explore' : this.state.returnScreen;
    this.state.currentScreen = target;
    this.notify();
  }

  openEvent(eventId: string): void {
    this.state.selectedEventId = eventId;
    this.setScreen('event-details');
  }

  setSelectedEvent(eventId: string): void {
    this.state.selectedEventId = eventId;
    this.notify();
  }

  getSelectedEvent(): SymposiumEvent {
    return getEvent(this.state.selectedEventId) ?? EVENTS[0];
  }

  setSelectedOrder(orderId: string | null): void {
    this.state.selectedOrderId = orderId;
    this.notify();
  }

  /**
   * Opens the payment screen for a specific order. Everything routes to the
   * single event-payment screen so there is one payment surface, not two that
   * can drift apart.
   */
  openPayment(orderId: string): void {
    this.state.selectedOrderId = orderId;
    this.state.eventPayment.orderId = orderId;
    this.state.eventPayment.screenshotUrl = null;
    this.state.eventPayment.screenshotName = null;
    this.setScreen('event-payment');
  }

  setDelegateForm(updates: Partial<DelegateFormData>): void {
    this.state.delegateForm = { ...this.state.delegateForm, ...updates };
    if (updates.tier) {
      this.state.delegatePayment.tier = updates.tier;
      this.state.delegatePayment.amount = DELEGATE_PASS_TIERS[updates.tier].fee;
    }
    this.notify();
  }

  setPassTier(tier: PassTier): void {
    this.setDelegateForm({ tier });
  }

  setDelegateScreenshot(url: string | null, name: string | null): void {
    this.state.delegatePayment.screenshotUrl = url;
    this.state.delegatePayment.screenshotName = name;
    this.notify();
  }

  setEventScreenshot(url: string | null, name: string | null): void {
    this.state.eventPayment.screenshotUrl = url;
    this.state.eventPayment.screenshotName = name;
    this.notify();
  }

  /**
   * Files the delegate application with the registration service so it reaches
   * the verification console. The pass is NOT active at this point — an
   * organiser still has to approve it, and only then is a Delegate ID issued.
   */
  async confirmDelegateRegistration(): Promise<boolean> {
    const form = this.state.delegateForm;
    const result = await registration.applyForDelegate({
      fullName: form.fullName.trim(),
      institution: form.college.trim(),
      email: form.email.trim(),
      yearOfStudy: form.yearOfStudy || undefined,
      phone: form.phone.trim() || undefined
    });

    // Only report success once the server has actually accepted it. Announcing
    // it first would repeat the fake-receipt mistake in a different place.
    this.showToast(result.message);
    if (result.ok) this.setScreen('delegate-confirm');
    return result.ok;
  }

  login(email: string, fullName?: string): void {
    this.state.isAuthenticated = true;
    this.state.userEmail = email;
    // Prefill the delegate form from the verified identity, but never overwrite
    // something the delegate has already typed themselves.
    if (fullName && !this.state.delegateForm.fullName) {
      this.state.delegateForm = { ...this.state.delegateForm, fullName };
    }
    if (!this.state.delegateForm.email) {
      this.state.delegateForm = { ...this.state.delegateForm, email };
    }
    this.state.currentScreen = 'home';
    this.showToast('Signed in as ' + email);
  }

  signOut(): void {
    this.state.isAuthenticated = false;
    this.state.userEmail = '';
    this.state.currentScreen = 'onboarding';
    this.notify();
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.notify();
  }

  setActiveCategory(category: string): void {
    this.state.activeCategory = category;
    this.notify();
  }

  setFilters(filters: Partial<ExploreFilters>): void {
    this.state.filters = { ...this.state.filters, ...filters };
    this.notify();
  }

  clearFilters(): void {
    this.state.filters = { ...EMPTY_FILTERS };
    this.notify();
  }

  activeFilterCount(): number {
    const f = this.state.filters;
    return (
      f.specialties.length +
      f.participation.length +
      f.dates.length +
      (f.noDelegatePassOnly ? 1 : 0) +
      (f.availableOnly ? 1 : 0)
    );
  }

  setFilterSheetOpen(isOpen: boolean): void {
    this.state.isFilterSheetOpen = isOpen;
    this.notify();
  }

  setSelectedProgrammeDate(iso: string | null): void {
    this.state.selectedProgrammeDate = iso;
    this.notify();
  }



  showToast(message: string): void {
    this.state.notificationMessage = message;
    this.notify();
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.state.notificationMessage = null;
      this.toastTimer = null;
      this.notify();
    }, 3200);
  }
}

export const appStore = new AppStore();
