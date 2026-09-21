import Link from "next/link";
import { notFound } from "next/navigation";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { EventPassCard } from "@/components/event/EventPassCard";
import { requireUser } from "@/lib/auth/guards";
import { getRegistrationWithPass } from "@/lib/queries/registrations";
import { getDelegate } from "@/lib/queries/delegate";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { buildEventCheckinUrl } from "@/lib/qr/render";

export const dynamic = "force-dynamic";

interface PassPageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function EventPassPage({ params }: PassPageProps) {
  const { registrationId } = await params;
  const user = await requireUser();

  const registration = await getRegistrationWithPass(registrationId, user.id);
  if (!registration || !registration.event) notFound();

  const event = registration.event;

  if (registration.status !== "CONFIRMED") {
    const message: Record<string, { title: string; description: string }> = {
      DRAFT: { title: "Registration incomplete", description: "This registration hasn't been finished yet." },
      PAYMENT_PENDING: {
        title: "Payment incomplete",
        description: "Complete payment to confirm this registration and receive your event pass.",
      },
      PAYMENT_UNDER_REVIEW: {
        title: "Payment under review",
        description: "Your payment proof has been received. Your pass will appear here once it's approved.",
      },
      PAYMENT_REJECTED: {
        title: "Payment needs attention",
        description: "Your payment could not be verified. Resubmit your proof to continue.",
      },
      PENDING_APPROVAL: {
        title: "Pending approval",
        description: "Your registration is awaiting organizer approval. Your pass will appear here once confirmed.",
      },
      CANCELLED: { title: "Registration cancelled", description: "This registration is no longer active." },
    };
    const state = message[registration.status] ?? {
      title: "Pass not available",
      description: "This registration is not confirmed yet.",
    };

    return (
      <Focused>
        <EmptyState
          title={state.title}
          description={state.description}
          action={<StatusChip status={registration.status} />}
        />
        {["PAYMENT_PENDING", "PAYMENT_REJECTED"].includes(registration.status) ? (
          <Link
            href={`/events/${event.slug}/register/payment`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-signal-500 px-5 text-[15px] font-semibold text-abyss-900 hover:bg-signal-400"
          >
            Go to payment
          </Link>
        ) : null}
      </Focused>
    );
  }

  if (!registration.qrCredential) {
    // CONFIRMED but no credential yet is not an expected state — render an
    // honest "not issued" message instead of pretending a QR exists.
    return (
      <Focused>
        <EmptyState title="Pass not yet issued" description="Your event pass QR hasn't been generated yet." />
      </Focused>
    );
  }

  const [delegate, checkIn] = await Promise.all([
    getDelegate(user.id),
    (async () => {
      const supabase = await createSupabaseServerComponentClient();
      const { data } = await supabase
        .from("check_ins")
        .select("checked_in_at")
        .eq("qr_credential_id", registration.qrCredential!.id)
        .maybeSingle();
      return data;
    })(),
  ]);

  return (
    <Focused>
      <EventPassCard
        event={event}
        participantName={user.profile.full_name ?? ""}
        delegateId={delegate?.delegate_id ?? "—"}
        registrationCode={registration.registration_code}
        qrValue={buildEventCheckinUrl(registration.qrCredential.token)}
        checkedIn={!!checkIn}
        checkedInAt={checkIn?.checked_in_at ?? null}
      />
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
