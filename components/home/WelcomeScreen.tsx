"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/Button";
import { MembraneTransition } from "@/components/signal/MembraneTransition";

/**
 * Welcome (`/welcome`). Primary CTA activates the Signal + a translucent
 * cyan membrane transition (650-850ms), then routes to /signin. Respects
 * prefers-reduced-motion by skipping straight through.
 */
export function WelcomeScreen() {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const navigated = useRef(false);

  const handleEnter = useCallback(() => {
    if (navigated.current) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      navigated.current = true;
      router.push("/signin");
      return;
    }
    setTransitioning(true);
  }, [router]);

  const handleComplete = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    router.push("/signin");
  }, [router]);

  return (
    <main className="abyss-wash flex min-h-dvh flex-col items-center justify-center bg-abyss-900 px-6 py-16 text-center">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3">
          <LogoMark size={56} />
          <p className="max-w-[26ch] font-mono text-[11px] uppercase leading-[1.6] tracking-[0.12em] text-ice-500">
            INDIRA GANDHI MEDICAL COLLEGE &amp; RESEARCH INSTITUTE
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
            SIGMA 2026 PRESENTS
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="font-serif text-[34px] leading-none text-ice-100">
            STRIATUM <span className="text-signal-500">4.0</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ice-500">
            MEDICAL SYMPOSIUM · 2026
          </p>
        </div>

        <p className="max-w-[30ch] font-serif text-xl leading-[1.4] text-ice-300">
          &ldquo;A familiar journey,
          <br />
          <span className="text-signal-400">a deeper dive.</span>&rdquo;
        </p>

        <Button size="lg" className="w-full" trailingArrow onClick={handleEnter}>
          Enter STRIATUM
        </Button>
      </div>

      <MembraneTransition active={transitioning} onComplete={handleComplete} />
    </main>
  );
}
