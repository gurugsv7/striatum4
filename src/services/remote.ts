import { supabase } from './supabaseClient.ts';
import { getCurrentUser } from './authService.ts';

/* ============================================================================
 * Supabase data access.
 *
 * Everything an organiser must be able to see lives here: delegate
 * applications, orders, registrations and payment proofs. The cart deliberately
 * stays on the device — it is a draft selection, and losing it costs nobody a
 * verified payment.
 *
 * Reads hydrate an in-memory snapshot that registrationService serves
 * synchronously, so the views keep their existing shape. Writes go straight to
 * the RPCs, which is what keeps the server the authority on money.
 * ========================================================================== */

export interface RemoteDelegate {
  id: string;
  fullName: string;
  institution: string;
  email: string;
  yearOfStudy?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  delegateId?: string;
  rejectionReason?: string;
  submittedAt: number;
  reviewedAt?: number;
}

export interface RemoteOrderLine {
  eventId: string;
  eventName: string;
  eventCode: string;
  context: string;
  category: string;
  date?: string;
  startTime?: string;
  participation: 'individual' | 'team';
  unitPrice: number;
  priceBasis: string;
}

export interface RemoteOrder {
  id: string;
  reference: string;
  userId: string;
  lines: RemoteOrderLine[];
  subtotal: number;
  discountAmount: number;
  discountLabel: string | null;
  total: number;
  status: string;
  createdAt: number;
  submittedAt?: number;
  reviewedAt?: number;
  proofPath?: string;
  rejectionReason?: string;
}

export interface RemoteRegistration {
  id: string;
  orderId: string;
  eventId: string;
  participation: 'individual' | 'team';
  confirmedAt: number;
}

export interface RemoteSnapshot {
  delegate: RemoteDelegate | null;
  orders: RemoteOrder[];
  registrations: RemoteRegistration[];
  /** Every delegate application, for the verification console. Admins only. */
  allDelegates: RemoteDelegate[];
  isAdmin: boolean;
}

export const EMPTY_SNAPSHOT: RemoteSnapshot = {
  delegate: null,
  orders: [],
  registrations: [],
  allDelegates: [],
  isAdmin: false
};

const PROOF_BUCKET = 'payment-proofs';

function ms(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapDelegate(row: any): RemoteDelegate {
  return {
    id: row.id,
    fullName: row.full_name,
    institution: row.institution,
    email: row.email,
    yearOfStudy: row.year_of_study ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status,
    delegateId: row.delegate_id ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    submittedAt: ms(row.submitted_at),
    reviewedAt: row.reviewed_at ? ms(row.reviewed_at) : undefined
  };
}

function mapOrder(row: any): RemoteOrder {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    lines: (row.order_lines ?? []).map(
      (line: any): RemoteOrderLine => ({
        eventId: line.event_id,
        eventName: line.event_name,
        eventCode: line.event_code,
        context: line.context,
        category: line.category,
        date: line.event_date ?? undefined,
        startTime: line.start_time ?? undefined,
        participation: line.participation,
        unitPrice: line.unit_price,
        priceBasis: line.price_basis ?? ''
      })
    ),
    subtotal: row.subtotal,
    discountAmount: row.discount_amount,
    discountLabel: row.discount_label ?? null,
    total: row.total,
    status: row.status,
    createdAt: ms(row.created_at),
    submittedAt: row.submitted_at ? ms(row.submitted_at) : undefined,
    reviewedAt: row.reviewed_at ? ms(row.reviewed_at) : undefined,
    proofPath: row.proof_path ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Loads everything the signed-in account may see. RLS decides the scope: a
 * delegate gets their own rows, an admin gets all of them, and the same query
 * serves both.
 */
export async function fetchSnapshot(): Promise<RemoteSnapshot> {
  if (!supabase || !getCurrentUser()) return { ...EMPTY_SNAPSHOT };

  const [delegatesRes, ordersRes, registrationsRes, adminRes] = await Promise.all([
    supabase.from('delegate_applications').select('*').order('submitted_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*, order_lines(*)')
      .order('created_at', { ascending: false }),
    supabase.from('registrations').select('*'),
    supabase.rpc('is_admin')
  ]);

  const userId = getCurrentUser()?.id;
  const allDelegates = (delegatesRes.data ?? []).map(mapDelegate);

  return {
    // RLS already limits a delegate to their own row; find ours explicitly so
    // an admin viewing everyone still sees their own status in the app.
    delegate:
      allDelegates.find(
        d => (delegatesRes.data ?? []).find(r => r.id === d.id)?.user_id === userId
      ) ??
      (allDelegates.length === 1 ? allDelegates[0] : null),
    orders: (ordersRes.data ?? []).map(mapOrder),
    registrations: (registrationsRes.data ?? []).map(row => ({
      id: row.id,
      orderId: row.order_id,
      eventId: row.event_id,
      participation: row.participation,
      confirmedAt: ms(row.confirmed_at)
    })),
    allDelegates,
    isAdmin: adminRes.data === true
  };
}

export interface RemoteResult<T = void> {
  ok: boolean;
  message: string;
  data?: T;
}

/** Files a delegate application. Approval remains manual and server-side. */
export async function applyForDelegateRemote(input: {
  fullName: string;
  institution: string;
  email: string;
  yearOfStudy?: string;
  phone?: string;
}): Promise<RemoteResult> {
  const user = getCurrentUser();
  if (!supabase || !user) return { ok: false, message: 'Please sign in first.' };

  const { error } = await supabase.from('delegate_applications').insert({
    user_id: user.id,
    full_name: input.fullName,
    institution: input.institution,
    email: input.email,
    year_of_study: input.yearOfStudy ?? null,
    phone: input.phone ?? null
  });

  if (error) {
    // The partial unique index blocks a second live application.
    if (error.code === '23505') {
      return { ok: false, message: 'You already have a delegate application on file.' };
    }
    return { ok: false, message: error.message };
  }
  return { ok: true, message: 'Delegate application submitted for verification' };
}

/**
 * Creates an order. The client sends only WHAT it wants; create_order re-reads
 * every price, re-checks eligibility and capacity, and computes the total.
 */
export async function createOrderRemote(
  items: { eventId: string; participation: 'individual' | 'team' }[]
): Promise<RemoteResult<RemoteOrder>> {
  if (!supabase || !getCurrentUser()) return { ok: false, message: 'Please sign in first.' };

  const { data, error } = await supabase.rpc('create_order', {
    p_items: items.map(i => ({ event_id: i.eventId, participation: i.participation }))
  });

  if (error) return { ok: false, message: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, message: 'The order could not be created.' };
  return { ok: true, message: 'Order created', data: mapOrder({ ...row, order_lines: [] }) };
}

/**
 * Uploads the screenshot to the private bucket, then records it on the order.
 * The object is keyed by user id, which is what the storage policy checks.
 */
export async function submitPaymentProofRemote(
  orderId: string,
  file: { blob: Blob; mimeType: string; size: number }
): Promise<RemoteResult> {
  const user = getCurrentUser();
  if (!supabase || !user) return { ok: false, message: 'Please sign in first.' };

  const extension = file.mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${user.id}/${orderId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file.blob, { contentType: file.mimeType, upsert: true });

  if (uploadError) return { ok: false, message: uploadError.message };

  const { error } = await supabase.rpc('submit_payment_proof', {
    p_order_id: orderId,
    p_path: path,
    p_mime: file.mimeType,
    p_size: file.size
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Payment proof submitted for verification' };
}

/**
 * Short-lived signed link for a stored proof. There is no public URL — this is
 * the only way an image comes back, and it expires.
 */
export async function getProofUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  return error ? null : data?.signedUrl ?? null;
}

/* ------------------------------------------------------------------ admin -- */

export async function approveOrderRemote(orderId: string): Promise<RemoteResult> {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { error } = await supabase.rpc('approve_order', { p_order_id: orderId });
  return error ? { ok: false, message: error.message } : { ok: true, message: 'Order approved' };
}

export async function rejectOrderRemote(orderId: string, reason: string): Promise<RemoteResult> {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { error } = await supabase.rpc('reject_order', {
    p_order_id: orderId,
    p_reason: reason
  });
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: 'Order sent back for re-upload' };
}

export async function approveDelegateRemote(applicationId: string): Promise<RemoteResult> {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { error } = await supabase.rpc('approve_delegate', { p_application_id: applicationId });
  return error ? { ok: false, message: error.message } : { ok: true, message: 'Delegate approved' };
}

export async function rejectDelegateRemote(
  applicationId: string,
  reason: string
): Promise<RemoteResult> {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { error } = await supabase.rpc('reject_delegate', {
    p_application_id: applicationId,
    p_reason: reason
  });
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: 'Delegate application sent back' };
}
