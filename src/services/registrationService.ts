import { SymposiumEvent } from '../data/eventTypes.ts';
import { EVENTS, getEvent, requireEvent, eventContextLine } from '../data/events.ts';
import { evaluateDiscount, DiscountLineInput } from './discounts.ts';
import {
  Participation,
  resolvePrice,
  defaultParticipation,
  formatINR,
  CURRENT_PRICING_PHASE
} from './pricing.ts';
import * as remote from './remote.ts';
import { isSupabaseConfigured } from './supabaseClient.ts';
import { getCurrentUser } from './authService.ts';

/* ============================================================================
 * STRIATUM 4.0 — registration & payment domain service.
 *
 * This module is the single authority for what a delegate owes and what they are
 * registered for. Views must never compute a payable total themselves; they call
 * priceCart() / createOrder() and render what comes back.
 *
 * PERSISTENCE: the symposium currently has no server, so state lives in
 * localStorage behind this one facade. Every mutation goes through here, so
 * swapping the backing store for real API calls is a change to load()/save() and
 * the exported surface only — no view touches storage directly.
 * ========================================================================== */

export type OrderStatus =
  | 'cart'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type DelegateStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type CtaState =
  | 'add_to_cart'
  | 'in_cart'
  | 'under_review'
  | 'registered'
  | 'full'
  | 'closed'
  | 'not_registerable';

export interface CartItem {
  eventId: string;
  participation: Participation;
  addedAt: number;
}

export interface OrderLine {
  eventId: string;
  /** Snapshotted so historical orders never change when prices or names change. */
  eventName: string;
  eventCode: string;
  context: string;
  category: SymposiumEvent['category'];
  date?: string;
  startTime?: string;
  participation: Participation;
  unitPrice: number;
  priceBasis: string;
}

export interface PaymentProof {
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
}

export interface Order {
  id: string;
  /** Display form, e.g. "S4 / 0007". */
  reference: string;
  lines: OrderLine[];
  subtotal: number;
  discountAmount: number;
  discountRuleId: string | null;
  discountLabel: string | null;
  total: number;
  pricingPhase: string;
  status: OrderStatus;
  createdAt: number;
  submittedAt?: number;
  reviewedAt?: number;
  proof?: PaymentProof;
  rejectionReason?: string;
}

export interface Registration {
  id: string;
  orderId: string;
  eventId: string;
  participation: Participation;
  confirmedAt: number;
}

export interface DelegateApplication {
  fullName: string;
  institution: string;
  yearOfStudy?: string;
  phone?: string;
  email: string;
  status: DelegateStatus;
  delegateId?: string;
  submittedAt: number;
  reviewedAt?: number;
  rejectionReason?: string;
}

interface PersistedState {
  version: 1;
  cart: CartItem[];
  orders: Order[];
  registrations: Registration[];
  delegate: DelegateApplication | null;
  orderSeq: number;
  delegateSeq: number;
}

const STORAGE_KEY = 'striatum4.registration.v1';
/** Payment proofs are kept under their own per-order keys, never in a shared blob. */
const PROOF_KEY_PREFIX = 'striatum4.proof.';

const EMPTY: PersistedState = {
  version: 1,
  cart: [],
  orders: [],
  registrations: [],
  delegate: null,
  orderSeq: 0,
  delegateSeq: 0
};

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.version !== 1) return { ...EMPTY };
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

let state: PersistedState = load();

type Listener = () => void;
const listeners = new Set<Listener>();

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — in-memory state stays correct for this session */
  }
  listeners.forEach(fn => fn());
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ------------------------------------------------------------- server sync --
 * Orders, registrations, delegate applications and payment proofs live in
 * Supabase so organisers can actually see them. The cart deliberately stays on
 * the device: it is a draft selection, and losing it costs nobody a payment.
 *
 * Reads stay synchronous for the views by serving an in-memory snapshot that
 * this module refreshes after every mutation.
 * -------------------------------------------------------------------------- */

/** True once a signed-in session exists and the backend is configured. */
export function isRemote(): boolean {
  return isSupabaseConfigured() && getCurrentUser() !== null;
}

let isAdminUser = false;
export function isAdmin(): boolean {
  return isAdminUser;
}

function adoptSnapshot(snapshot: remote.RemoteSnapshot): void {
  state.orders = snapshot.orders.map(order => ({
    id: order.id,
    reference: order.reference,
    lines: order.lines.map(line => ({
      eventId: line.eventId,
      eventName: line.eventName,
      eventCode: line.eventCode,
      context: line.context,
      category: line.category as SymposiumEvent['category'],
      date: line.date,
      startTime: line.startTime,
      participation: line.participation,
      unitPrice: line.unitPrice,
      priceBasis: line.priceBasis
    })),
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    discountRuleId: null,
    discountLabel: order.discountLabel,
    total: order.total,
    pricingPhase: CURRENT_PRICING_PHASE,
    status: order.status as OrderStatus,
    createdAt: order.createdAt,
    submittedAt: order.submittedAt,
    reviewedAt: order.reviewedAt,
    proof: order.proofPath
      ? {
          fileName: order.proofPath.split('/').pop() ?? 'payment',
          mimeType: order.proofPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
          size: 0,
          uploadedAt: order.submittedAt ?? order.createdAt
        }
      : undefined,
    rejectionReason: order.rejectionReason
  }));

  state.registrations = snapshot.registrations.map(r => ({
    id: r.id,
    orderId: r.orderId,
    eventId: r.eventId,
    participation: r.participation,
    confirmedAt: r.confirmedAt
  }));

  const d = snapshot.delegate;
  state.delegate = d
    ? {
        fullName: d.fullName,
        institution: d.institution,
        email: d.email,
        yearOfStudy: d.yearOfStudy,
        phone: d.phone,
        status: d.status,
        delegateId: d.delegateId,
        submittedAt: d.submittedAt,
        reviewedAt: d.reviewedAt,
        rejectionReason: d.rejectionReason
      }
    : null;

  remoteDelegates = snapshot.allDelegates;
  isAdminUser = snapshot.isAdmin;
  proofPaths = new Map(snapshot.orders.filter(o => o.proofPath).map(o => [o.id, o.proofPath as string]));
}

/** Every delegate application, for the verification console. */
let remoteDelegates: remote.RemoteDelegate[] = [];
let proofPaths = new Map<string, string>();

/** Pulls the authoritative state down from the server. */
export async function hydrate(): Promise<void> {
  if (!isRemote()) return;
  const snapshot = await remote.fetchSnapshot();
  adoptSnapshot(snapshot);
  save();
}

/* ---------------------------------------------------------------- delegate -- */

export function getDelegate(): DelegateApplication | null {
  return state.delegate ? { ...state.delegate } : null;
}

export function getDelegateStatus(): DelegateStatus {
  return state.delegate?.status ?? 'none';
}

export function hasApprovedDelegatePass(): boolean {
  return state.delegate?.status === 'approved';
}

/**
 * Files a delegate application. Approval is manual and happens server-side, so
 * no Delegate ID is issued here.
 */
export async function applyForDelegate(input: {
  fullName: string;
  institution: string;
  email: string;
  yearOfStudy?: string;
  phone?: string;
}): Promise<{ ok: boolean; message: string }> {
  if (isRemote()) {
    const result = await remote.applyForDelegateRemote(input);
    if (result.ok) await hydrate();
    else save();
    return result;
  }

  // Offline fallback so the flow still works before sign-in is configured.
  state.delegate = { ...input, status: 'pending', submittedAt: Date.now() };
  save();
  return { ok: true, message: 'Delegate application submitted for verification' };
}

function nextDelegateId(): string {
  state.delegateSeq += 1;
  return 'S4-' + String(state.delegateSeq).padStart(4, '0') + '-26';
}

/* -------------------------------------------------------------------- cart -- */

export function getCart(): CartItem[] {
  return state.cart.map(item => ({ ...item }));
}

export function cartCount(): number {
  return state.cart.length;
}

export function isInCart(eventId: string): boolean {
  return state.cart.some(i => i.eventId === eventId);
}

export function isRegistered(eventId: string): boolean {
  return state.registrations.some(r => r.eventId === eventId);
}

const OPEN_ORDER_STATUSES: OrderStatus[] = ['awaiting_payment', 'payment_submitted', 'under_review'];

/** True when a created-but-unapproved order already contains this event. */
export function isPendingReview(eventId: string): boolean {
  return state.orders.some(
    o => OPEN_ORDER_STATUSES.includes(o.status) && o.lines.some(l => l.eventId === eventId)
  );
}

export interface CartMutationResult {
  ok: boolean;
  message: string;
}

export function addToCart(eventId: string, participation?: Participation): CartMutationResult {
  const event = getEvent(eventId);
  if (!event) return { ok: false, message: 'Unknown event.' };
  if (!event.registerable) return { ok: false, message: event.name + ' is not open for registration.' };
  if (isRegistered(eventId)) return { ok: false, message: 'You are already registered for ' + event.name + '.' };
  if (isPendingReview(eventId)) {
    return { ok: false, message: event.name + ' is already in an order awaiting verification.' };
  }
  if (isInCart(eventId)) return { ok: false, message: event.name + ' is already in your cart.' };
  if (isFull(eventId)) return { ok: false, message: event.name + ' is full.' };

  state.cart.push({
    eventId,
    participation: participation ?? defaultParticipation(event),
    addedAt: Date.now()
  });
  save();
  return { ok: true, message: event.name + ' added to cart' };
}

export function removeFromCart(eventId: string): CartMutationResult {
  const before = state.cart.length;
  state.cart = state.cart.filter(i => i.eventId !== eventId);
  if (state.cart.length === before) return { ok: false, message: 'Not in cart.' };
  save();
  return { ok: true, message: 'Removed from cart' };
}

export function setCartParticipation(eventId: string, participation: Participation): void {
  const item = state.cart.find(i => i.eventId === eventId);
  if (!item) return;
  item.participation = participation;
  save();
}

export function clearCart(): void {
  state.cart = [];
  save();
}

/* ---------------------------------------------------------------- capacity -- */

export interface Capacity {
  /** Published slot count, or null when the event has no stated limit. */
  slots: number | null;
  confirmed: number;
  /** Seats held by orders awaiting manual verification. */
  pending: number;
  available: number | null;
}

export function getCapacity(eventId: string): Capacity {
  const event = getEvent(eventId);
  const slots = event?.slots ?? null;

  const confirmed = state.registrations.filter(r => r.eventId === eventId).length;
  const pending = state.orders.filter(
    o => OPEN_ORDER_STATUSES.includes(o.status) && o.lines.some(l => l.eventId === eventId)
  ).length;

  return {
    slots,
    confirmed,
    pending,
    available: slots === null ? null : Math.max(0, slots - confirmed - pending)
  };
}

export function isFull(eventId: string): boolean {
  const cap = getCapacity(eventId);
  return cap.available !== null && cap.available <= 0;
}

/* ------------------------------------------------------------- eligibility -- */

export interface EligibilityIssue {
  code: 'delegate_pass' | 'already_registered' | 'pending_review' | 'full' | 'closed' | 'not_registerable';
  /** Blocking issues stop checkout; non-blocking ones are warnings. */
  blocking: boolean;
  message: string;
}

/** Every reason this event cannot currently be paid for by this delegate. */
export function checkEligibility(eventId: string): EligibilityIssue[] {
  const event = getEvent(eventId);
  const issues: EligibilityIssue[] = [];
  if (!event) return issues;

  if (!event.registerable || event.status === 'not_registerable') {
    issues.push({
      code: 'not_registerable',
      blocking: true,
      message: event.name + ' does not use delegate registration.'
    });
    return issues;
  }
  if (event.status === 'closed') {
    issues.push({ code: 'closed', blocking: true, message: 'Registration for ' + event.name + ' is closed.' });
  }
  if (isRegistered(eventId)) {
    issues.push({
      code: 'already_registered',
      blocking: true,
      message: 'You are already registered for ' + event.name + '.'
    });
  }
  if (isPendingReview(eventId)) {
    issues.push({
      code: 'pending_review',
      blocking: true,
      message: event.name + ' is in an order awaiting payment verification.'
    });
  }
  if (isFull(eventId)) {
    issues.push({ code: 'full', blocking: true, message: event.name + ' has no seats remaining.' });
  }
  if (event.delegatePassRequirement === 'required' && !hasApprovedDelegatePass()) {
    issues.push({
      code: 'delegate_pass',
      blocking: true,
      message: event.name + ' requires an approved Delegate ID.'
    });
  }
  return issues;
}

export function getCtaState(eventId: string): CtaState {
  const event = getEvent(eventId);
  if (!event || !event.registerable) return 'not_registerable';
  if (isRegistered(eventId)) return 'registered';
  if (isPendingReview(eventId)) return 'under_review';
  if (isInCart(eventId)) return 'in_cart';
  if (isFull(eventId)) return 'full';
  if (event.status === 'closed') return 'closed';
  return 'add_to_cart';
}

export const CTA_LABELS: Record<CtaState, string> = {
  add_to_cart: 'ADD TO CART',
  in_cart: 'IN CART · VIEW CART',
  under_review: 'PAYMENT UNDER REVIEW',
  registered: 'REGISTERED',
  full: 'EVENT FULL',
  closed: 'REGISTRATION CLOSED',
  not_registerable: 'NO REGISTRATION REQUIRED'
};

/* -------------------------------------------------------- schedule conflict -- */

function minutesOf(time?: string): number | null {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10) % 12;
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  if (/pm/i.test(match[3])) hours += 12;
  return hours * 60 + mins;
}

export interface ScheduleConflict {
  a: string;
  b: string;
  date: string;
  message: string;
}

/** Overlapping same-day events among a set of ids. A stated start time is required. */
export function findScheduleConflicts(eventIds: string[]): ScheduleConflict[] {
  const dated = eventIds
    .map(id => getEvent(id))
    .filter((e): e is SymposiumEvent => Boolean(e && e.isoDate && e.startTime));

  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < dated.length; i++) {
    for (let j = i + 1; j < dated.length; j++) {
      const a = dated[i];
      const b = dated[j];
      if (a.isoDate !== b.isoDate) continue;

      const aStart = minutesOf(a.startTime);
      const bStart = minutesOf(b.startTime);
      if (aStart === null || bStart === null) continue;
      const aEnd = minutesOf(a.endTime) ?? aStart + 60;
      const bEnd = minutesOf(b.endTime) ?? bStart + 60;

      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push({
          a: a.id,
          b: b.id,
          date: a.date ?? a.isoDate ?? '',
          message: a.name + ' and ' + b.name + ' overlap on ' + (a.date ?? a.isoDate) + '.'
        });
      }
    }
  }
  return conflicts;
}

/* ------------------------------------------------------------ cart pricing -- */

export interface PricedLine extends OrderLine {
  issues: EligibilityIssue[];
}

export interface CartPricing {
  lines: PricedLine[];
  subtotal: number;
  discountAmount: number;
  discountLabel: string | null;
  discountRuleId: string | null;
  total: number;
  blockingIssues: EligibilityIssue[];
  conflicts: ScheduleConflict[];
  /** Lines whose fee the brochure does not state — excluded from the total. */
  unpricedEventIds: string[];
}

function buildLine(item: CartItem): { line: PricedLine; unpriced: boolean } {
  const event = requireEvent(item.eventId);
  const price = resolvePrice(event, item.participation);
  return {
    unpriced: price.amount === null,
    line: {
      eventId: event.id,
      eventName: event.name,
      eventCode: event.code,
      context: eventContextLine(event),
      category: event.category,
      date: event.date,
      startTime: event.startTime,
      participation: item.participation,
      unitPrice: price.amount ?? 0,
      priceBasis: price.basis,
      issues: checkEligibility(event.id)
    }
  };
}

/** Authoritative cart calculation. This is the only place a total is produced. */
export function priceCart(): CartPricing {
  const built = state.cart.filter(item => getEvent(item.eventId)).map(buildLine);

  const lines = built.map(b => b.line);
  const unpricedEventIds = built.filter(b => b.unpriced).map(b => b.line.eventId);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice, 0);

  const discountInput: DiscountLineInput[] = lines.map(l => ({
    eventId: l.eventId,
    category: l.category,
    amount: l.unitPrice
  }));
  const discount = evaluateDiscount(discountInput);

  const blockingIssues = lines.flatMap(l => l.issues.filter(i => i.blocking));
  const conflicts = findScheduleConflicts(lines.map(l => l.eventId));

  return {
    lines,
    subtotal,
    discountAmount: discount.amount,
    discountLabel: discount.label,
    discountRuleId: discount.ruleId,
    total: Math.max(0, subtotal - discount.amount),
    blockingIssues,
    conflicts,
    unpricedEventIds
  };
}

/* ------------------------------------------------------------------ orders -- */

function nextOrderReference(): { id: string; reference: string } {
  state.orderSeq += 1;
  const num = String(state.orderSeq).padStart(4, '0');
  return { id: 'order-' + num, reference: 'S4 / ' + num };
}

export interface CreateOrderResult {
  ok: boolean;
  order?: Order;
  issues?: EligibilityIssue[];
  message?: string;
}

/**
 * Revalidates prices, eligibility and availability, applies the active discount,
 * computes the authoritative total, then persists the order with a full snapshot.
 * The cart is only cleared once the order exists.
 */
export async function createOrder(): Promise<CreateOrderResult> {
  if (!state.cart.length) return { ok: false, message: 'Your cart is empty.' };

  const pricing = priceCart();
  if (pricing.blockingIssues.length) {
    return {
      ok: false,
      issues: pricing.blockingIssues,
      message: 'Some events can no longer be registered.'
    };
  }
  if (pricing.unpricedEventIds.length) {
    const names = pricing.unpricedEventIds.map(id => getEvent(id)?.name ?? id).join(', ');
    return { ok: false, message: 'Fees are not yet published for ' + names + '.' };
  }

  if (isRemote()) {
    // The server recomputes every price; we send only what was chosen.
    const result = await remote.createOrderRemote(
      state.cart.map(item => ({ eventId: item.eventId, participation: item.participation }))
    );
    if (!result.ok) return { ok: false, message: result.message };
    state.cart = [];
    await hydrate();
    const created = getOrders().find(o => o.id === result.data?.id) ?? getOrders()[0];
    return { ok: true, order: created };
  }

  const ref = nextOrderReference();
  const order: Order = {
    id: ref.id,
    reference: ref.reference,
    lines: pricing.lines.map(line => {
      const copy: OrderLine = {
        eventId: line.eventId,
        eventName: line.eventName,
        eventCode: line.eventCode,
        context: line.context,
        category: line.category,
        date: line.date,
        startTime: line.startTime,
        participation: line.participation,
        unitPrice: line.unitPrice,
        priceBasis: line.priceBasis
      };
      return copy;
    }),
    subtotal: pricing.subtotal,
    discountAmount: pricing.discountAmount,
    discountRuleId: pricing.discountRuleId,
    discountLabel: pricing.discountLabel,
    total: pricing.total,
    pricingPhase: CURRENT_PRICING_PHASE,
    status: 'awaiting_payment',
    createdAt: Date.now()
  };

  state.orders.push(order);
  state.cart = [];
  save();
  return { ok: true, order: { ...order } };
}

export function getOrders(): Order[] {
  return state.orders.map(o => ({ ...o }));
}

export function getOrder(orderId: string): Order | undefined {
  const found = state.orders.find(o => o.id === orderId);
  return found ? { ...found } : undefined;
}

/** The order the delegate currently needs to act on, if any. */
export function getActiveOrder(): Order | undefined {
  return getOrders()
    .filter(o => ['awaiting_payment', 'payment_submitted', 'under_review', 'rejected'].includes(o.status))
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}

export function cancelOrder(orderId: string): CartMutationResult {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return { ok: false, message: 'Order not found.' };
  if (order.status === 'approved') {
    return { ok: false, message: 'An approved order cannot be cancelled here.' };
  }
  order.status = 'cancelled';
  save();
  return { ok: true, message: 'Order ' + order.reference + ' cancelled' };
}

/* ---------------------------------------------------------- payment proofs -- */

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PROOF_ACCEPTED = ['image/jpeg', 'image/png'];

/**
 * Sniffs the leading bytes rather than trusting the filename or the browser's
 * reported type. Returns the real image type, or null when it is not accepted.
 */
async function sniffImageType(file: File): Promise<string | null> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg';
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return 'image/png';
  }
  return null;
}

export interface ProofValidation {
  ok: boolean;
  message?: string;
  mimeType?: string;
  dataUrl?: string;
}

/**
 * Validates and normalises a payment screenshot for preview.
 *
 * PRIVACY: the resulting image is only ever held in memory or under a per-order
 * private storage key. It is never written to a shareable URL. When this app moves
 * to a server, this function should upload to a private bucket and return a
 * short-lived signed URL instead of a data URL.
 */
export async function prepareProof(file: File): Promise<ProofValidation> {
  if (file.size > PROOF_MAX_BYTES) {
    return { ok: false, message: 'That image is larger than 5 MB. Please upload a smaller screenshot.' };
  }
  const mimeType = await sniffImageType(file);
  if (!mimeType || !PROOF_ACCEPTED.includes(mimeType)) {
    return { ok: false, message: 'Only JPG, JPEG or PNG screenshots can be accepted.' };
  }

  const dataUrl = await downscale(file, mimeType);
  if (!dataUrl) return { ok: false, message: 'That image could not be read. Please try another screenshot.' };
  return { ok: true, mimeType, dataUrl };
}

/** Keeps proofs small enough to store, and legible enough for an admin to read. */
function downscale(file: File, mimeType: string): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const original = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const maxEdge = 1400;
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        if (scale === 1) return resolve(original);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(original);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(mimeType === 'image/png' ? 'image/png' : 'image/jpeg', 0.86));
      };
      img.onerror = () => resolve(original);
      img.src = original;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function proofKey(orderId: string): string {
  return PROOF_KEY_PREFIX + orderId;
}

/** Reads a stored proof image. Only the owning delegate and an admin reach this. */
const signedProofUrls = new Map<string, string>();

/**
 * A displayable link to a stored proof.
 *
 * Remote proofs need a short-lived signed URL, which cannot be fetched
 * synchronously during render. This returns the cached link if we have one and
 * warms it otherwise, notifying listeners when it arrives.
 */
export function readProofImage(orderId: string): string | null {
  if (isRemote()) {
    const cached = signedProofUrls.get(orderId);
    if (cached) return cached;
    void warmProofUrl(orderId);
    return null;
  }
  try {
    return localStorage.getItem(proofKey(orderId));
  } catch {
    return null;
  }
}

const warming = new Set<string>();

async function warmProofUrl(orderId: string): Promise<void> {
  const path = proofPaths.get(orderId);
  if (!path || warming.has(orderId)) return;
  warming.add(orderId);
  const url = await remote.getProofUrl(path);
  warming.delete(orderId);
  if (url) {
    signedProofUrls.set(orderId, url);
    listeners.forEach(fn => fn());
  }
}

export interface SubmitProofResult {
  ok: boolean;
  message: string;
}

/**
 * Attaches a verified screenshot to an order and moves it into manual review.
 * Only an order awaiting payment or sent back for re-upload accepts a submission,
 * which is what prevents an accidental duplicate submission.
 */
export async function submitPaymentProof(
  orderId: string,
  proof: { fileName: string; mimeType: string; size: number; dataUrl: string; blob?: Blob }
): Promise<SubmitProofResult> {
  if (isRemote()) {
    const blob = proof.blob ?? dataUrlToBlob(proof.dataUrl, proof.mimeType);
    if (!blob) return { ok: false, message: 'That screenshot could not be read.' };
    const result = await remote.submitPaymentProofRemote(orderId, {
      blob,
      mimeType: proof.mimeType,
      size: proof.size
    });
    if (result.ok) await hydrate();
    return result;
  }

  const order = state.orders.find(o => o.id === orderId);
  if (!order) return { ok: false, message: 'Order not found.' };
  if (!['awaiting_payment', 'rejected'].includes(order.status)) {
    return { ok: false, message: 'This order has already been submitted for verification.' };
  }

  try {
    localStorage.setItem(proofKey(orderId), proof.dataUrl);
  } catch {
    return { ok: false, message: 'Could not store the screenshot on this device. Try a smaller image.' };
  }

  order.proof = {
    fileName: proof.fileName,
    mimeType: proof.mimeType,
    size: proof.size,
    uploadedAt: Date.now()
  };
  order.status = 'under_review';
  order.submittedAt = Date.now();
  order.rejectionReason = undefined;
  save();
  return { ok: true, message: 'Payment proof submitted for verification' };
}

/** Converts a stored data URL back to a Blob for upload. */
function dataUrlToBlob(dataUrl: string, mimeType: string): Blob | null {
  try {
    const base64 = dataUrl.split(',')[1];
    if (!base64) return null;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------- admin -- */

export function listOrdersForReview(): Order[] {
  return getOrders()
    .filter(o => ['payment_submitted', 'under_review'].includes(o.status))
    .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
}

export function listAllOrdersForAdmin(): Order[] {
  return getOrders().sort((a, b) => b.createdAt - a.createdAt);
}

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

/**
 * Approves a payment and confirms every registration on the order together.
 * Either all lines become registrations or none do — a partially approved order
 * would leave a delegate paid up but unregistered.
 */
export async function approveOrder(orderId: string): Promise<AdminActionResult> {
  if (isRemote()) {
    const result = await remote.approveOrderRemote(orderId);
    if (result.ok) await hydrate();
    return result;
  }
  return approveOrderLocal(orderId);
}

function approveOrderLocal(orderId: string): AdminActionResult {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return { ok: false, message: 'Order not found.' };
  if (order.status === 'approved') return { ok: false, message: 'Order is already approved.' };

  const now = Date.now();
  const newRegistrations: Registration[] = order.lines.map((line, index) => ({
    id: order.id + '-reg-' + (index + 1),
    orderId: order.id,
    eventId: line.eventId,
    participation: line.participation,
    confirmedAt: now
  }));

  // Applied as one commit so approval can never half-succeed.
  state.registrations = [
    ...state.registrations.filter(r => r.orderId !== order.id),
    ...newRegistrations
  ];
  order.status = 'approved';
  order.reviewedAt = now;
  order.rejectionReason = undefined;
  save();

  return {
    ok: true,
    message: 'Order ' + order.reference + ' approved · ' + newRegistrations.length + ' registrations confirmed'
  };
}

export async function rejectOrder(orderId: string, reason: string): Promise<AdminActionResult> {
  if (!reason.trim()) return { ok: false, message: 'A rejection reason is required.' };
  if (isRemote()) {
    const result = await remote.rejectOrderRemote(orderId, reason.trim());
    if (result.ok) await hydrate();
    return result;
  }
  return rejectOrderLocal(orderId, reason);
}

function rejectOrderLocal(orderId: string, reason: string): AdminActionResult {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return { ok: false, message: 'Order not found.' };
  if (!reason.trim()) return { ok: false, message: 'A rejection reason is required.' };

  order.status = 'rejected';
  order.reviewedAt = Date.now();
  order.rejectionReason = reason.trim();
  save();
  return { ok: true, message: 'Order ' + order.reference + ' sent back for re-upload' };
}

/** Common admin rejection reasons — shown as one-tap choices. */
export const REJECTION_REASONS = [
  'Amount does not match the order total.',
  'Screenshot is unclear.',
  'Transaction details are not visible.',
  'Payment could not be traced.'
];

export function listDelegateApplications(): DelegateApplication[] {
  if (isRemote()) {
    return remoteDelegates.map(d => ({
      fullName: d.fullName,
      institution: d.institution,
      email: d.email,
      yearOfStudy: d.yearOfStudy,
      phone: d.phone,
      status: d.status,
      delegateId: d.delegateId,
      submittedAt: d.submittedAt,
      reviewedAt: d.reviewedAt,
      rejectionReason: d.rejectionReason
    }));
  }
  return state.delegate ? [{ ...state.delegate }] : [];
}

/** Application ids, parallel to listDelegateApplications(), for admin actions. */
export function delegateApplicationIds(): string[] {
  return isRemote() ? remoteDelegates.map(d => d.id) : [];
}

export async function approveDelegate(applicationId?: string): Promise<AdminActionResult> {
  if (isRemote()) {
    const id = applicationId ?? remoteDelegates.find(d => d.status === 'pending')?.id;
    if (!id) return { ok: false, message: 'No delegate application.' };
    const result = await remote.approveDelegateRemote(id);
    if (result.ok) await hydrate();
    return result;
  }
  return approveDelegateLocal();
}

function approveDelegateLocal(): AdminActionResult {
  if (!state.delegate) return { ok: false, message: 'No delegate application.' };
  if (state.delegate.status === 'approved') return { ok: false, message: 'Delegate is already approved.' };
  state.delegate.status = 'approved';
  state.delegate.delegateId = state.delegate.delegateId ?? nextDelegateId();
  state.delegate.reviewedAt = Date.now();
  state.delegate.rejectionReason = undefined;
  save();
  return { ok: true, message: 'Delegate ID ' + state.delegate.delegateId + ' issued' };
}

export async function rejectDelegate(reason: string, applicationId?: string): Promise<AdminActionResult> {
  if (!reason.trim()) return { ok: false, message: 'A rejection reason is required.' };
  if (isRemote()) {
    const id = applicationId ?? remoteDelegates.find(d => d.status === 'pending')?.id;
    if (!id) return { ok: false, message: 'No delegate application.' };
    const result = await remote.rejectDelegateRemote(id, reason.trim());
    if (result.ok) await hydrate();
    return result;
  }
  return rejectDelegateLocal(reason);
}

function rejectDelegateLocal(reason: string): AdminActionResult {
  if (!state.delegate) return { ok: false, message: 'No delegate application.' };
  if (!reason.trim()) return { ok: false, message: 'A rejection reason is required.' };
  state.delegate.status = 'rejected';
  state.delegate.reviewedAt = Date.now();
  state.delegate.rejectionReason = reason.trim();
  save();
  return { ok: true, message: 'Delegate application sent back' };
}

/* --------------------------------------------------------------- my events -- */

export interface MyEventEntry {
  event: SymposiumEvent;
  order: Order;
  line: OrderLine;
}

export interface MyEventsGroups {
  confirmed: MyEventEntry[];
  pending: MyEventEntry[];
  actionRequired: Order[];
}

export function getMyEvents(): MyEventsGroups {
  const confirmed: MyEventEntry[] = [];
  const pending: MyEventEntry[] = [];
  const actionRequired: Order[] = [];

  state.orders.forEach(order => {
    if (order.status === 'cancelled') return;
    if (order.status === 'rejected') {
      actionRequired.push({ ...order });
      return;
    }
    const bucket =
      order.status === 'approved'
        ? confirmed
        : OPEN_ORDER_STATUSES.includes(order.status)
        ? pending
        : null;
    if (!bucket) return;

    order.lines.forEach(line => {
      const event = getEvent(line.eventId);
      if (event) bucket.push({ event, order: { ...order }, line });
    });
  });

  return { confirmed, pending, actionRequired };
}

/** Ids of every event the delegate holds a confirmed or pending place in. */
export function committedEventIds(): string[] {
  const groups = getMyEvents();
  return [...groups.confirmed, ...groups.pending].map(e => e.event.id);
}

/* ------------------------------------------------------------ admin stats -- */

export interface EventDemand {
  eventId: string;
  name: string;
  code: string;
  category: SymposiumEvent['category'];
  slots: number | null;
  confirmed: number;
  pending: number;
  available: number | null;
  /** Money already verified for this event. */
  collected: number;
}

export interface AdminStats {
  delegatesApproved: number;
  delegatesPending: number;
  ordersTotal: number;
  ordersAwaitingReview: number;
  ordersApproved: number;
  ordersNeedingReupload: number;
  registrationsConfirmed: number;
  registrationsPending: number;
  /** Sum of approved order totals — money actually verified. */
  revenueVerified: number;
  /** Sum of totals on orders still in review — money claimed but unverified. */
  revenuePending: number;
  demand: EventDemand[];
}

/**
 * Aggregate figures for the verification console. Revenue is split into
 * verified and pending so an admin never reads unverified claims as income.
 */
export function getAdminStats(): AdminStats {
  const orders = state.orders.filter(o => o.status !== 'cancelled');
  const inReview = orders.filter(o => OPEN_ORDER_STATUSES.includes(o.status));
  const approved = orders.filter(o => o.status === 'approved');
  const rejected = orders.filter(o => o.status === 'rejected');

  const demand: EventDemand[] = EVENTS.filter(e => e.registerable)
    .map(event => {
      const cap = getCapacity(event.id);
      const collected = approved
        .flatMap(o => o.lines)
        .filter(l => l.eventId === event.id)
        .reduce((sum, l) => sum + l.unitPrice, 0);
      return {
        eventId: event.id,
        name: event.name,
        code: event.code,
        category: event.category,
        slots: cap.slots,
        confirmed: cap.confirmed,
        pending: cap.pending,
        available: cap.available,
        collected
      };
    })
    .filter(d => d.confirmed + d.pending > 0 || d.slots !== null)
    .sort((a, b) => b.confirmed + b.pending - (a.confirmed + a.pending));

  const delegate = state.delegate;

  return {
    delegatesApproved: delegate?.status === 'approved' ? 1 : 0,
    delegatesPending: delegate?.status === 'pending' ? 1 : 0,
    ordersTotal: orders.length,
    ordersAwaitingReview: inReview.filter(o => o.status !== 'awaiting_payment').length,
    ordersApproved: approved.length,
    ordersNeedingReupload: rejected.length,
    registrationsConfirmed: state.registrations.length,
    registrationsPending: inReview.reduce((sum, o) => sum + o.lines.length, 0),
    revenueVerified: approved.reduce((sum, o) => sum + o.total, 0),
    revenuePending: inReview.reduce((sum, o) => sum + o.total, 0),
    demand
  };
}

export interface RosterEntry {
  delegateName: string;
  email: string;
  delegateId: string | null;
  delegateStatus: DelegateStatus;
  orderReference: string;
  orderId: string;
  orderStatus: OrderStatus;
  events: string[];
  total: number;
  submittedAt?: number;
}

/**
 * Every person who has started a registration, one row per order, newest first.
 * This is the "who has registered" view — distinct from the review queue, which
 * only shows what still needs an admin decision.
 */
export function getRegistrationRoster(): RosterEntry[] {
  const delegate = state.delegate;
  return state.orders
    .filter(o => o.status !== 'cancelled')
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(order => ({
      delegateName: delegate?.fullName ?? 'Unknown delegate',
      email: delegate?.email ?? '',
      delegateId: delegate?.status === 'approved' ? delegate.delegateId ?? null : null,
      delegateStatus: delegate?.status ?? 'none',
      orderReference: order.reference,
      orderId: order.id,
      orderStatus: order.status,
      events: order.lines.map(l => l.eventName),
      total: order.total,
      submittedAt: order.submittedAt
    }));
}

/* ----------------------------------------------------------------- helpers -- */

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'cart':
      return 'IN CART';
    case 'awaiting_payment':
      return 'AWAITING PAYMENT';
    case 'payment_submitted':
      return 'PAYMENT SUBMITTED';
    case 'under_review':
      return 'UNDER REVIEW';
    case 'approved':
      return 'CONFIRMED';
    case 'rejected':
      return 'ACTION REQUIRED';
    case 'cancelled':
      return 'CANCELLED';
  }
}

/** Clears every locally persisted registration artefact, proofs included. */
export function resetAll(): void {
  state.orders.forEach(o => {
    try {
      localStorage.removeItem(proofKey(o.id));
    } catch {
      /* ignore */
    }
  });
  state = { ...EMPTY };
  save();
}

export { formatINR, EVENTS };
