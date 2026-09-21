import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireFinanceAdmin, AuthError } from '@/lib/auth/guards';
import {
  buildDelegateExportRows,
  buildEventRegistrationExportRows,
  buildPaymentQueueExportRows,
} from '@/lib/queries/admin';
import { listPublishedResults } from '@/lib/queries/results';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { toCsv } from '../csv';

export const dynamic = 'force-dynamic';

type ExportType =
  | 'all-delegates'
  | 'approved-delegates'
  | 'pending-payments'
  | 'all-registrations'
  | 'event-registrations'
  | 'checkins'
  | 'published-results';

function csvResponse(filename: string, body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as ExportType | null;
  const eventId = searchParams.get('eventId') ?? undefined;

  switch (type) {
    case 'all-delegates': {
      const rows = await buildDelegateExportRows();
      const csv = toCsv(
        ['delegate_id', 'application_status', 'full_name', 'email', 'mobile', 'college', 'year_of_study', 'student_id', 'submitted_at', 'reviewed_at'],
        rows.map((r) => [
          r.delegateId,
          r.applicationStatus,
          r.fullName,
          r.email,
          r.mobile,
          r.college,
          r.yearOfStudy,
          r.studentId,
          r.submittedAt,
          r.reviewedAt,
        ])
      );
      return csvResponse('all-delegates.csv', csv);
    }

    case 'approved-delegates': {
      const rows = (await buildDelegateExportRows()).filter((r) => r.applicationStatus === 'APPROVED');
      const csv = toCsv(
        ['delegate_id', 'full_name', 'email', 'mobile', 'college', 'year_of_study', 'student_id', 'submitted_at', 'reviewed_at'],
        rows.map((r) => [r.delegateId, r.fullName, r.email, r.mobile, r.college, r.yearOfStudy, r.studentId, r.submittedAt, r.reviewedAt])
      );
      return csvResponse('approved-delegates.csv', csv);
    }

    case 'pending-payments': {
      await requireFinanceAdmin();
      const rows = await buildPaymentQueueExportRows({ status: 'PENDING_REVIEW' });
      const csv = toCsv(
        ['submission_id', 'payment_type', 'applicant_name', 'applicant_email', 'event_name', 'expected_amount_inr', 'transaction_reference', 'submitted_at'],
        rows.map((r) => [
          r.id,
          r.payment_type,
          r.applicantName,
          r.applicantEmail,
          r.eventName,
          r.expected_amount_inr,
          r.transaction_reference,
          r.submitted_at,
        ])
      );
      return csvResponse('pending-payments.csv', csv);
    }

    case 'all-registrations': {
      const rows = await buildEventRegistrationExportRows();
      const csv = toCsv(
        ['registration_code', 'event_name', 'delegate_name', 'status', 'team_name', 'registered_at', 'confirmed_at'],
        rows.map((r) => [r.registrationCode, r.eventName, r.delegateName, r.status, r.teamName, r.registeredAt, r.confirmedAt])
      );
      return csvResponse('all-event-registrations.csv', csv);
    }

    case 'event-registrations': {
      if (!eventId) return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
      const rows = await buildEventRegistrationExportRows(eventId);
      const csv = toCsv(
        ['registration_code', 'event_name', 'delegate_name', 'status', 'team_name', 'registered_at', 'confirmed_at'],
        rows.map((r) => [r.registrationCode, r.eventName, r.delegateName, r.status, r.teamName, r.registeredAt, r.confirmedAt])
      );
      return csvResponse('event-registrations.csv', csv);
    }

    case 'checkins': {
      const supabase = await createSupabaseServerComponentClient();
      const { data } = await supabase
        .from('check_ins')
        .select('*, event:events(name), delegate:delegates(delegate_id)')
        .order('checked_in_at', { ascending: true });
      const rows = (data ?? []) as unknown as Array<{
        event_registration_id: string;
        event: { name: string } | null;
        delegate: { delegate_id: string } | null;
        checked_in_at: string;
      }>;
      const csv = toCsv(
        ['event_registration_id', 'event_name', 'delegate_id', 'checked_in_at'],
        rows.map((r) => [r.event_registration_id, r.event?.name ?? null, r.delegate?.delegate_id ?? null, r.checked_in_at])
      );
      return csvResponse('checkin-attendance.csv', csv);
    }

    case 'published-results': {
      const results = await listPublishedResults();
      const rows: (string | number | null)[][] = [];
      for (const result of results) {
        for (const entry of result.entries) {
          rows.push([
            result.event?.name ?? null,
            entry.position,
            entry.participant_name,
            entry.institution,
            entry.score,
            entry.label,
            result.published_at,
          ]);
        }
      }
      const csv = toCsv(
        ['event_name', 'position', 'participant_or_team', 'institution', 'score', 'label', 'published_at'],
        rows
      );
      return csvResponse('published-results.csv', csv);
    }

    default:
      return NextResponse.json({ error: 'Unknown export type.' }, { status: 400 });
  }
}
