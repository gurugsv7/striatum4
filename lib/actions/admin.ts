'use server';

/**
 * STRIATUM 4.0 — admin server actions.
 *
 * Every export here calls requireAdmin() first (never trusts the
 * middleware/layout gate alone), then either calls the matching
 * SECURITY DEFINER function from 0002_functions.sql via the service-role
 * client, or — for the handful of admin mutations with no dedicated SQL
 * function (plain settings/CRUD tables) — writes directly with the
 * service-role client and appends its own audit_log row.
 *
 * approve/reject/confirm/redeem/publish functions already insert their own
 * audit_log row internally (see 0002_functions.sql / 0005_free_event_approval.sql
 * `perform audit(...)` calls) — this file does not duplicate those writes.
 */
import { revalidatePath } from 'next/cache';

import { requireAdmin, requireFinanceAdmin } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  approveFreeRegistrationSchema,
  approvePaymentSchema,
  addAdminUserSchema,
  checkInSchema,
  rejectFreeRegistrationSchema,
  rejectPaymentSchema,
  removeAdminUserSchema,
  setLaunchedSchema,
  toggleRegistrationOpenSchema,
  updateAdminUserRoleSchema,
} from '@/lib/validation/admin';
import { upsertEventSchema, upsertEventTypesSchema } from '@/lib/validation/event';
import { publishResultsSchema, saveResultsSchema, unpublishResultsSchema } from '@/lib/validation/results';
import { updatePaymentSettingsSchema } from '@/lib/validation/settings';
import { screenshotFileSchema } from '@/lib/validation/payment';
import type {
  AdminUserRow,
  AppSettingsRow,
  DelegateRow,
  EventRegistrationRow,
  EventRow,
  EventTypeRow,
  PaymentSettingsRow,
  PaymentSubmissionRow,
  QrRedeemResult,
  ResultRow,
} from '@/lib/types/database';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

async function auditAdmin(
  actorId: string,
  action: string,
  entity: string,
  entityId: string | null,
  payload: Record<string, unknown> | null = null
) {
  const admin = createSupabaseAdminClient();
  await admin.from('audit_log').insert({
    actor_user_id: actorId,
    action,
    entity,
    entity_id: entityId,
    payload: payload as never,
  });
}

// ---------------------------------------------------------------------------
// Payment review: delegate
// ---------------------------------------------------------------------------
export async function approveDelegatePayment(input: unknown): Promise<ActionResult<DelegateRow>> {
  const parsed = approvePaymentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireFinanceAdmin();
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('approve_delegate_payment', {
    p_submission_id: parsed.data.submissionId,
    p_admin: admin.id,
    p_note: parsed.data.note,
  });

  if (error || !data) return fail(error?.message ?? 'Could not approve delegate payment.', error?.code);

  revalidatePath('/admin/payments');
  revalidatePath('/admin/delegates');
  revalidatePath(`/admin/delegates/${data.application_id}`);
  revalidatePath('/home');
  revalidatePath('/delegate/status');
  revalidatePath('/delegate/pass');
  revalidatePath('/profile');

  return { ok: true, data };
}

export async function rejectDelegatePayment(input: unknown): Promise<ActionResult<PaymentSubmissionRow>> {
  const parsed = rejectPaymentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireFinanceAdmin();
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('reject_delegate_payment', {
    p_submission_id: parsed.data.submissionId,
    p_admin: admin.id,
    p_reason: parsed.data.reason,
    p_note: parsed.data.note,
    p_allow_resubmit: parsed.data.allowResubmit,
  });

  if (error || !data) return fail(error?.message ?? 'Could not reject delegate payment.', error?.code);

  revalidatePath('/admin/payments');
  revalidatePath('/admin/delegates');
  revalidatePath('/home');
  revalidatePath('/delegate/status');
  revalidatePath('/delegate/payment');

  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Payment review: event
// ---------------------------------------------------------------------------
export async function approveEventPayment(input: unknown): Promise<ActionResult<EventRegistrationRow>> {
  const parsed = approvePaymentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireFinanceAdmin();
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('approve_event_payment', {
    p_submission_id: parsed.data.submissionId,
    p_admin: admin.id,
    p_note: parsed.data.note,
  });

  if (error || !data) return fail(error?.message ?? 'Could not approve event payment.', error?.code);

  revalidatePath('/admin/payments');
  revalidatePath('/admin/event-registrations');
  revalidatePath('/my-events');
  revalidatePath('/home');

  return { ok: true, data };
}

export async function rejectEventPayment(input: unknown): Promise<ActionResult<PaymentSubmissionRow>> {
  const parsed = rejectPaymentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireFinanceAdmin();
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('reject_event_payment', {
    p_submission_id: parsed.data.submissionId,
    p_admin: admin.id,
    p_reason: parsed.data.reason,
    p_note: parsed.data.note,
    p_allow_resubmit: parsed.data.allowResubmit,
  });

  if (error || !data) return fail(error?.message ?? 'Could not reject event payment.', error?.code);

  revalidatePath('/admin/payments');
  revalidatePath('/admin/event-registrations');
  revalidatePath('/my-events');

  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Free-event admin approval (PENDING_APPROVAL -> CONFIRMED / CANCELLED)
//
// Thin wrappers over supabase/migrations/0005_free_event_approval.sql, same
// idempotent pattern as the payment approve/reject functions: admin check,
// row-locked SELECT ... FOR UPDATE, no-op-and-return if already settled,
// exactly one qr_credentials row issued on approval, notification + audit_log
// written internally by the function. Nothing here duplicates that work.
// ---------------------------------------------------------------------------
export async function approvePendingFreeRegistration(
  input: unknown
): Promise<ActionResult<EventRegistrationRow>> {
  const parsed = approveFreeRegistrationSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin();
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('approve_free_event_registration', {
    p_registration_id: parsed.data.registrationId,
    p_admin: admin.id,
    p_note: parsed.data.note,
  });

  // approve_free_event_registration() is idempotent — an already-CONFIRMED
  // registration is returned as-is rather than erroring, so a double click
  // or a concurrent second reviewer never surfaces as a failure here.
  if (error || !data) {
    return fail(error?.message ?? 'Could not approve registration.', error?.code);
  }

  revalidatePath('/admin/event-registrations');
  revalidatePath('/my-events');
  revalidatePath('/home');

  return { ok: true, data };
}

export async function rejectPendingFreeRegistration(
  input: unknown
): Promise<ActionResult<EventRegistrationRow>> {
  const parsed = rejectFreeRegistrationSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin();
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('reject_free_event_registration', {
    p_registration_id: parsed.data.registrationId,
    p_admin: admin.id,
    p_reason: parsed.data.reason,
    p_note: parsed.data.note,
  });

  if (error || !data) {
    return fail(error?.message ?? 'Could not reject registration.', error?.code);
  }

  revalidatePath('/admin/event-registrations');
  revalidatePath('/my-events');
  revalidatePath('/home');

  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Event CRUD
// ---------------------------------------------------------------------------
export async function upsertEvent(input: unknown): Promise<ActionResult<EventRow>> {
  const parsed = upsertEventSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const client = createSupabaseAdminClient();
  const v = parsed.data;

  const payload = {
    slug: v.slug,
    name: v.name,
    type_id: v.typeId ?? null,
    summary: v.summary,
    description: v.description,
    event_date: v.eventDate,
    start_time: v.startTime,
    end_time: v.endTime,
    session: v.session,
    venue: v.venue,
    format: v.format,
    min_team_size: v.minTeamSize,
    max_team_size: v.maxTeamSize,
    is_paid: v.isPaid,
    fee_inr: v.feeInr,
    capacity: v.capacity,
    registration_open: v.registrationOpen,
    requires_admin_approval: v.requiresAdminApproval,
    eligibility: v.eligibility,
    rules: v.rules,
    about: v.about,
    faqs: (v.faqs ?? null) as never,
    speakers: (v.speakers ?? null) as never,
    schedule: (v.schedule ?? null) as never,
    payment_upi_id: v.paymentUpiId,
    payment_payee_name: v.paymentPayeeName,
    is_featured: v.isFeatured,
    sort_order: v.sortOrder,
  };

  const { data, error } = v.id
    ? await client.from('events').update(payload).eq('id', v.id).select('*').single()
    : await client.from('events').insert(payload).select('*').single();

  if (error || !data) return fail(error?.message ?? 'Could not save event.', error?.code);

  await auditAdmin(admin.id, v.id ? 'UPDATE_EVENT' : 'CREATE_EVENT', 'events', data.id, { slug: data.slug });

  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${data.id}`);
  revalidatePath('/explore');
  revalidatePath('/programme');
  revalidatePath(`/events/${data.slug}`);

  return { ok: true, data };
}

export async function toggleRegistrationOpen(input: unknown): Promise<ActionResult<EventRow>> {
  const parsed = toggleRegistrationOpenSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const client = createSupabaseAdminClient();

  const { data, error } = await client
    .from('events')
    .update({ registration_open: parsed.data.open })
    .eq('id', parsed.data.eventId)
    .select('*')
    .single();

  if (error || !data) return fail(error?.message ?? 'Could not update event.', error?.code);

  await auditAdmin(admin.id, 'TOGGLE_REGISTRATION_OPEN', 'events', data.id, { open: parsed.data.open });

  revalidatePath('/admin/events');
  revalidatePath('/explore');
  revalidatePath(`/events/${data.slug}`);

  return { ok: true, data };
}

export async function upsertEventTypes(input: unknown): Promise<ActionResult<EventTypeRow[]>> {
  const parsed = upsertEventTypesSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const client = createSupabaseAdminClient();

  const results: EventTypeRow[] = [];
  for (const t of parsed.data) {
    const payload = { key: t.key, label: t.label, sort_order: t.sortOrder, is_active: t.isActive };
    const { data, error } = t.id
      ? await client.from('event_types').update(payload).eq('id', t.id).select('*').single()
      : await client.from('event_types').insert(payload).select('*').single();
    if (error || !data) return fail(error?.message ?? 'Could not save event type.', error?.code);
    results.push(data);
  }

  await auditAdmin(admin.id, 'UPSERT_EVENT_TYPES', 'event_types', null, { count: results.length });

  revalidatePath('/admin/events');
  revalidatePath('/explore');

  return { ok: true, data: results };
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
export async function saveResults(input: unknown): Promise<ActionResult<ResultRow>> {
  const parsed = saveResultsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'REVIEWER']);
  const client = createSupabaseAdminClient();
  const v = parsed.data;

  const { data: result, error: resultError } = v.resultId
    ? await client
        .from('results')
        .update({ notes: v.notes ?? null })
        .eq('id', v.resultId)
        .select('*')
        .single()
    : await client
        .from('results')
        .insert({ event_id: v.eventId, notes: v.notes ?? null, status: 'DRAFT' })
        .select('*')
        .single();

  if (resultError || !result) return fail(resultError?.message ?? 'Could not save results.', resultError?.code);

  // Replace entries wholesale: delete existing, insert the submitted set.
  await client.from('result_entries').delete().eq('result_id', result.id);

  if (v.entries.length > 0) {
    const { error: entriesError } = await client.from('result_entries').insert(
      v.entries.map((e) => ({
        result_id: result.id,
        position: e.position ?? null,
        label: e.label ?? null,
        event_registration_id: e.eventRegistrationId ?? null,
        team_id: e.teamId ?? null,
        participant_name: e.participantName ?? null,
        delegate_id_text: e.delegateIdText ?? null,
        institution: e.institution ?? null,
        score: e.score ?? null,
        sort_order: e.sortOrder,
      }))
    );
    if (entriesError) return fail(entriesError.message, entriesError.code);
  }

  await auditAdmin(admin.id, 'SAVE_RESULTS', 'results', result.id, { event_id: v.eventId, entries: v.entries.length });

  revalidatePath('/admin/results');
  revalidatePath(`/admin/results/${v.eventId}`);
  revalidatePath('/results');

  return { ok: true, data: result };
}

export async function publishResults(input: unknown): Promise<ActionResult<ResultRow>> {
  const parsed = publishResultsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('publish_results', {
    p_result_id: parsed.data.resultId,
    p_admin: admin.id,
  });

  if (error || !data) return fail(error?.message ?? 'Could not publish results.', error?.code);

  revalidatePath('/admin/results');
  revalidatePath('/results');

  return { ok: true, data };
}

export async function unpublishResults(input: unknown): Promise<ActionResult<ResultRow>> {
  const parsed = unpublishResultsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('unpublish_results', {
    p_result_id: parsed.data.resultId,
    p_admin: admin.id,
  });

  if (error || !data) return fail(error?.message ?? 'Could not unpublish results.', error?.code);

  revalidatePath('/admin/results');
  revalidatePath('/results');

  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function updatePaymentSettings(formData: FormData): Promise<ActionResult<PaymentSettingsRow>> {
  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const client = createSupabaseAdminClient();

  const parsed = updatePaymentSettingsSchema.safeParse({
    delegateFeeInr: formData.get('delegateFeeInr') || null,
    payeeName: formData.get('payeeName') || null,
    upiId: formData.get('upiId') || null,
    instructions: formData.get('instructions') || null,
    requireTransactionRef: formData.get('requireTransactionRef') === 'true',
  });
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const { data: current } = await client
    .from('payment_settings')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  let qrStoragePath = current?.qr_storage_path ?? null;
  const qrFile = formData.get('qrImage');
  if (qrFile instanceof File && qrFile.size > 0) {
    const fileParsed = screenshotFileSchema.safeParse(qrFile);
    if (!fileParsed.success) return fail(fileParsed.error.message, 'VALIDATION');

    const settingsId = current?.id ?? crypto.randomUUID();
    const ext = (qrFile.name.split('.').pop() || 'png').toLowerCase();
    const path = `payment-qr/${settingsId}.${ext}`;
    const { error: uploadError } = await client.storage
      .from('brand-assets')
      .upload(path, qrFile, { contentType: qrFile.type, upsert: true });
    if (uploadError) return fail(`Could not upload QR image: ${uploadError.message}`, 'UPLOAD_FAILED');
    qrStoragePath = path;
  }

  const payload = {
    delegate_fee_inr: parsed.data.delegateFeeInr ?? null,
    payee_name: parsed.data.payeeName,
    upi_id: parsed.data.upiId,
    instructions: parsed.data.instructions,
    require_transaction_ref: parsed.data.requireTransactionRef,
    qr_storage_path: qrStoragePath,
    is_active: true,
    updated_by: admin.id,
  };

  let saved: PaymentSettingsRow | null = null;
  if (current) {
    const { data, error } = await client
      .from('payment_settings')
      .update(payload)
      .eq('id', current.id)
      .select('*')
      .single();
    if (error) return fail(error.message, error.code);
    saved = data;
  } else {
    const { data, error } = await client.from('payment_settings').insert(payload).select('*').single();
    if (error) return fail(error.message, error.code);
    saved = data;
  }

  if (!saved) return fail('Could not save payment settings.', 'INTERNAL');

  await auditAdmin(admin.id, 'UPDATE_PAYMENT_SETTINGS', 'payment_settings', saved.id);

  revalidatePath('/admin/settings/payments');
  revalidatePath('/delegate/payment');

  return { ok: true, data: saved };
}

export async function setLaunched(input: unknown): Promise<ActionResult<AppSettingsRow>> {
  const parsed = setLaunchedSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const client = createSupabaseAdminClient();

  const { data, error } = await client
    .from('app_settings')
    .update({
      launched: parsed.data.launched,
      launch_date: parsed.data.launchDate ?? null,
      updated_by: admin.id,
    })
    .eq('id', true)
    .select('*')
    .single();

  if (error || !data) return fail(error?.message ?? 'Could not update launch state.', error?.code);

  await auditAdmin(admin.id, 'SET_LAUNCHED', 'app_settings', null, { launched: parsed.data.launched });

  revalidatePath('/');
  revalidatePath('/welcome');

  return { ok: true, data };
}

/**
 * Grants admin access to an existing account, identified by email — there is
 * no "invite" flow, the person must have signed in at least once already so
 * a profiles row exists. The very first admin still has to be inserted by
 * SQL (see README.md) since this action itself requires SUPER_ADMIN access.
 */
export async function addAdminUser(input: unknown): Promise<ActionResult<AdminUserRow>> {
  const parsed = addAdminUserSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN']);
  const client = createSupabaseAdminClient();

  const { data: profile } = await client
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle();

  if (!profile) {
    return fail(
      'No account found for that email. The person must sign in at least once before they can be made an admin.',
      'NOT_FOUND'
    );
  }

  const { data: existing } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', profile.id)
    .maybeSingle();
  if (existing) {
    return fail('This person is already an admin. Change their role from the list instead.', 'DUPLICATE');
  }

  const { data, error } = await client
    .from('admin_users')
    .insert({ user_id: profile.id, role: parsed.data.role, created_by: admin.id })
    .select('*')
    .single();

  if (error || !data) return fail(error?.message ?? 'Could not add admin user.', error?.code);

  await auditAdmin(admin.id, 'ADD_ADMIN_USER', 'admin_users', profile.id, { role: parsed.data.role });

  revalidatePath('/admin/settings/admins');

  return { ok: true, data };
}

/**
 * Guard shared by updateAdminUserRole (self-demotion) and removeAdminUser:
 * the console must never end up with zero SUPER_ADMIN accounts, since only
 * a SUPER_ADMIN can grant that role back.
 */
async function isLastSuperAdmin(client: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data: target } = await client.from('admin_users').select('role').eq('user_id', userId).maybeSingle();
  if (target?.role !== 'SUPER_ADMIN') return false;
  const { count } = await client
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })
    .eq('role', 'SUPER_ADMIN');
  return (count ?? 0) <= 1;
}

export async function updateAdminUserRole(input: unknown): Promise<ActionResult<AdminUserRow>> {
  const parsed = updateAdminUserRoleSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN']);
  const client = createSupabaseAdminClient();

  if (parsed.data.role !== 'SUPER_ADMIN' && (await isLastSuperAdmin(client, parsed.data.userId))) {
    return fail(
      'This is the last Super Admin. Promote another admin to Super Admin first.',
      'LAST_SUPER_ADMIN'
    );
  }

  const { data, error } = await client
    .from('admin_users')
    .update({ role: parsed.data.role })
    .eq('user_id', parsed.data.userId)
    .select('*')
    .single();

  if (error || !data) return fail(error?.message ?? 'Could not update role.', error?.code);

  await auditAdmin(admin.id, 'UPDATE_ADMIN_ROLE', 'admin_users', parsed.data.userId, { role: parsed.data.role });

  revalidatePath('/admin/settings/admins');

  return { ok: true, data };
}

export async function removeAdminUser(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = removeAdminUserSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN']);
  const client = createSupabaseAdminClient();

  if (await isLastSuperAdmin(client, parsed.data.userId)) {
    return fail('You cannot remove the last Super Admin.', 'LAST_SUPER_ADMIN');
  }

  const { error } = await client.from('admin_users').delete().eq('user_id', parsed.data.userId);
  if (error) return fail(error.message, error.code);

  await auditAdmin(admin.id, 'REMOVE_ADMIN_USER', 'admin_users', parsed.data.userId, null);

  revalidatePath('/admin/settings/admins');

  return { ok: true, data: { userId: parsed.data.userId } };
}

// ---------------------------------------------------------------------------
// checkInByToken — QR scanner
// ---------------------------------------------------------------------------
export async function checkInByToken(input: unknown): Promise<ActionResult<QrRedeemResult>> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'SCANNER']);
  const client = createSupabaseAdminClient();

  const { data, error } = await client.rpc('redeem_event_qr', {
    p_token: parsed.data.token,
    p_event_id: parsed.data.eventId,
    p_admin: admin.id,
  });

  if (error || !data) return fail(error?.message ?? 'Could not redeem QR token.', error?.code);

  revalidatePath('/admin/checkin');

  return { ok: true, data };
}
