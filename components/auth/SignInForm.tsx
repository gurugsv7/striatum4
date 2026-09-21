"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, ShieldCheck, ArrowLeft } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/brand/LogoMark";
import { Signal } from "@/components/signal/Signal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Divider } from "@/components/ui/Divider";

const RESEND_COOLDOWN_SECONDS = 45;

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export interface SignInFormProps {
  next: string;
  initialError?: string;
}

type Stage = "form" | "sent";

/**
 * Sign in (`/signin`). Passwordless magic link (email OTP) + Google OAuth.
 * Conventional behaviour: real Supabase calls, real error states, a
 * rate-limited resend affordance once the magic link has been sent.
 */
export function SignInForm({ next, initialError }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(
    initialError ? decodeErrorMessage(initialError) : null
  );
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingGoogle, setSendingGoogle] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000) as unknown as number;
  }, []);

  const sendMagicLink = useCallback(async () => {
    setFormError(null);
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);
    setSendingEmail(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        if (error.status === 429 || /rate limit/i.test(error.message)) {
          setFormError("Too many attempts. Wait a moment before trying again.");
        } else {
          setFormError(error.message || "Could not send the sign-in link. Try again.");
        }
        return;
      }
      setStage("sent");
      startCooldown();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSendingEmail(false);
    }
  }, [email, next, startCooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || sendingEmail) return;
    await sendMagicLink();
  }, [cooldown, sendingEmail, sendMagicLink]);

  const handleGoogle = useCallback(async () => {
    setGoogleError(null);
    setSendingGoogle(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setGoogleError(error.message || "Google sign-in failed. Try again.");
        setSendingGoogle(false);
      }
      // On success the browser navigates away to Google — no further state change needed.
    } catch {
      setGoogleError("Network error. Check your connection and try again.");
      setSendingGoogle(false);
    }
  }, [next]);

  return (
    <main className="abyss-wash flex min-h-dvh flex-col bg-abyss-900 px-6 py-10">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-10">
        {/* brand block */}
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark size={44} />
          <p className="max-w-[26ch] font-mono text-[11px] uppercase leading-[1.6] tracking-[0.12em] text-ice-500">
            INDIRA GANDHI MEDICAL COLLEGE &amp; RESEARCH INSTITUTE
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
            SIGMA 2026 PRESENTS
          </p>
          <div className="h-px w-16 bg-line-100" />
        </div>

        {/* wordmark */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif text-[34px] leading-none text-ice-100">
            STRIATUM <span className="text-signal-500">4.0</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ice-500">
            MEDICAL SYMPOSIUM 2026
          </p>
        </div>

        {stage === "form" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-2xl text-ice-100">Welcome</h2>
              <p className="text-[15px] text-ice-500">Sign in to access STRIATUM 4.0.</p>
            </div>

            <div className="flex flex-col gap-3">
              <Field label="Email" htmlFor="signin-email" error={emailError ?? undefined}>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@college.edu"
                  leadingIcon={<Mail className="size-4" />}
                  invalid={!!emailError}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMagicLink();
                  }}
                />
              </Field>

              {formError ? (
                <p role="alert" className="text-[13px] font-medium text-danger">
                  {formError}
                </p>
              ) : null}

              <Button
                className="w-full"
                loading={sendingEmail}
                onClick={sendMagicLink}
                disabled={sendingGoogle}
              >
                Continue with Email
              </Button>
            </div>

            <Divider label="or" />

            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                className="w-full"
                loading={sendingGoogle}
                disabled={sendingEmail}
                onClick={handleGoogle}
              >
                Continue with Google
              </Button>
              {googleError ? (
                <p role="alert" className="text-[13px] font-medium text-danger">
                  {googleError}
                </p>
              ) : null}
            </div>

            <div className="flex items-start gap-2 text-[13px] leading-[1.5] text-ice-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                By continuing you agree to the STRIATUM 4.0 terms and privacy policy.
              </span>
            </div>
          </div>
        ) : (
          <SentState
            email={email}
            cooldown={cooldown}
            resending={sendingEmail}
            onResend={handleResend}
            onChangeEmail={() => {
              setStage("form");
              setFormError(null);
            }}
          />
        )}
      </div>

      <div className="relative mx-auto mt-10 w-full max-w-[420px] border-t border-line-100 pt-4 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice-500">
          IGMCRI · STRIATUM 4.0 / SIGMA 2026
        </p>
      </div>
    </main>
  );
}

function SentState({
  email,
  cooldown,
  resending,
  onResend,
  onChangeEmail,
}: {
  email: string;
  cooldown: number;
  resending: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Signal orientation="vertical" variant="pulse" length={48} />
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-ice-100">Check your email</h2>
        <p className="max-w-[32ch] text-[15px] leading-[1.55] text-ice-500">
          We sent a sign-in link to <span className="font-medium text-ice-100">{email}</span>.
          Open it on this device to continue.
        </p>
      </div>

      <button
        type="button"
        onClick={onResend}
        disabled={cooldown > 0 || resending}
        className="text-[13px] font-semibold text-signal-500 underline underline-offset-4 disabled:cursor-not-allowed disabled:text-ice-700 disabled:no-underline"
      >
        {cooldown > 0 ? `Resend link in ${cooldown}s` : resending ? "Sending…" : "Resend link"}
      </button>

      <button
        type="button"
        onClick={onChangeEmail}
        className="inline-flex items-center gap-1.5 text-[13px] text-ice-500 hover:text-ice-100"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Use a different email
      </button>
    </div>
  );
}

function decodeErrorMessage(code: string): string {
  switch (code) {
    case "auth_callback_failed":
      return "That sign-in link is invalid or has expired. Request a new one.";
    case "no_code":
      return "That sign-in link is incomplete. Request a new one.";
    default:
      return "Something went wrong signing you in. Try again.";
  }
}
