import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventRegisterForm } from "@/components/event/EventRegisterForm";
import { getEventBySlug } from "@/lib/queries/events";
import { listActiveEventFormFields } from "@/lib/queries/settings";
import { listMyRegistrations, getRemainingCapacity } from "@/lib/queries/registrations";
import { getOptionalUser, getDelegateState } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

interface RegisterPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventRegisterPage({ params }: RegisterPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const user = await getOptionalUser();
  if (!user) {
    redirect(`/signin?next=${encodeURIComponent(`/events/${slug}/register`)}`);
  }

  const delegateState = await getDelegateState(user.id);
  if (delegateState.status !== "ACTIVE") {
    return (
      <Focused>
        <EmptyState
          title="Delegate access required"
          description="You'll need your Delegate ID to register for this event."
          action={<FlowLink href="/delegate/register">GET DELEGATE ID →</FlowLink>}
        />
      </Focused>
    );
  }

  const myRegistrations = await listMyRegistrations(user.id);
  const existing = myRegistrations.find((r) => r.event_id === event.id);

  if (existing) {
    if (existing.status === "PAYMENT_PENDING" || existing.status === "PAYMENT_REJECTED") {
      redirect(`/events/${slug}/register/payment`);
    }
    return (
      <Focused>
        <EmptyState
          title="You're already registered"
          description={`You already have a registration for ${event.name}.`}
          action={<FlowLink href="/my-events">GO TO MY EVENTS →</FlowLink>}
        />
      </Focused>
    );
  }

  if (!event.registration_open) {
    return (
      <Focused>
        <EmptyState title="Registrations closed" description="This event is not currently open for registration." />
      </Focused>
    );
  }

  if (event.capacity != null) {
    const remaining = await getRemainingCapacity(event.id);
    if (remaining !== null && remaining <= 0) {
      return (
        <Focused>
          <EmptyState title="Event full" description="This event has reached its registration capacity." />
        </Focused>
      );
    }
  }

  const formFields = await listActiveEventFormFields(event.id);

  return (
    <Focused>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">EVENT REGISTRATION</span>
        <h1 className="font-serif text-[28px] leading-tight text-ice-100">{event.name}</h1>
      </div>
      <EventRegisterForm
        event={event}
        delegateId={delegateState.delegate.delegate_id}
        participantName={user.profile.full_name ?? ""}
        participantEmail={user.profile.email ?? user.email}
        formFields={formFields}
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

function FlowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center rounded-md bg-signal-500 px-5 text-[15px] font-semibold text-abyss-900 hover:bg-signal-400"
    >
      {children}
    </Link>
  );
}
