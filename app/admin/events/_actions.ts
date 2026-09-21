'use server';

/**
 * STRIATUM 4.0 admin — event-scoped admin actions not covered by
 * lib/actions/admin.ts: the event_form_fields editor and the per-event
 * payment-QR-image override upload. lib/** is outside this deliverable's
 * ownership, so these are admin-console-local actions following the same
 * conventions (requireAdmin() first, zod validation, ActionResult<T>,
 * revalidatePath). RLS already grants the admin role read/write on
 * event_form_fields and events (see docs/02-SCHEMA.md §5), and admin-only
 * write on the public brand-assets bucket (docs/02-SCHEMA.md §4) — both
 * reachable through the regular cookie-bound server client, no service-role
 * client needed here.
 */
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { EventFormFieldRow } from '@/lib/types/database';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

const upsertFieldSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string().uuid(),
  key: z
    .string()
    .trim()
    .min(1, 'Key is required.')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Key may contain only lowercase letters, numbers, and underscores.'),
  label: z.string().trim().min(1, 'Label is required.').max(200),
  helpText: z.string().trim().max(500).optional().nullable(),
  fieldType: z.enum(['TEXT', 'EMAIL', 'TEL', 'NUMBER', 'SELECT', 'TEXTAREA', 'DATE']),
  options: z.array(z.string().trim().min(1)).optional().nullable(),
  required: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type UpsertEventFormFieldInput = z.infer<typeof upsertFieldSchema>;

export async function upsertEventFormField(
  input: unknown
): Promise<ActionResult<EventFormFieldRow>> {
  const parsed = upsertFieldSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const payload = {
    event_id: v.eventId,
    key: v.key,
    label: v.label,
    help_text: v.helpText ?? null,
    field_type: v.fieldType,
    options: (v.options ?? null) as never,
    required: v.required,
    sort_order: v.sortOrder,
    is_active: v.isActive,
  };

  const { data, error } = v.id
    ? await supabase.from('event_form_fields').update(payload).eq('id', v.id).select('*').single()
    : await supabase.from('event_form_fields').insert(payload).select('*').single();

  if (error || !data) return fail(error?.message ?? 'Could not save the field.', error?.code);

  revalidatePath(`/admin/events/${v.eventId}`);
  return { ok: true, data };
}

const deleteFieldSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
});

export async function deleteEventFormField(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteFieldSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.message, 'VALIDATION');

  await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('event_form_fields').delete().eq('id', parsed.data.id);
  if (error) return fail(error.message, error.code);

  revalidatePath(`/admin/events/${parsed.data.eventId}`);
  return { ok: true, data: { id: parsed.data.id } };
}

// ---------------------------------------------------------------------------
// Per-event payment QR image override
// ---------------------------------------------------------------------------
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadEventPaymentQr(formData: FormData): Promise<ActionResult<{ path: string }>> {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  const supabase = await createSupabaseServerClient();

  const eventId = formData.get('eventId');
  const file = formData.get('qrImage');

  if (typeof eventId !== 'string' || !eventId) return fail('Missing event id.', 'VALIDATION');
  if (!(file instanceof File) || file.size === 0) return fail('Choose an image to upload.', 'VALIDATION');
  if (!ACCEPTED_TYPES.includes(file.type)) return fail('Only JPG, PNG or WEBP images are accepted.', 'VALIDATION');
  if (file.size > MAX_BYTES) return fail('File must be 8MB or smaller.', 'VALIDATION');

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `events/${eventId}/qr.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('brand-assets')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) return fail(`Could not upload QR image: ${uploadError.message}`, 'UPLOAD_FAILED');

  const { error: updateError } = await supabase
    .from('events')
    .update({ payment_qr_storage_path: path })
    .eq('id', eventId);
  if (updateError) return fail(updateError.message, updateError.code);

  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true, data: { path } };
}
