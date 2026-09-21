import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LogoMark } from "@/components/brand/LogoMark";
import { Signal } from "@/components/signal/Signal";
import { Panel } from "@/components/ui/Panel";

export const dynamic = "force-dynamic";

interface VerifiedDelegate {
  fullName: string;
  delegateId: string;
  college: string;
}

/**
 * Public, unauthenticated landing for a scanned Delegate Pass QR. Verification
 * only — never checks anyone in, never exposes email/mobile/payment data.
 * Reads through the service-role client because this is intentionally the
 * one delegate lookup with no signed-in owner (docs/03-ARCHITECTURE.md §2
 * notes this route as read-only, name/college/status only).
 */
async function lookupDelegate(token: string): Promise<VerifiedDelegate | null> {
  if (!token) return null;
  const admin = createSupabaseAdminClient();

  const { data: delegate } = await admin
    .from("delegates")
    .select("delegate_id, status, application_id")
    .eq("verification_token", token)
    .maybeSingle();

  if (!delegate || delegate.status !== "ACTIVE") return null;

  const { data: application } = await admin
    .from("delegate_applications")
    .select("full_name, college")
    .eq("id", delegate.application_id)
    .maybeSingle();

  if (!application) return null;

  return {
    fullName: application.full_name,
    delegateId: delegate.delegate_id,
    college: application.college,
  };
}

export default async function VerifyDelegatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const delegate = await lookupDelegate(token);

  return (
    <main className="abyss-wash flex min-h-dvh flex-col items-center justify-center bg-abyss-900 px-6 py-16 text-center">
      <div className="flex w-full max-w-[380px] flex-col items-center gap-8">
        <LogoMark size={40} />

        {delegate ? (
          <Panel wash className="flex w-full flex-col items-center gap-4 py-8">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-signal-500">
              Valid delegate
            </span>
            <Signal orientation="vertical" variant="arrived" length={32} />
            <div className="flex flex-col items-center gap-1">
              <p className="text-[24px] font-semibold text-ice-100">{delegate.fullName}</p>
              <p className="font-mono text-[18px] text-signal-400">{delegate.delegateId}</p>
              <p className="text-[15px] text-ice-500">{delegate.college}</p>
            </div>
            <span className="mt-2 inline-flex h-7 items-center rounded-full border border-signal-500/40 bg-signal-500/10 px-2.5 text-[13px] font-medium text-signal-400">
              Active
            </span>
          </Panel>
        ) : (
          <Panel className="flex w-full flex-col items-center gap-3 border-danger/30 bg-danger/5 py-10">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-danger">
              Invalid pass
            </span>
            <p className="max-w-[32ch] text-[15px] leading-[1.55] text-ice-500">
              This delegate pass could not be verified. It may be revoked or the link may be
              incorrect.
            </p>
          </Panel>
        )}

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice-700">
          STRIATUM 4.0 · IGMCRI · SIGMA 2026
        </p>
      </div>
    </main>
  );
}
