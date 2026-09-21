import { notFound, redirect } from "next/navigation";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentUploadForm } from "@/components/event/PaymentUploadForm";
import { getEventBySlug } from "@/lib/queries/events";
import { getEventPaymentConfig } from "@/lib/queries/settings";
import { listMyRegistrations } from "@/lib/queries/registrations";
import { getOptionalUser } from "@/lib/auth/guards";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { feeLabel } from "@/lib/format/currency";

export const dynamic = "force-dynamic";

interface PaymentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPaymentPage({ params }: PaymentPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const user = await getOptionalUser();
  if (!user) {
    redirect(`/signin?next=${encodeURIComponent(`/events/${slug}/register/payment`)}`);
  }

  const myRegistrations = await listMyRegistrations(user.id);
  const registration = myRegistrations.find((r) => r.event_id === event.id);

  if (!registration) {
    return (
      <Focused>
        <EmptyState
          title="No payment pending"
          description={`You don't have a registration in progress for ${event.name}.`}
        />
      </Focused>
    );
  }

  if (registration.status === "CONFIRMED") {
    redirect(`/my-events/${registration.id}`);
  }

  if (!["PAYMENT_PENDING", "PAYMENT_UNDER_REVIEW", "PAYMENT_REJECTED"].includes(registration.status)) {
    return (
      <Focused>
        <EmptyState
          title="Nothing to pay"
          description="This registration is not currently awaiting payment."
        />
      </Focused>
    );
  }

  if (registration.status === "PAYMENT_UNDER_REVIEW") {
    return (
      <Focused>
        <Panel className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-warning">UNDER REVIEW</span>
          <h1 className="font-serif text-2xl text-ice-100">PAYMENT SUBMITTED</h1>
          <p className="max-w-[32ch] text-[15px] text-ice-500">
            Verification pending. The STRIATUM team will review your payment for {event.name}.
          </p>
        </Panel>
      </Focused>
    );
  }

  const config = await getEventPaymentConfig(event.id);
  let qrPublicUrl: string | null = null;
  if (config?.qrStoragePath) {
    const supabase = await createSupabaseServerComponentClient();
    qrPublicUrl = supabase.storage.from("brand-assets").getPublicUrl(config.qrStoragePath).data.publicUrl ?? null;
  }

  let rejectionReason: string | null = null;
  if (registration.status === "PAYMENT_REJECTED") {
    const supabase = await createSupabaseServerComponentClient();
    const { data: submission } = await supabase
      .from("payment_submissions")
      .select("rejection_reason")
      .eq("event_registration_id", registration.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    rejectionReason = submission?.rejection_reason ?? null;
  }

  return (
    <Focused>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">EVENT PAYMENT</span>
        <h1 className="font-serif text-[26px] leading-tight text-ice-100">{event.name}</h1>
      </div>

      {registration.status === "PAYMENT_REJECTED" ? (
        <Panel className="border-danger/40 bg-danger/5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-danger">
            Payment needs attention
          </span>
          <p className="mt-1.5 text-[15px] text-ice-300">
            {rejectionReason ?? "Your previous payment proof could not be verified. Resubmit below."}
          </p>
        </Panel>
      ) : null}

      <PaymentUploadForm
        registrationId={registration.id}
        amountLabel={feeLabel(event.fee_inr, event.is_paid)}
        amountKnown={event.fee_inr != null}
        qrImageUrl={qrPublicUrl}
        payeeName={config?.payeeName ?? null}
        upiId={config?.upiId ?? null}
        requireTransactionRef={config?.requireTransactionRef ?? false}
      />
    </Focused>
  );
}

function Focused({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-1 flex-col gap-6 pt-6 pb-10">{children}</PageContainer>
    </div>
  );
}
