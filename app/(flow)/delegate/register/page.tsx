import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { getDelegateApplication } from "@/lib/queries/delegate";
import { listActiveDelegateFormFields } from "@/lib/queries/settings";
import { DelegateRegisterForm } from "@/components/delegate/DelegateRegisterForm";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Stepper } from "@/components/ui/Stepper";
import { DelegateImprint } from "@/components/delegate/DelegateImprint";

export default async function DelegateRegisterPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/signin?next=/delegate/register");
  }

  const [application, extraFields] = await Promise.all([
    getDelegateApplication(user.id),
    listActiveDelegateFormFields(),
  ]);

  if (application?.status === "APPROVED") {
    redirect("/delegate/pass");
  }
  if (application?.status === "PAYMENT_UNDER_REVIEW") {
    redirect("/delegate/status");
  }

  return (
    <div className="min-h-dvh bg-abyss-900">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-col gap-8 py-8">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
            DELEGATE REGISTRATION
          </p>
          <h1 className="font-serif text-[30px] leading-tight text-ice-100">
            One ID.
            <br />
            <span className="text-signal-400">Many possibilities.</span>
          </h1>
          <p className="max-w-[48ch] text-[15px] leading-[1.55] text-ice-500">
            Your Delegate ID is the single identity that unlocks every STRIATUM 4.0 event —
            register once, then register for events with a tap.
          </p>
        </div>

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:justify-between">
          <Stepper steps={[{ label: "Your Details" }, { label: "Payment" }]} currentIndex={0} />
          <div className="hidden shrink-0 sm:block">
            <DelegateImprint state="unassigned" size="sm" />
          </div>
        </div>

        <DelegateRegisterForm
          extraFields={extraFields}
          defaultValues={{
            fullName: application?.full_name ?? user.profile.full_name ?? "",
            email: user.email,
            mobile: application?.mobile ?? "",
            college: application?.college ?? "",
            yearOfStudy: application?.year_of_study ?? "",
            studentId: application?.student_id ?? "",
            extra: (application?.extra as Record<string, unknown>) ?? {},
          }}
        />
      </PageContainer>
    </div>
  );
}
