import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth/guards";
import { VerifyCodeForm } from "@/components/auth/VerifyCodeForm";

/**
 * Fallback manual verification: if a magic-link email is opened on a
 * different device/browser than it was requested from, /auth/callback's code
 * exchange fails. This screen lets the participant instead paste the 6-digit
 * OTP code from the email and verify directly.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const user = await getOptionalUser();
  const { email, next } = await searchParams;

  if (user) {
    redirect(next && next.startsWith("/") ? next : "/home");
  }

  return (
    <VerifyCodeForm
      initialEmail={email ?? ""}
      next={next && next.startsWith("/") ? next : "/home"}
    />
  );
}
