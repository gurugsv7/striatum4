import { redirect } from "next/navigation";

import { requireUser, getDelegateState } from "@/lib/auth/guards";
import { getDelegateApplication } from "@/lib/queries/delegate";
import { buildDelegateVerifyUrl } from "@/lib/qr/render";
import { DelegatePassCard } from "@/components/delegate/DelegatePassCard";
import { AppHeader } from "@/components/shell/AppHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { BottomNav } from "@/components/shell/BottomNav";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function DelegatePassPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/signin?next=/delegate/pass");
  }

  const state = await getDelegateState(user.id);

  if (state.status !== "ACTIVE") {
    switch (state.status) {
      case "PAYMENT_UNDER_REVIEW":
        redirect("/delegate/status");
        break;
      case "PAYMENT_REJECTED":
        redirect("/delegate/status");
        break;
      case "PAYMENT_PENDING":
        redirect("/delegate/payment");
        break;
      default:
        redirect("/delegate/register");
    }
  }

  const delegate = state.delegate;
  const application = await getDelegateApplication(user.id);
  const verifyUrl = buildDelegateVerifyUrl(delegate.verification_token);

  return (
    <div className="min-h-dvh bg-abyss-900 pb-24">
      <AppHeader />
      <PageContainer className="flex flex-col gap-8 py-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
            Registration complete
          </p>
          <h1 className="font-serif text-[24px] leading-tight text-ice-100">You&apos;re in.</h1>
          <p className="text-[15px] text-ice-500">Your Delegate ID is ready.</p>
        </div>

        <DelegatePassCard
          delegateId={delegate.delegate_id}
          participantName={application?.full_name ?? user.profile.full_name ?? "Delegate"}
          institution={application?.college ?? null}
          yearOfStudy={application?.year_of_study ?? null}
          verifyUrl={verifyUrl}
        />

        <div className="flex flex-col gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
              What&apos;s next?
            </p>
            <h2 className="font-serif text-xl text-ice-100">Find your events.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore">
              <Button variant="secondary" trailingArrow>
                Explore events
              </Button>
            </Link>
            <Link href="/programme">
              <Button variant="secondary" trailingArrow>
                View programme
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
      <BottomNav />
    </div>
  );
}
