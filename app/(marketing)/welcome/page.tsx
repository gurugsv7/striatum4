import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth/guards";
import { WelcomeScreen } from "@/components/home/WelcomeScreen";

export default async function WelcomePage() {
  const user = await getOptionalUser();
  if (user) {
    redirect("/home");
  }

  return <WelcomeScreen />;
}
