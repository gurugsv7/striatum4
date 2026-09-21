import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getDelegateApplication, getLatestPaymentSubmission } from "@/lib/queries/delegate";
import { DelegateStatusPanel } from "@/components/delegate/DelegateStatusPanel";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";

export default async function DelegateStatusPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/signin?next=/delegate/status");
  }

  const application = await getDelegateApplication(user.id);

  if (!application) redirect("/delegate/register");
  if (application.status === "APPROVED") redirect("/delegate/pass");
  if (application.status === "DRAFT" || application.status === "PAYMENT_PENDING") {
    redirect("/delegate/payment");
  }

  const submission = await getLatestPaymentSubmission(user.id);

  return (
    <div className="min-h-dvh bg-abyss-900">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-col gap-8 py-8">
        <DelegateStatusPanel
          applicationStatus={application.status}
          rejectionReason={application.rejection_reason}
          adminNote={application.admin_note}
          submission={submission}
        />
      </PageContainer>
    </div>
  );
}
