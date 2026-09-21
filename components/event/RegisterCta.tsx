import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Signal } from "@/components/signal/Signal";
import type { EventRegistrationStatus } from "@/lib/types/enums";

export type EventCta =
  | { kind: "sign_in" }
  | { kind: "no_delegate" }
  | { kind: "delegate_pending" }
  | { kind: "delegate_rejected" }
  | { kind: "registration_closed" }
  | { kind: "event_full" }
  | { kind: "already_registered"; registrationId: string; status: EventRegistrationStatus }
  | { kind: "register" };

export interface RegisterCtaProps {
  cta: EventCta;
  eventSlug: string;
  nextPath: string;
}

/**
 * The single primary CTA on the event detail page. Every branch here mirrors
 * docs/00-PRODUCT.md §3.11 exactly — no branch invents a state that isn't
 * one of getDelegateState()'s cases or the event's own registration_open /
 * capacity / already-registered facts.
 */
export function RegisterCta({ cta, eventSlug, nextPath }: RegisterCtaProps) {
  switch (cta.kind) {
    case "sign_in":
      return (
        <CtaShell>
          <CtaLink href={`/signin?next=${encodeURIComponent(nextPath)}`}>SIGN IN TO REGISTER</CtaLink>
        </CtaShell>
      );
    case "no_delegate":
      return (
        <CtaShell helper="You'll need your Delegate ID to register for this event.">
          <CtaLink href="/delegate/register">GET DELEGATE ID</CtaLink>
        </CtaShell>
      );
    case "delegate_pending":
      return (
        <CtaShell helper="Your Delegate ID payment proof is being reviewed by the STRIATUM team.">
          <CtaDisabled>DELEGATE VERIFICATION PENDING</CtaDisabled>
        </CtaShell>
      );
    case "delegate_rejected":
      return (
        <CtaShell helper="Your Delegate payment could not be verified — resubmit to continue.">
          <CtaLink href="/delegate/payment">COMPLETE DELEGATE VERIFICATION</CtaLink>
        </CtaShell>
      );
    case "registration_closed":
      return (
        <CtaShell>
          <CtaDisabled>REGISTRATIONS CLOSED</CtaDisabled>
        </CtaShell>
      );
    case "event_full":
      return (
        <CtaShell>
          <CtaDisabled>EVENT FULL</CtaDisabled>
        </CtaShell>
      );
    case "already_registered":
      return (
        <CtaShell helper="You're registered for this event.">
          <CtaLink href={`/my-events/${cta.registrationId}`}>YOU&apos;RE REGISTERED — VIEW PASS</CtaLink>
        </CtaShell>
      );
    case "register":
      return (
        <CtaShell helper="Your Delegate ID is attached automatically.">
          <CtaLink href={`/events/${eventSlug}/register`}>REGISTER FOR THIS EVENT</CtaLink>
        </CtaShell>
      );
    default:
      return null;
  }
}

function CtaShell({ children, helper }: { children: React.ReactNode; helper?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {children}
      {helper ? <p className="text-center text-[13px] text-ice-500">{helper}</p> : null}
    </div>
  );
}

function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-md bg-signal-500 px-6",
        "font-sans text-base font-semibold text-abyss-900 transition-colors hover:bg-signal-400",
      )}
    >
      <Signal variant="dormant" length={14} className="shrink-0" />
      <span className="truncate">{children}</span>
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}

function CtaDisabled({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[52px] w-full cursor-not-allowed items-center justify-center rounded-md bg-line-200 px-6 font-sans text-base font-semibold text-ice-700">
      {children}
    </div>
  );
}
