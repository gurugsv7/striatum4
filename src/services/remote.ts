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
  userId: string;
  fullName: string;
  institution: string;
  email: string;
  yearOfStudy?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  delegateId?: string;
  rejectionReason?: string;
  submittedAt: number;
  reviewedAt?: number;
  /** Pass tier, as chosen and paid for. */
  tier?: 'AQUALUME' | 'SYNEXA';
  /** Claims to study at IGMCRI. The ID card is what settles it. */
  homeCollege: boolean;
  /** What the server decided this delegate owes. */
  feeDue?: number;
  /** Stored student ID card, when one was required. */
  idProofPath?: string;
  /** Stored payment screenshot, when a fee was owed. */
  paymentProofPath?: string;
}

export interface RemoteOrderLine {
  /** The line's own id, which is what removing one is addressed by. */
  id: string;
  /** Attached abstract, for the events that ask for one. */
  abstractName?: string;
  abstractPath?: string;
  eventId: string;
  eventName: string;
  eventCode: string;
  context: string;
  category: string;
  date?: string;
  startTime?: string;
  participation: 'individual' | 'team';
  quantity?: number;
  unitPrice: number;
  priceBasis: string;
  lunchChoice?: 'veg' | 'non_veg';
}

export interface RemoteOrder {
  id: string;
  reference: string;
  userId: string;
  lines: RemoteOrderLine[];
  subtotal: number;
  discountAmount: number;
  discountLabel: string | null;
  /** The discount_rules row that applied. A combo id when one did. */
  discountRuleId: string | null;
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
  /** Who it belongs to. An admin's snapshot contains everyone's rows. */
  userId: string;
  orderId: string;
  eventId: string;
  participation: 'individual' | 'team';
  confirmedAt: number;
  lunchChoice?: 'veg' | 'non_veg';
}

export interface RemoteParticipant {
  orderId: string;
  eventId: string;
  teamIndex: number;
  position: number;
  role: 'captain' | 'member';
  name: string;
  yearOfStudy?: string;
  college?: string;
  phone?: string;
  email?: string;
}

export interface EventAdminRegistration {
  eventId: string;
  orderReference: string;
  orderStatus: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeeCollege: string;
  attendeeYear: string;
  lunchChoice?: string;
  registeredAt: number;
}

export interface RemoteSnapshot {
  delegate: RemoteDelegate | null;
  orders: RemoteOrder[];
  registrations: RemoteRegistration[];
  /** Every delegate application, for the verification console. Admins only. */
  allDelegates: RemoteDelegate[];
  isAdmin: boolean;
  isFinanceAdmin: boolean;
  eventIds: string[];
  eventAdminRegistrations: EventAdminRegistration[];
  /** Rosters for every order the caller may read. RLS decides which. */
  participants: RemoteParticipant[];
  capacities: Record<string, { slots: number | null; confirmed: number; pending: number; available: number | null }>;
}

export const EMPTY_SNAPSHOT: RemoteSnapshot = {
  delegate: null,
  orders: [],
  registrations: [],
  allDelegates: [],
  isAdmin: false,
  isFinanceAdmin: false,
  eventIds: [],
  eventAdminRegistrations: [],
  participants: [],
  capacities: {}
};

const PROOF_BUCKET = 'payment-proofs';

function ms(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapDelegate(row: any): RemoteDelegate {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    institution: row.institution,
    email: row.email,
    yearOfStudy: row.year_of_study ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status,
    delegateId: row.delegate_id ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    tier: row.tier ?? undefined,
    homeCollege: Boolean(row.home_college),
    feeDue: row.fee_due ?? undefined,
    idProofPath: row.id_proof_path ?? undefined,
    paymentProofPath: row.payment_proof_path ?? undefined,
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
        id: line.id,
        abstractName: line.abstract_name ?? undefined,
        abstractPath: line.abstract_path ?? undefined,
        eventId: line.event_id,
        eventName: line.event_name,
        eventCode: line.event_code,
        context: line.context,
        category: line.category,
        date: line.event_date ?? undefined,
        startTime: line.start_time ?? undefined,
        participation: line.participation,
        quantity: line.quantity ?? 1,
        unitPrice: line.unit_price,
        priceBasis: line.price_basis ?? '',
        lunchChoice: line.lunch_choice ?? undefined
      })
    ),
    subtotal: row.subtotal,
    discountAmount: row.discount_amount,
    discountLabel: row.discount_label ?? null,
    discountRuleId: row.discount_rule_id ?? null,
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
  const client = supabase;

  const [delegatesRes, ordersRes, registrationsRes, participantsRes, adminRes, financeRes, eventsRes] = await Promise.all([
    supabase.from('delegate_applications').select('*').order('submitted_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*, order_lines(*)')
      .order('created_at', { ascending: false }),
    supabase.from('registrations').select('*'),
    supabase.from('order_line_participants').select('*'),
    supabase.rpc('is_admin'),
    supabase.rpc('is_finance_admin'),
    supabase.from('events').select('id, slots')
  ]);

  const eventAdminRes = adminRes.data === true && financeRes.data !== true
    ? await supabase.rpc('event_admin_registrations')
    : { data: [], error: null };
  if (eventAdminRes.error) throw eventAdminRes.error;

  const capacityEntries = await Promise.all((eventsRes.data ?? []).map(async event => {
    const [takenRes, availableRes] = await Promise.all([
      client.rpc('event_seats_taken', { p_event_id: event.id }),
      client.rpc('event_seats_available', { p_event_id: event.id })
    ]);
    const taken = typeof takenRes.data === 'number' ? takenRes.data : 0;
    const available = typeof availableRes.data === 'number' ? availableRes.data : null;
    return [event.id, {
      slots: typeof event.slots === 'number' ? event.slots : null,
      confirmed: taken,
      pending: 0,
      available
    }] as const;
  }));

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
      userId: row.user_id,
      orderId: row.order_id,
      eventId: row.event_id,
      participation: row.participation,
      confirmedAt: ms(row.confirmed_at),
      lunchChoice: row.lunch_choice ?? undefined
    })),
    allDelegates,
    isAdmin: adminRes.data === true,
    isFinanceAdmin: financeRes.data === true,
    eventIds: (eventsRes.data ?? []).map(event => event.id),
    eventAdminRegistrations: (eventAdminRes.data ?? []).map((row: any) => ({
      eventId: row.event_id,
      orderReference: row.order_reference,
      orderStatus: row.order_status,
      attendeeName: row.attendee_name,
      attendeeEmail: row.attendee_email ?? '',
      attendeePhone: row.attendee_phone ?? '',
      attendeeCollege: row.attendee_college ?? '',
      attendeeYear: row.attendee_year ?? '',
      lunchChoice: row.lunch_choice ?? undefined,
      registeredAt: ms(row.registered_at)
    })),
    participants: (participantsRes.data ?? []).map(row => ({
      orderId: row.order_id,
      eventId: row.event_id,
      teamIndex: row.team_index ?? 1,
      position: row.position ?? 1,
      role: row.role === 'captain' ? ('captain' as const) : ('member' as const),
      name: row.name,
      yearOfStudy: row.year_of_study ?? undefined,
      college: row.college ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined
    })),
    capacities: Object.fromEntries(capacityEntries)
  };
}

export interface RemoteResult<T = void> {
  ok: boolean;
  message: string;
  data?: T;
}

/** Files a delegate application. Approval remains manual and server-side. */
/** Puts one image in the caller's own folder and returns its stored path. */
async function uploadDelegateFile(
  kind: 'id' | 'pay',
  file: { blob: Blob; mimeType: string }
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const user = getCurrentUser();
  if (!supabase || !user) return { ok: false, message: 'Please sign in first.' };

  const extension = file.mimeType === 'image/png' ? 'png' : 'jpg';
  // Same bucket and same per-user folder as order proofs, so the policies that
  // already keep those private apply unchanged. upsert lets a delegate replace
  // a bad photo without orphaning the first one.
  const path = `${user.id}/delegate-${kind}.${extension}`;

  const { error } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file.blob, { contentType: file.mimeType, upsert: true });

  if (error) return { ok: false, message: error.message };
  return { ok: true, path };
}

/**
 * Files the delegate application.
 *
 * The evidence is uploaded first and the RPC is given only the paths, which it
 * re-checks against storage before trusting them. The fee is never sent: the
 * server derives it from the tier and the home-college claim, so a crafted
 * request cannot award itself the IGMCRI rate.
 */
export async function applyForDelegateRemote(input: {
  fullName: string;
  institution: string;
  email: string;
  yearOfStudy?: string;
  phone?: string;
  tier: 'AQUALUME' | 'SYNEXA';
  homeCollege: boolean;
  idProof?: { blob: Blob; mimeType: string; size: number };
  paymentProof?: { blob: Blob; mimeType: string; size: number };
}): Promise<RemoteResult> {
  const user = getCurrentUser();
  if (!supabase || !user) return { ok: false, message: 'Please sign in first.' };

  let idPath: string | null = null;
  let payPath: string | null = null;

  if (input.idProof) {
    const uploaded = await uploadDelegateFile('id', input.idProof);
    if (!uploaded.ok) return { ok: false, message: uploaded.message };
    idPath = uploaded.path;
  }
  if (input.paymentProof) {
    const uploaded = await uploadDelegateFile('pay', input.paymentProof);
    if (!uploaded.ok) return { ok: false, message: uploaded.message };
    payPath = uploaded.path;
  }

  const { error } = await supabase.rpc('apply_for_delegate', {
    p_full_name: input.fullName,
    p_institution: input.institution,
    p_email: input.email,
    p_year_of_study: input.yearOfStudy ?? null,
    p_phone: input.phone ?? null,
    p_tier: input.tier,
    p_home_college: input.homeCollege,
    p_id_proof_path: idPath,
    p_payment_path: payPath,
    p_payment_mime: input.paymentProof?.mimeType ?? null,
    p_payment_size: input.paymentProof?.size ?? null
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Delegate application submitted for verification' };
}

/**
 * Creates an order. The client sends only WHAT it wants; create_order re-reads
 * every price, re-checks eligibility and capacity, and computes the total.
 */
export async function createOrderRemote(
  items: {
    eventId: string;
    participation: 'individual' | 'team';
    lunchChoice?: 'veg' | 'non_veg';
    /** Team entries. Only team events may exceed 1; the server re-checks. */
    quantity?: number;
    comboId?: string;
    /** Roster per team entry. Re-validated server-side. */
    teams?: {
      team_index: number;
      team_college: string | null;
      participants: {
        position: number;
        role: string;
        name: string;
        year_of_study: string | null;
        college: string | null;
        phone: string | null;
        email: string | null;
      }[];
    }[];
  }[]
): Promise<RemoteResult<RemoteOrder>> {
  if (!supabase || !getCurrentUser()) return { ok: false, message: 'Please sign in first.' };

  const { data, error } = await supabase.rpc('create_order', {
    p_items: items.map(i => ({
      event_id: i.eventId,
      participation: i.participation,
      quantity: i.quantity ?? 1,
      combo_id: i.comboId ?? null,
      lunch_choice: i.lunchChoice ?? null,
      teams: i.teams ?? null
    }))
  });

  if (error) return { ok: false, message: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, message: 'The order could not be created.' };

  // The meal choice travels inside p_items and create_order writes it with the
  // line, under the same transaction that checks it. A second RPC afterwards
  // could only fail on an order that already existed, which reported failure to
  // a delegate whose seats were taken and whose cart was then kept, blocking
  // every later checkout.
  return { ok: true, message: 'Order created', data: mapOrder({ ...row, order_lines: [] }) };
}

/**
 * Attaches an abstract to one line of an unpaid order.
 *
 * Uploaded first, then recorded, so the server only ever stores a path it has
 * confirmed points at a real file in the caller's own folder.
 */
export async function uploadAbstractRemote(
  lineId: string,
  file: { blob: Blob; mimeType: string; size: number; name: string; extension: string }
): Promise<RemoteResult> {
  const user = getCurrentUser();
  if (!supabase || !user) return { ok: false, message: 'Please sign in first.' };

  const path = `${user.id}/abstract-${lineId}.${file.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file.blob, { contentType: file.mimeType, upsert: true });
  if (uploadError) return { ok: false, message: uploadError.message };

  const { error } = await supabase.rpc('set_order_line_abstract', {
    p_line_id: lineId,
    p_path: path,
    p_mime: file.mimeType,
    p_size: file.size,
    p_name: file.name
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Abstract attached' };
}

/**
 * Takes one event back out of an unpaid order.
 *
 * The server re-checks ownership and that nothing has been paid, and recomputes
 * what is owed — a combo discount cannot survive the combo being broken up.
 */
export async function removeOrderLineRemote(lineId: string): Promise<RemoteResult> {
  if (!supabase || !getCurrentUser()) return { ok: false, message: 'Please sign in first.' };
  const { error } = await supabase.rpc('remove_order_line', { p_line_id: lineId });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Registration removed' };
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
 * Finishes an order with nothing to pay.
 *
 * There is no screenshot to send, so this is the delegate saying the entry is
 * complete. The server still checks that every abstract the order owes has
 * actually been attached.
 */
export async function submitFreeOrderRemote(orderId: string): Promise<RemoteResult> {
  const user = getCurrentUser();
  if (!supabase || !user) return { ok: false, message: 'Please sign in first.' };

  const { error } = await supabase.rpc('submit_free_order', { p_order_id: orderId });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Abstract submitted' };
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

/** Releases seats held by orders unverified for more than 48 hours. */
export async function expireStaleOrders(): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('expire_stale_orders');
}

/** Closes access for a pass that verification has found a problem with. */
export async function revokeDelegateRemote(
  applicationId: string,
  reason: string
): Promise<RemoteResult> {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { error } = await supabase.rpc('revoke_delegate', {
    p_application_id: applicationId,
    p_reason: reason
  });
  return error ? { ok: false, message: error.message } : { ok: true, message: 'Delegate pass revoked' };
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
