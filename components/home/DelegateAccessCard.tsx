import Link from "next/link";

import type { DelegateState } from "@/lib/auth/guards";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DelegateImprint, type DelegateImprintState } from "@/components/delegate/DelegateImprint";

export interface DelegateAccessCardProps {
  state: DelegateState;
  fullName: string | null;
}

interface CardCopy {
  imprint: DelegateImprintState;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

function copyFor(state: DelegateState): CardCopy {
  switch (state.status) {
    case "NONE":
      return {
        imprint: "unassigned",
        heading: "Your Delegate ID starts everything.",
        body: "Register once to unlock event access across STRIATUM 4.0.",
        ctaLabel: "GET DELEGATE ID →",
        ctaHref: "/delegate/register",
      };
    case "DRAFT":
      return {
        imprint: "unassigned",
        heading: "Your Delegate ID starts everything.",
        body: "You started your delegate registration — pick up where you left off.",
        ctaLabel: "CONTINUE REGISTRATION →",
        ctaHref: "/delegate/register",
      };
    case "PAYMENT_PENDING":
      return {
        imprint: "unassigned",
        heading: "Payment step incomplete.",
        body: "Your details are saved. Complete payment to send your application for review.",
        ctaLabel: "COMPLETE PAYMENT →",
        ctaHref: "/delegate/payment",
      };
    case "PAYMENT_UNDER_REVIEW":
      return {
        imprint: "pending",
        heading: "Verification pending.",
        body: "Your payment proof has been received. The STRIATUM team will review it before activating your Delegate ID.",
        ctaLabel: "VIEW SUBMISSION",
        ctaHref: "/delegate/status",
      };
    case "PAYMENT_REJECTED":
      return {
        imprint: "rejected",
        heading: "Payment needs attention.",
        body: state.reason
          ? `Your Delegate payment could not be verified. ${state.reason}`
          : "Your Delegate payment could not be verified.",
        ctaLabel: "RESUBMIT PAYMENT PROOF →",
        ctaHref: "/delegate/status",
      };
    case "ACTIVE":
      return {
        imprint: "active",
        heading: "Delegate active.",
        body: "Your identity is verified across STRIATUM 4.0.",
        ctaLabel: "VIEW DELEGATE PASS →",
        ctaHref: "/delegate/pass",
      };
  }
}

/** `01 / DELEGATE ACCESS` — driven entirely by getDelegateState(userId). */
export function DelegateAccessCard({ state, fullName }: DelegateAccessCardProps) {
  const copy = copyFor(state);
  const delegateId = state.status === "ACTIVE" ? state.delegate.delegate_id : undefined;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader index="01" eyebrow="DELEGATE ACCESS" heading="Your identity" />
      <Panel wash className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          {state.status === "ACTIVE" ? (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
              Delegate active
            </p>
          ) : null}
          <div>
            <h3 className="font-serif text-xl text-ice-100">{copy.heading}</h3>
            {state.status === "ACTIVE" && fullName ? (
              <p className="mt-1 text-[15px] font-semibold text-ice-100">{fullName}</p>
            ) : null}
            <p className="mt-1 text-[15px] leading-[1.55] text-ice-500">{copy.body}</p>
          </div>
          <Link href={copy.ctaHref} className="w-fit">
            <Button trailingArrow={copy.ctaLabel.includes("→")}>
              {copy.ctaLabel.replace(" →", "")}
            </Button>
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice-700">
            One ID. Many opportunities.
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-center sm:justify-end">
          <DelegateImprint state={copy.imprint} delegateId={delegateId} size="sm" />
        </div>
      </Panel>
    </section>
  );
}
