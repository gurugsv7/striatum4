"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Divider } from "@/components/ui/Divider";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PaymentQrPanel } from "@/components/payment/PaymentQrPanel";
import { PaymentInstructions } from "@/components/payment/PaymentInstructions";
import { submitEventPayment } from "@/lib/actions/events";

export interface PaymentUploadFormProps {
  registrationId: string;
  amountLabel: string;
  amountKnown: boolean;
  qrImageUrl: string | null;
  payeeName: string | null;
  upiId: string | null;
  requireTransactionRef: boolean;
}

/**
 * Paid-event counterpart to components/delegate/DelegatePaymentPanel — same
 * manual-payment contract (shared QR panel + instructions from
 * components/payment/), wired to submitEventPayment instead of
 * submitDelegatePayment.
 */
export function PaymentUploadForm({
  registrationId,
  amountLabel,
  amountKnown,
  qrImageUrl,
  payeeName,
  upiId,
  requireTransactionRef,
}: PaymentUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [transactionReference, setTransactionReference] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = () => {
    setFormError(null);
    setFileError(null);
    setRefError(null);

    if (!screenshot) {
      setFileError("Attach a payment screenshot.");
      return;
    }
    if (requireTransactionRef && !transactionReference.trim()) {
      setRefError("Transaction reference is required.");
      return;
    }
    const formData = new FormData();
    formData.set("registrationId", registrationId);
    formData.set("screenshot", screenshot);
    formData.set("transactionReference", transactionReference.trim());

    startTransition(async () => {
      const result = await submitEventPayment(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PaymentQrPanel
        amountLabel={amountLabel}
        amountKnown={amountKnown}
        qrImageUrl={qrImageUrl}
        payeeName={payeeName}
        upiId={upiId}
      />

      <PaymentInstructions />

      <Divider />

      <div className="flex flex-col gap-3">
        <p className="text-[15px] font-semibold text-ice-100">Upload payment screenshot</p>
        <FileDropzone
          file={screenshot}
          onChange={(f) => {
            setScreenshot(f);
            setFileError(null);
          }}
          onError={setFileError}
        />
        {fileError ? (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {fileError}
          </p>
        ) : null}
      </div>

      <Field
        label="UTR / Transaction reference"
        htmlFor="ep-utr"
        hint={requireTransactionRef ? undefined : "Optional."}
        error={refError ?? undefined}
        required={requireTransactionRef}
      >
        <Input
          id="ep-utr"
          value={transactionReference}
          invalid={!!refError}
          onChange={(e) => setTransactionReference(e.target.value)}
        />
      </Field>

      {formError ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {formError}
        </p>
      ) : null}

      <Button
        className="w-full"
        size="lg"
        trailingArrow
        loading={isPending}
        disabled={!amountKnown || !qrImageUrl}
        onClick={handleSubmit}
      >
        Submit for verification
      </Button>
    </div>
  );
}
