import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth/guards";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getOptionalUser();
  const { next, error } = await searchParams;

  if (user) {
    redirect(next && next.startsWith("/") ? next : "/home");
  }

  return <SignInForm next={next && next.startsWith("/") ? next : "/home"} initialError={error} />;
}
