/**
 * STRIATUM 4.0 — shared manual-payment instructions.
 *
 * Both the delegate payment flow (components/delegate/DelegatePaymentPanel)
 * and the paid-event payment flow (components/event/PaymentUploadForm) walk
 * the participant through the same five steps. Kept in one place so the two
 * screens cannot drift in copy.
 */
export const PAYMENT_INSTRUCTIONS = [
  "Scan the QR using your preferred UPI/payment app.",
  "Complete the exact payment.",
  "Take a screenshot of the successful transaction.",
  "Upload the screenshot below.",
  "STRIATUM organizers will verify your payment.",
] as const;

export function PaymentInstructions() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-ice-500">How to pay</p>
      <ol className="flex flex-col gap-2.5">
        {PAYMENT_INSTRUCTIONS.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-[15px] leading-[1.55] text-ice-300">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line-200 font-mono text-[12px] text-ice-500">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
