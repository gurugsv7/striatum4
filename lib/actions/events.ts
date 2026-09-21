'use server';

/**
 * STRIATUM 4.0 — participant-facing event registration server actions.
 */
import { revalidatePath } from 'next/cache';

import { requireDelegate, requireUser } from '@/lib/auth/guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildEventRegistrationSchema, cancelRegistrationSchema } from '@/lib/validation/event-registration';
import { buildPaymentSubmissionSchema } from '@/lib/validation/payment';
import type { EventRegistrationRow, PaymentSubmissionRow } from '@/lib/types/database';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

// ---------------------------------------------------------------------------
// registerForEvent
// ---------------------------------------------------------------------------
export interface RegisterForEventResult {
  registration: EventRegistrationRow;
  /** Where the client should navigate next: the payment step for paid
   * events, or the My Events / pass view for confirmed free events. */
  nextRoute: string;
}

export async function registerForEvent(input: unknown): Promise<ActionResult<RegisterForEventResult>> {
  const { delegate, id: userId } = await requireDelegate();
  const supabase = await createSupabaseServerClient();

  const eventIdParsed = (input as { eventId?: unknown })?.eventId;
  if (typeof eventIdParsed !== 'string') {
    return fail('Missing eventId.', 'VALIDATION');
  }

  const { data: event } = await supabase.from('events').select('*').eq('id', eventIdParsed).maybeSingle();
  if (!event) {
    return fail('Event not found.', 'NOT_FOUND');
  }
  if (!event.registration_open) {
    return fail('Registration is not open for this event.', 'REGISTRATION_CLOSED');
  }

  const schema = buildEventRegistrationSchema(event.format, {
    minTeamSize: event.min_team_size,
    maxTeamSize: event.max_team_size,
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.message, 'VALIDATION');
  }
  const data = parsed.data as {
    eventId: string;
    extra: Record<string, unknown>;
    teamName?: string | null;
    members?: Array<{
      fullName: string;
      email: string | null;
      mobile: string | null;
      college: string | null;
      year: string | null;
      isLead: boolean;
    }>;
  };

  const { data: dup } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', event.id)
    .eq('delegate_id', delegate.id)
    .neq('status', 'CANCELLED')
    .maybeSingle();
  if (dup) {
    return fail('You are already registered for this event.', 'DUPLICATE');
  }

  if (event.capacity != null) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .in('status', ['CONFIRMED', 'PENDING_APPROVAL']);
    if ((count ?? 0) >= event.capacity) {
      return fail('This event is at capacity.', 'AT_CAPACITY');
    }
  }

  const { data: registrationCode } = await supabase.rpc('issue_registration_code');
  if (!registrationCode) {
    return fail('Could not allocate a registration code.', 'INTERNAL');
  }

  const { data: registration, error: insertError } = await supabase
    .from('event_registrations')
    .insert({
      registration_code: registrationCode,
      event_id: event.id,
      delegate_id: delegate.id,
      user_id: userId,
      status: 'DRAFT',
      extra: data.extra as never,
      registered_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !registration) {
    return fail(insertError?.message ?? 'Could not create registration.', insertError?.code);
  }

  let finalRegistration = registration;

  if (event.format === 'TEAM' && data.members) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ event_id: event.id, name: data.teamName ?? null })
      .select('*')
      .single();

    if (teamError || !team) {
      return fail(teamError?.message ?? 'Could not create team.', teamError?.code);
    }

    const { error: membersError } = await supabase.from('team_members').insert(
      data.members.map((m) => ({
        team_id: team.id,
        full_name: m.fullName,
        email: m.email,
        mobile: m.mobile,
        college: m.college,
        year: m.year,
        is_lead: m.isLead,
      }))
    );
    if (membersError) {
      return fail(membersError.message, membersError.code);
    }

    await supabase.from('teams').update({ lead_registration_id: registration.id }).eq('id', team.id);

    const { data: updated } = await supabase
      .from('event_registrations')
      .update({ team_id: team.id })
      .eq('id', registration.id)
      .select('*')
      .single();
    if (updated) finalRegistration = updated;
  }

  if (event.is_paid) {
    const { data: updated, error: updateError } = await supabase
      .from('event_registrations')
      .update({ status: 'PAYMENT_PENDING' })
      .eq('id', finalRegistration.id)
      .select('*')
      .single();
    if (updateError || !updated) {
      return fail(updateError?.message ?? 'Could not move registration to payment.', updateError?.code);
    }

    revalidatePath('/my-events');
    revalidatePath(`/events/${event.slug}`);

    return {
      ok: true,
      data: { registration: updated, nextRoute: `/events/${event.slug}/register/payment` },
    };
  }

  // Free event: go through confirm_free_event_registration() — the only
  // path allowed to write CONFIRMED/PENDING_APPROVAL and issue a QR.
  const admin = createSupabaseAdminClient();
  const { data: confirmed, error: rpcError } = await admin.rpc('confirm_free_event_registration', {
    p_registration_id: finalRegistration.id,
    p_actor: userId,
  });

  if (rpcError || !confirmed) {
    return fail(rpcError?.message ?? 'Could not confirm registration.', rpcError?.code);
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    kind: confirmed.status === 'PENDING_APPROVAL' ? 'EVENT_REGISTRATION_PENDING_APPROVAL' : 'EVENT_REGISTRATION_CONFIRMED',
    title: confirmed.status === 'PENDING_APPROVAL' ? 'Registration pending approval' : 'Registration confirmed',
    body: `${event.name}`,
    link: '/my-events',
  });

  revalidatePath('/my-events');
  revalidatePath('/home');
  revalidatePath(`/events/${event.slug}`);

  return { ok: true, data: { registration: confirmed, nextRoute: '/my-events' } };
}

// ---------------------------------------------------------------------------
// submitEventPayment
// ---------------------------------------------------------------------------
export async function submitEventPayment(formData: FormData): Promise<ActionResult<PaymentSubmissionRow>> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const registrationId = formData.get('registrationId');
  if (typeof registrationId !== 'string' || registrationId.length === 0) {
    return fail('Missing registrationId.', 'VALIDATION');
  }

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('*, event:events(*)')
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!registration) {
    return fail('Registration not found.', 'NOT_FOUND');
  }
  if (!['PAYMENT_PENDING', 'PAYMENT_REJECTED'].includes(registration.status)) {
    return fail('Payment cannot be submitted in the current registration state.', 'INVALID_STATE');
  }

  const event = (registration as unknown as { event: { id: string; fee_inr: number | null } }).event;

  const { data: paymentSettings } = await supabase
    .from('payment_settings')
    .select('require_transaction_ref')
    .eq('is_active', true)
    .maybeSingle();

  const schema = buildPaymentSubmissionSchema(paymentSettings?.require_transaction_ref ?? false);
  const parsed = schema.safeParse({
    screenshot: formData.get('screenshot'),
    transactionReference: formData.get('transactionReference') ?? '',
  });
  if (!parsed.success) {
    return fail(parsed.error.message, 'VALIDATION');
  }

  const { screenshot, transactionReference } = parsed.data;
  const ext = (screenshot.name.split('.').pop() || 'jpg').toLowerCase();
  const submissionId = crypto.randomUUID();
  const objectPath = `payments/${user.id}/event/${submissionId}.${ext}`;

  const admin = createSupabaseAdminClient();
  const { error: uploadError } = await admin.storage
    .from('payment-screenshots')
    .upload(objectPath, screenshot, { contentType: screenshot.type, upsert: false });

  if (uploadError) {
    return fail(`Could not upload screenshot: ${uploadError.message}`, 'UPLOAD_FAILED');
  }

  const { data: submission, error: insertError } = await supabase
    .from('payment_submissions')
    .insert({
      id: submissionId,
      user_id: user.id,
      payment_type: 'EVENT',
      event_registration_id: registration.id,
      expected_amount_inr: event?.fee_inr ?? null,
      screenshot_storage_path: objectPath,
      transaction_reference: transactionReference,
      status: 'PENDING_REVIEW',
    })
    .select('*')
    .single();

  if (insertError || !submission) {
    return fail(insertError?.message ?? 'Could not record payment submission.', insertError?.code);
  }

  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({ status: 'PAYMENT_UNDER_REVIEW' })
    .eq('id', registration.id);

  if (updateError) {
    return fail(updateError.message, updateError.code);
  }

  await supabase.from('notifications').insert({
    user_id: user.id,
    kind: 'EVENT_PAYMENT_SUBMITTED',
    title: 'Event payment submitted for review',
    link: '/my-events',
  });

  revalidatePath('/my-events');
  revalidatePath('/home');

  return { ok: true, data: submission };
}

// ---------------------------------------------------------------------------
// cancelRegistration
// ---------------------------------------------------------------------------
export async function cancelRegistration(input: unknown): Promise<ActionResult<EventRegistrationRow>> {
  const parsed = cancelRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.message, 'VALIDATION');
  }
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('id', parsed.data.registrationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!registration) {
    return fail('Registration not found.', 'NOT_FOUND');
  }
  // RLS allows self-cancel only from DRAFT/PAYMENT_PENDING/PAYMENT_REJECTED/
  // PAYMENT_UNDER_REVIEW — a CONFIRMED or already-CANCELLED registration
  // cannot be cancelled by the participant (mirrors the write policy).
  if (!['DRAFT', 'PAYMENT_PENDING', 'PAYMENT_REJECTED', 'PAYMENT_UNDER_REVIEW'].includes(registration.status)) {
    return fail('This registration can no longer be cancelled.', 'INVALID_STATE');
  }

  const { data: updated, error } = await supabase
    .from('event_registrations')
    .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
    .eq('id', registration.id)
    .select('*')
    .single();

  if (error || !updated) {
    return fail(error?.message ?? 'Could not cancel registration.', error?.code);
  }

  revalidatePath('/my-events');
  revalidatePath('/home');

  return { ok: true, data: updated };
}
