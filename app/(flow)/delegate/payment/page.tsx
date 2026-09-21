import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getDelegateApplication } from "@/lib/queries/delegate";
import { getActivePaymentSettings } from "@/lib/queries/settings";
import { DelegatePaymentPanel } from "@/components/delegate/DelegatePaymentPanel";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { feeLabel } from "@/lib/format/currency";

function publicBrandAssetUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/brand-assets/${path}`;
}

export default async function DelegatePaymentPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/signin?next=/delegate/payment");
  }

  const [application, paymentSettings] = await Promise.all([
    getDelegateApplication(user.id),
    getActivePaymentSettings(),
  ]);

  if (!application) redirect("/delegate/register");
  if (application.status === "APPROVED") redirect("/delegate/pass");
  if (application.status === "PAYMENT_UNDER_REVIEW") redirect("/delegate/status");
  if (application.status === "PAYMENT_REJECTED") redirect("/delegate/status");
  if (application.status === "DRAFT") redirect("/delegate/register");

  const amountKnown = paymentSettings?.delegate_fee_inr != null;

  return (
    <div className="min-h-dvh bg-abyss-900">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-col gap-8 py-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
            DELEGATE REGISTRATION
          </p>
          <h1 className="font-serif text-[28px] leading-tight text-ice-100">
            Complete your access.
          </h1>
        </div>

        <DelegatePaymentPanel
          participantName={application.full_name}
          institution={application.college}
          amountLabel={feeLabel(paymentSettings?.delegate_fee_inr ?? null, true)}
          amountKnown={amountKnown}
          qrImageUrl={publicBrandAssetUrl(paymentSettings?.qr_storage_path ?? null)}
          payeeName={paymentSettings?.payee_name ?? null}
          upiId={paymentSettings?.upi_id ?? null}
          requireTransactionRef={paymentSettings?.require_transaction_ref ?? false}
        />
      </PageContainer>
    </div>
  );
}
