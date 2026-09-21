import { Panel } from "@/components/ui/Panel";
import { CopyField } from "@/components/ui/CopyField";
import { EmptyState } from "@/components/ui/EmptyState";

export interface PaymentQrPanelProps {
  /** Formatted fee, e.g. "₹1,500" — see lib/format/currency.ts feeLabel(). */
  amountLabel: string;
  /** False when the fee has not been announced yet (amount is null upstream). */
  amountKnown: boolean;
  qrImageUrl: string | null;
  payeeName: string | null;
  upiId: string | null;
}

/**
 * Shared QR + payee/UPI/amount block for the manual-payment contract, used
 * by both the delegate payment screen and the paid-event payment screen.
 * Renders one of two designed empty states — "fee not announced" or
 * "payment details not published yet" — instead of a blank/broken QR when
 * the organizers haven't configured payment settings.
 */
export function PaymentQrPanel({ amountLabel, amountKnown, qrImageUrl, payeeName, upiId }: PaymentQrPanelProps) {
  if (!amountKnown) {
    return (
      <EmptyState
        title="Fee not announced yet"
        description="The organizers haven't published this fee yet. Check back shortly."
      />
    );
  }

  if (!qrImageUrl) {
    return (
      <EmptyState
        title="Payment details not published yet"
        description="The official payment QR hasn't been configured by the organizers yet. Check back shortly."
      />
    );
  }

  return (
    <Panel className="flex flex-col items-center gap-4">
      <div
        className="flex items-center justify-center rounded-md bg-ice-100 p-4"
        style={{ minWidth: 240, minHeight: 240 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImageUrl}
          alt="Official STRIATUM 4.0 payment QR"
          width={240}
          height={240}
          className="h-[240px] w-[240px] object-contain"
        />
      </div>
      <div className="flex w-full flex-col gap-3">
        {payeeName ? <CopyField label="Payee name" value={payeeName} /> : null}
        {upiId ? <CopyField label="UPI ID" value={upiId} /> : null}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ice-300">Amount</span>
          <p className="text-[18px] font-semibold text-ice-100">{amountLabel}</p>
        </div>
      </div>
    </Panel>
  );
}
