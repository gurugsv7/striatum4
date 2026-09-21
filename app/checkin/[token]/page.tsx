import Link from "next/link";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { getOptionalUser } from "@/lib/auth/guards";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import type { EventRegistrationRow, EventRow, QrCredentialRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface CheckinPageProps {
  params: Promise<{ token: string }>;
}

/**
 * The URL an event QR resolves to. NOT self-service check-in — actual
 * redemption happens only via /admin/checkin's redeem_event_qr() RPC call.
 * A participant opening their own QR sees a read-only verification view; an
 * admin is pointed to the scanner instead.
 */
export default async function CheckinPage({ params }: CheckinPageProps) {
  const { token } = await params;
  const user = await getOptionalUser();

  if (!user) {
    return (
      <Focused>
        <EmptyState
          title="Sign in to view this pass"
          description="This event pass belongs to a STRIATUM account. Sign in to verify it."
          action={
            <Link
              href={`/signin?next=${encodeURIComponent(`/checkin/${token}`)}`}
              className="inline-flex h-11 items-center rounded-md bg-signal-500 px-5 text-[15px] font-semibold text-abyss-900 hover:bg-signal-400"
            >
              SIGN IN
            </Link>
          }
        />
      </Focused>
    );
  }

  const supabase = await createSupabaseServerComponentClient();

  const { data: isAdmin } = await supabase.rpc("is_admin", { p_uid: user.id });
  if (isAdmin) {
    return (
      <Focused>
        <EmptyState
          title="Admin account detected"
          description="Event check-in is performed from the admin scanner, not this link."
          action={
            <Link
              href="/admin/checkin"
              className="inline-flex h-11 items-center rounded-md bg-signal-500 px-5 text-[15px] font-semibold text-abyss-900 hover:bg-signal-400"
            >
              OPEN ADMIN SCANNER
            </Link>
          }
        />
      </Focused>
    );
  }

  const { data: credential } = await supabase
    .from("qr_credentials")
    .select("*")
    .eq("token", token)
    .maybeSingle<QrCredentialRow>();

  if (!credential) {
    return (
      <Focused>
        <EmptyState
          title="INVALID PASS"
          description="This pass could not be verified. It may not exist, or it doesn't belong to your account."
        />
      </Focused>
    );
  }

  const { data: registration } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("id", credential.event_registration_id)
    .maybeSingle<EventRegistrationRow>();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", credential.event_id)
    .maybeSingle<EventRow>();

  if (!registration || !event) {
    return (
      <Focused>
        <EmptyState title="INVALID PASS" description="This pass could not be verified." />
      </Focused>
    );
  }

  return (
    <Focused>
      <Panel className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">EVENT PASS</span>
        <h1 className="font-serif text-2xl text-ice-100">{event.name}</h1>
        <StatusChip status={registration.status} />
        <p className="mt-2 max-w-[32ch] text-[14px] text-ice-500">
          Present this pass at the venue for check-in. This page does not check you in.
        </p>
      </Panel>
    </Focused>
  );
}

function Focused({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-1 flex-col gap-4 pt-6 pb-10">{children}</PageContainer>
    </div>
  );
}
