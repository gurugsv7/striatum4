import { redirect } from "next/navigation";

import { getAppSettings } from "@/lib/queries/settings";
import { getOptionalUser } from "@/lib/auth/guards";
import { LogoMark } from "@/components/brand/LogoMark";
import { Signal } from "@/components/signal/Signal";
import { ComingSoonCountdown } from "@/components/home/ComingSoonCountdown";

export default async function ComingSoonPage() {
  const settings = await getAppSettings();

  if (settings?.launched) {
    const user = await getOptionalUser();
    redirect(user ? "/home" : "/welcome");
  }

  return (
    <main className="abyss-wash flex min-h-dvh flex-col items-center justify-center bg-abyss-900 px-6 py-16 text-center">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <LogoMark size={56} />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice-500">
            IGMCRI
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
            SIGMA 2026 PRESENTS
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1 className="font-serif text-[34px] leading-none text-ice-100">
            STRIATUM <span className="text-signal-500">4.0</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ice-500">
            MEDICAL SYMPOSIUM 2026
          </p>
        </div>

        <p className="max-w-[30ch] font-serif text-xl leading-[1.4] text-ice-300">
          &ldquo;A familiar journey,
          <br />
          <span className="text-signal-400">a deeper dive.</span>&rdquo;
        </p>

        <Signal orientation="vertical" variant="dormant" length={56} />

        <div className="flex flex-col items-center gap-2">
          <p className="font-serif text-2xl text-ice-100">Coming Soon</p>
          <p className="text-[15px] text-ice-500">Registrations opening soon.</p>
        </div>

        {settings?.launch_date ? (
          <ComingSoonCountdown launchDate={settings.launch_date} />
        ) : null}
      </div>
    </main>
  );
}
