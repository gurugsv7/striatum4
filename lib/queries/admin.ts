/**
 * STRIATUM 4.0 — admin-facing read queries.
 *
 * Every export here calls requireAdmin() itself, in addition to whatever
 * page-level guard already ran — admin queries are sensitive enough
 * (screenshots, PII, review queues) that they should never trust a caller
 * blindly. Reads use the RLS-scoped server client (admin RLS policies
 * already grant read access to every table listed here); only the
 * service-role client in lib/supabase/admin.ts is used for privileged
 * writes/RPCs, in lib/actions/admin.ts.
 */
import { requireAdmin, requireFinanceAdmin } from '@/lib/auth/guards';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type {
  DelegateApplicationRow,
  EventRegistrationRow,
  EventRow,
  PaymentSubmissionRow,
  TeamMemberRow,
  TeamRow,
} from '@/lib/types/database';
import type { AdminRole, PaymentSubmissionStatus } from '@/lib/types/enums';

// ---------------------------------------------------------------------------
// Dashboard counters
// ---------------------------------------------------------------------------
export interface AdminDashboardCounters {
  totalAccounts: number;
  delegateApplications: number;
  pendingDelegatePayments: number;
  approvedDelegates: number;
  rejectedOrResubmissionDelegates: number;
  totalEventRegistrations: number;
  pendingEventPayments: number;
  confirmedEventRegistrations: number;
  checkedInParticipants: number;
}

export async function getDashboardCounters(): Promise<AdminDashboardCounters> {
  await requireAdmin();
  const supabase = await createSupabaseServerComponentClient();

  const [
    totalAccounts,
    delegateApplications,
    pendingDelegatePayments,
    approvedDelegates,
    rejectedOrResubmissionDelegates,
    totalEventRegistrations,
    pendingEventPayments,
    confirmedEventRegistrations,
    checkedInParticipants,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('delegate_applications').select('id', { count: 'exact', head: true }),
    supabase
      .from('delegate_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PAYMENT_UNDER_REVIEW'),
    supabase.from('delegates').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase
      .from('delegate_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PAYMENT_REJECTED'),
    supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'CANCELLED'),
    supabase
      .from('payment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('payment_type', 'EVENT')
      .eq('status', 'PENDING_REVIEW'),
    supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'CONFIRMED'),
    supabase.from('check_ins').select('id', { count: 'exact', head: true }),
  ]).then((results) => results.map((r) => r.count ?? 0));

  return {
    totalAccounts,
    delegateApplications,
    pendingDelegatePayments,
    approvedDelegates,
    rejectedOrResubmissionDelegates,
    totalEventRegistrations,
    pendingEventPayments,
    confirmedEventRegistrations,
    checkedInParticipants,
  };
}

// ---------------------------------------------------------------------------
// Delegate applications list (paginated/filterable/searchable)
// ---------------------------------------------------------------------------
export interface ListDelegateApplicationsParams {
  page?: number; // 1-based
  pageSize?: number;
  status?: DelegateApplicationRow['status'];
  /**
   * "Needs Resubmission" vs. terminal "Rejected" is not a distinction
   * delegate_applications.status carries — both sit at application status
   * PAYMENT_REJECTED. The finer state lives on the linked
   * payment_submissions row (payment_submissions.status), so filtering by
   * it requires an inner join instead of a plain .eq() on this table.
   */
  paymentSubmissionStatus?: PaymentSubmissionStatus;
  search?: string; // matches name/email/mobile/college
}
export interface ListDelegateApplicationsResult {
  rows: DelegateApplicationRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listDelegateApplications(
  params: ListDelegateApplicationsParams = {}
): Promise<ListDelegateApplicationsResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerComponentClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Typed as `string`, not the literal union of the two branches — Supabase's
  // generated client parses select() literals at the type level, and a
  // union of two different embed shapes there produces a spurious
  // ParserError. The runtime query is correct either way.
  const selectColumns: string = params.paymentSubmissionStatus ? '*, payment_submissions!inner(status)' : '*';

  let query = supabase
    .from('delegate_applications')
    .select(selectColumns, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq('status', params.status);
  if (params.paymentSubmissionStatus) {
    query = query
      .eq('payment_submissions.payment_type', 'DELEGATE')
      .eq('payment_submissions.status', params.paymentSubmissionStatus);
  }
  if (params.search && params.search.trim()) {
    const term = params.search.trim().replace(/[%_]/g, '');
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%,college.ilike.%${term}%`
    );
  }

  const { data, count, error } = await query;
  if (error) return { rows: [], total: 0, page, pageSize };

  // Strip the joined payment_submissions field back off — callers only get
  // the application row shape; the join was for filtering/counting only.
  const rows = ((data ?? []) as unknown as Array<DelegateApplicationRow & { payment_submissions?: unknown }>).map(
    (row): DelegateApplicationRow => {
      const clean = { ...row };
      delete clean.payment_submissions;
      return clean;
    }
  );

  return { rows, total: count ?? 0, page, pageSize };
}

export async function getDelegateApplicationById(id: string): Promise<DelegateApplicationRow | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase.from('delegate_applications').select('*').eq('id', id).maybeSingle();
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Combined payment review queue
// ---------------------------------------------------------------------------
export interface PaymentQueueRow extends PaymentSubmissionRow {
  applicantName: string | null;
  applicantEmail: string | null;
  eventName: string | null;
}

export interface ListPaymentQueueParams {
  paymentType?: 'DELEGATE' | 'EVENT';
  status?: PaymentSubmissionRow['status'];
  page?: number; // 1-based
  pageSize?: number;
}
export interface ListPaymentQueueResult {
  rows: PaymentQueueRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Server-side paginated, matching the listDelegateApplications pattern —
 * the review queue can run to hundreds of submissions, so the list view
 * must never load the full filtered set at once.
 */
export async function listPaymentQueue(params: ListPaymentQueueParams = {}): Promise<ListPaymentQueueResult> {
  await requireFinanceAdmin();
  const supabase = await createSupabaseServerComponentClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('payment_submissions')
    .select(
      '*, delegate_application:delegate_applications(full_name, email), event_registration:event_registrations(event:events(name))',
      { count: 'exact' }
    )
    .order('submitted_at', { ascending: true })
    .range(from, to);

  query = query.eq('status', params.status ?? 'PENDING_REVIEW');
  if (params.paymentType) query = query.eq('payment_type', params.paymentType);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page, pageSize };

  const rows = (data as unknown as Array<
    PaymentSubmissionRow & {
      delegate_application: { full_name: string; email: string } | null;
      event_registration: { event: { name: string } | null } | null;
    }
  >).map((row) => ({
    ...row,
    applicantName: row.delegate_application?.full_name ?? null,
    applicantEmail: row.delegate_application?.email ?? null,
    eventName: row.event_registration?.event?.name ?? null,
  }));

  return { rows, total: count ?? 0, page, pageSize };
}

/**
 * Unpaginated variant for the CSV export center (app/admin/exports) — export
 * rows are streamed to a file, not rendered as a list, so the whole filtered
 * set is legitimately needed at once.
 */
export async function buildPaymentQueueExportRows(
  params: Pick<ListPaymentQueueParams, 'paymentType' | 'status'> = {}
): Promise<PaymentQueueRow[]> {
  await requireFinanceAdmin();
  const supabase = await createSupabaseServerComponentClient();

  let query = supabase
    .from('payment_submissions')
    .select(
      '*, delegate_application:delegate_applications(full_name, email), event_registration:event_registrations(event:events(name))'
    )
    .order('submitted_at', { ascending: true });

  query = query.eq('status', params.status ?? 'PENDING_REVIEW');
  if (params.paymentType) query = query.eq('payment_type', params.paymentType);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as Array<
    PaymentSubmissionRow & {
      delegate_application: { full_name: string; email: string } | null;
      event_registration: { event: { name: string } | null } | null;
    }
  >).map((row) => ({
    ...row,
    applicantName: row.delegate_application?.full_name ?? null,
    applicantEmail: row.delegate_application?.email ?? null,
    eventName: row.event_registration?.event?.name ?? null,
  }));
}

/**
 * Auto-advance helper for the review panel: the next PENDING_REVIEW
 * submission after the one just actioned, ordered the same way as
 * listPaymentQueue (oldest submitted first) so reviewers work the queue
 * front-to-back.
 */
export async function getNextPendingSubmission(afterId: string): Promise<PaymentQueueRow | null> {
  await requireFinanceAdmin();
  const supabase = await createSupabaseServerComponentClient();

  const { data: current } = await supabase
    .from('payment_submissions')
    .select('submitted_at')
    .eq('id', afterId)
    .maybeSingle();

  let query = supabase
    .from('payment_submissions')
    .select(
      '*, delegate_application:delegate_applications(full_name, email), event_registration:event_registrations(event:events(name))'
    )
    .eq('status', 'PENDING_REVIEW')
    .order('submitted_at', { ascending: true })
    .limit(1);

  if (current?.submitted_at) {
    query = query.gt('submitted_at', current.submitted_at);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as PaymentSubmissionRow & {
    delegate_application: { full_name: string; email: string } | null;
    event_registration: { event: { name: string } | null } | null;
  };

  return {
    ...row,
    applicantName: row.delegate_application?.full_name ?? null,
    applicantEmail: row.delegate_application?.email ?? null,
    eventName: row.event_registration?.event?.name ?? null,
  };
}

// ---------------------------------------------------------------------------
// Event registration list (filterable by event, team expansion)
// ---------------------------------------------------------------------------
export interface EventRegistrationWithTeam extends EventRegistrationRow {
  event: EventRow | null;
  team: (TeamRow & { members: TeamMemberRow[] }) | null;
}

export async function listEventRegistrations(params: {
  eventId?: string;
  status?: EventRegistrationRow['status'];
  page?: number;
  pageSize?: number;
} = {}): Promise<{ rows: EventRegistrationWithTeam[]; total: number }> {
  await requireAdmin();
  const supabase = await createSupabaseServerComponentClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('event_registrations')
    .select('*, event:events(*), team:teams(*, members:team_members(*))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.eventId) query = query.eq('event_id', params.eventId);
  if (params.status) query = query.eq('status', params.status);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0 };
  return { rows: data as unknown as EventRegistrationWithTeam[], total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// Export row-builders — normalized flat records for CSV export center.
// ---------------------------------------------------------------------------
export interface DelegateExportRow {
  delegateId: string | null;
  applicationStatus: string;
  fullName: string;
  email: string;
  mobile: string;
  college: string;
  yearOfStudy: string;
  studentId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export async function buildDelegateExportRows(): Promise<DelegateExportRow[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('delegate_applications')
    .select('*, delegate:delegates(delegate_id)')
    .order('created_at', { ascending: true });

  return ((data ?? []) as unknown as Array<
    DelegateApplicationRow & { delegate: { delegate_id: string } | null }
  >).map((row) => ({
    delegateId: row.delegate?.delegate_id ?? null,
    applicationStatus: row.status,
    fullName: row.full_name,
    email: row.email,
    mobile: row.mobile,
    college: row.college,
    yearOfStudy: row.year_of_study,
    studentId: row.student_id,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  }));
}

export interface EventRegistrationExportRow {
  registrationCode: string;
  eventName: string | null;
  delegateName: string | null;
  status: string;
  teamName: string | null;
  registeredAt: string | null;
  confirmedAt: string | null;
}

export async function buildEventRegistrationExportRows(
  eventId?: string
): Promise<EventRegistrationExportRow[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerComponentClient();
  let query = supabase
    .from('event_registrations')
    .select('*, event:events(name), team:teams(name), profile:profiles(full_name)')
    .order('created_at', { ascending: true });

  if (eventId) query = query.eq('event_id', eventId);

  const { data } = await query;

  return ((data ?? []) as unknown as Array<
    EventRegistrationRow & {
      event: { name: string } | null;
      team: { name: string | null } | null;
      profile: { full_name: string | null } | null;
    }
  >).map((row) => ({
    registrationCode: row.registration_code,
    eventName: row.event?.name ?? null,
    delegateName: row.profile?.full_name ?? null,
    status: row.status,
    teamName: row.team?.name ?? null,
    registeredAt: row.registered_at,
    confirmedAt: row.confirmed_at,
  }));
}

// ---------------------------------------------------------------------------
// Admin users (Settings → Admins) — SUPER_ADMIN only
// ---------------------------------------------------------------------------
export interface AdminUserWithProfile {
  userId: string;
  role: AdminRole;
  email: string | null;
  fullName: string | null;
  createdAt: string;
}

export async function listAdminUsers(): Promise<AdminUserWithProfile[]> {
  await requireAdmin(['SUPER_ADMIN']);
  const supabase = await createSupabaseServerComponentClient();

  const { data } = await supabase
    .from('admin_users')
    .select('user_id, role, created_at, profile:profiles(email, full_name)')
    .order('created_at', { ascending: true });

  return ((data ?? []) as unknown as Array<{
    user_id: string;
    role: AdminRole;
    created_at: string;
    profile: { email: string; full_name: string | null } | null;
  }>).map((row) => ({
    userId: row.user_id,
    role: row.role,
    email: row.profile?.email ?? null,
    fullName: row.profile?.full_name ?? null,
    createdAt: row.created_at,
  }));
}
