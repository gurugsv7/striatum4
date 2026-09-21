import Link from 'next/link';
import { requireFinanceAdmin } from '@/lib/auth/guards';
import { getActivePaymentSettings, getAppSettings } from '@/lib/queries/settings';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { PaymentSettingsForm } from '@/components/admin/PaymentSettingsForm';
import { LaunchTogglePanel } from '@/components/admin/LaunchTogglePanel';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentSettingsPage() {
  await requireFinanceAdmin();
  const [settings, appSettings] = await Promise.all([getActivePaymentSettings(), getAppSettings()]);

  let currentQrUrl: string | null = null;
  if (settings?.qr_storage_path) {
    const supabase = await createSupabaseServerComponentClient();
    const { data } = supabase.storage.from('brand-assets').getPublicUrl(settings.qr_storage_path);
    currentQrUrl = data.publicUrl;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Settings — Payments</h1>
        <p className="mt-1 text-[14px] text-ice-500">
          The delegate registration fee, official QR, and payment instructions participants see.{' '}
          <Link href="/admin/events" className="text-signal-500 hover:text-signal-400">
            Per-event overrides live on each event →
          </Link>
        </p>
      </div>

      <LaunchTogglePanel settings={appSettings} />

      <PaymentSettingsForm settings={settings} currentQrUrl={currentQrUrl} />
    </div>
  );
}
