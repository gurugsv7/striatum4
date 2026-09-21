import { redirect } from "next/navigation";

import { requireUser, getDelegateState } from "@/lib/auth/guards";
import { getDelegateApplication } from "@/lib/queries/delegate";
import { ProfilePanel } from "@/components/profile/ProfilePanel";
import { AppHeader } from "@/components/shell/AppHeader";
import { PageContainer } from "@/components/shell/PageContainer";

export default async function ProfilePage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/signin?next=/profile");
  }

  const [delegateState, application] = await Promise.all([
    getDelegateState(user.id),
    getDelegateApplication(user.id),
  ]);

  return (
    <div className="min-h-dvh bg-abyss-900">
      <AppHeader />
      <PageContainer className="flex flex-col gap-8 py-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
            PROFILE
          </p>
          <h1 className="mt-1 font-serif text-[28px] text-ice-100">
            {user.profile.full_name?.trim() || "Your account"}
          </h1>
        </div>

        <ProfilePanel
          email={user.email}
          fullName={user.profile.full_name}
          delegateState={delegateState}
          application={application}
          memberSince={user.profile.created_at}
        />
      </PageContainer>
    </div>
  );
}
