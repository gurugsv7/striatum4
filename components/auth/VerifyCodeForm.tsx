"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface VerifyCodeFormProps {
  initialEmail: string;
  next: string;
}

/** Manual fallback: paste the 6-digit code from the magic-link email. */
export function VerifyCodeForm({ initialEmail, next }: VerifyCodeFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = useCallback(async () => {
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedToken = token.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter the email you signed in with.");
      return;
    }
    if (!trimmedToken) {
      setError("Enter the code from your email.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedToken,
        type: "email",
      });
      if (verifyError) {
        setError(verifyError.message || "That code is invalid or has expired.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [email, token, next, router]);

  return (
    <div className="min-h-dvh bg-abyss-900">
      <FocusedFlowHeader />
      <PageContainer className="flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl text-ice-100">Enter your code</h1>
          <p className="text-[15px] text-ice-500">
            Opened the link on a different device? Paste the code from your email instead.
          </p>
        </div>

        <Field label="Email" htmlFor="verify-email">
          <Input
            id="verify-email"
            type="email"
            autoComplete="email"
            leadingIcon={<Mail className="size-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Verification code" htmlFor="verify-token" error={error ?? undefined}>
          <Input
            id="verify-token"
            inputMode="numeric"
            leadingIcon={<KeyRound className="size-4" />}
            placeholder="123456"
            value={token}
            invalid={!!error}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVerify();
            }}
          />
        </Field>

        <Button className="w-full" loading={loading} onClick={handleVerify}>
          Verify and continue
        </Button>
      </PageContainer>
    </div>
  );
}
