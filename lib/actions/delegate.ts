'use server';

/**
 * STRIATUM 4.0 — participant-facing delegate server actions.
 *
 * Ordinary CRUD (save application, insert a payment submission, move the
 * application into PAYMENT_UNDER_REVIEW) is allowed by RLS for the acting
 * user and uses the RLS-scoped server client. Nothing here ever writes
 * APPROVED — that transition only happens through approve_delegate_payment()
 * in lib/actions/admin.ts, called by an admin.
 */
import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { saveDelegateApplicationSchema } from '@/lib/validation/delegate';
import { buildPaymentSubmissionSchema } from '@/lib/validation/payment';
import type { DelegateApplicationRow, PaymentSubmissionRow } from '@/lib/types/database';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

// ---------------------------------------------------------------------------
// saveDelegateApplication
// ---------------------------------------------------------------------------
export async function saveDelegateApplication(input: unknown): Promise<ActionResult<DelegateApplicationRow>> {
  const parsed = saveDelegateApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.message, 'VALIDATION');
  }

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from('delegate_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing && existing.status === 'APPROVED') {
    return fail('Your delegate application has already been approved and can no longer be edited.', 'ALREADY_APPROVED');
  }
  if (existing && existing.status === 'PAYMENT_UNDER_REVIEW') {
    return fail('Your payment is currently under review and the application cannot be edited.', 'UNDER_REVIEW');
  }

  const { fullName, email, mobile, college, yearOfStudy, studentId, extra } = parsed.data;

  const commonFields = {
    full_name: fullName,
    email,
    mobile,
    college,
    year_of_study: yearOfStudy,
    student_id: studentId,
    extra: extra as never,
    status: 'PAYMENT_PENDING' as const,
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = existing
    ? await supabase
        .from('delegate_applications')
        .update(commonFields)
        .eq('id', existing.id)
        .select('*')
        .single()
    : await supabase
        .from('delegate_applications')
        .insert({ ...commonFields, user_id: user.id })
        .select('*')
        .single();

  if (error || !data) {
    return fail(error?.message ?? 'Could not save the delegate application.', error?.code);
  }

  revalidatePath('/home');
  revalidatePath('/delegate/register');
  revalidatePath('/delegate/payment');
  revalidatePath('/profile');

  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// submitDelegatePayment
// ---------------------------------------------------------------------------
export async function submitDelegatePayment(formData: FormData): Promise<ActionResult<PaymentSubmissionRow>> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: application } = await supabase
    .from('delegate_applications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!application) {
    return fail('Complete the delegate registration form before submitting payment.', 'NOT_FOUND');
  }
  if (!['PAYMENT_PENDING', 'PAYMENT_REJECTED'].includes(application.status)) {
    return fail('Payment cannot be submitted in the current application state.', 'INVALID_STATE');
  }

  const { data: paymentSettings } = await supabase
    .from('payment_settings')
    .select('require_transaction_ref, delegate_fee_inr')
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
  const objectPath = `payments/${user.id}/delegate/${submissionId}.${ext}`;

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
      payment_type: 'DELEGATE',
      delegate_application_id: application.id,
      expected_amount_inr: paymentSettings?.delegate_fee_inr ?? null,
      screenshot_storage_path: objectPath,
      transaction_reference: transactionReference,
      status: 'PENDING_REVIEW',
    })
    .select('*')
    .single();

  if (insertError || !submission) {
    return fail(insertError?.message ?? 'Could not record the payment submission.', insertError?.code);
  }

  // App-layer transition: move the application into PAYMENT_UNDER_REVIEW.
  // Never sets APPROVED — that's admin-only via approve_delegate_payment().
  const { error: updateError } = await supabase
    .from('delegate_applications')
    .update({ status: 'PAYMENT_UNDER_REVIEW' })
    .eq('id', application.id);

  if (updateError) {
    return fail(updateError.message, updateError.code);
  }

  await supabase.from('notifications').insert({
    user_id: user.id,
    kind: 'DELEGATE_PAYMENT_SUBMITTED',
    title: 'Payment submitted for review',
    body: 'Your delegate payment screenshot was submitted and is now pending admin review.',
    link: '/delegate/status',
  });

  revalidatePath('/home');
  revalidatePath('/delegate/status');
  revalidatePath('/delegate/payment');
  revalidatePath('/profile');

  return { ok: true, data: submission };
}

// ---------------------------------------------------------------------------
// replaceDelegateScreenshot
// ---------------------------------------------------------------------------
export async function replaceDelegateScreenshot(formData: FormData): Promise<ActionResult<PaymentSubmissionRow>> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: oldSubmission } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('payment_type', 'DELEGATE')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!oldSubmission) {
    return fail('No existing delegate payment submission to replace.', 'NOT_FOUND');
  }
  if (!['PENDING_REVIEW', 'NEEDS_RESUBMISSION'].includes(oldSubmission.status)) {
    return fail('This submission can no longer be replaced.', 'INVALID_STATE');
  }

  const { data: paymentSettings } = await supabase
    .from('payment_settings')
    .select('require_transaction_ref, delegate_fee_inr')
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
  const newSubmissionId = crypto.randomUUID();
  const objectPath = `payments/${user.id}/delegate/${newSubmissionId}.${ext}`;

  const admin = createSupabaseAdminClient();
  const { error: uploadError } = await admin.storage
    .from('payment-screenshots')
    .upload(objectPath, screenshot, { contentType: screenshot.type, upsert: false });

  if (uploadError) {
    return fail(`Could not upload screenshot: ${uploadError.message}`, 'UPLOAD_FAILED');
  }

  const { data: newSubmission, error: insertError } = await supabase
    .from('payment_submissions')
    .insert({
      id: newSubmissionId,
      user_id: user.id,
      payment_type: 'DELEGATE',
      delegate_application_id: oldSubmission.delegate_application_id,
      expected_amount_inr: paymentSettings?.delegate_fee_inr ?? oldSubmission.expected_amount_inr,
      screenshot_storage_path: objectPath,
      transaction_reference: transactionReference,
      status: 'PENDING_REVIEW',
    })
    .select('*')
    .single();

  if (insertError || !newSubmission) {
    return fail(insertError?.message ?? 'Could not record the replacement submission.', insertError?.code);
  }

  // Link the old submission to the new one. The old storage object is left
  // in place (append-only bucket, no delete policy — see 0004_storage.sql)
  // rather than deleted, preserving evidence for audit history.
  await supabase
    .from('payment_submissions')
    .update({ superseded_by: newSubmission.id })
    .eq('id', oldSubmission.id);

  // Re-enter PAYMENT_UNDER_REVIEW if the application had fallen to
  // PAYMENT_REJECTED after the prior rejection.
  await supabase
    .from('delegate_applications')
    .update({ status: 'PAYMENT_UNDER_REVIEW' })
    .eq('id', oldSubmission.delegate_application_id as string)
    .in('status', ['PAYMENT_REJECTED', 'PAYMENT_UNDER_REVIEW']);

  revalidatePath('/home');
  revalidatePath('/delegate/status');
  revalidatePath('/delegate/payment');

  return { ok: true, data: newSubmission };
}
