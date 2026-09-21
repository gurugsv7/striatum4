"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { submitDelegatePayment } from "@/lib/actions/delegate";
import { Panel } from "@/components/ui/Panel";
import { Divider } from "@/components/ui/Divider";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PaymentQrPanel } from "@/components/payment/PaymentQrPanel";
import { PaymentInstructions } from "@/components/payment/PaymentInstructions";

export interface DelegatePaymentPanelProps {
  participantName: string;
  institution: string;
  amountLabel: string;
  amountKnown: boolean;
  qrImageUrl: string | null;
  payeeName: string | null;
  upiId: string | null;
  requireTransactionRef: boolean;
}

export function DelegatePaymentPanel({
  participantName,
  institution,
  amountLabel,
  amountKnown,
  qrImageUrl,
  payeeName,
  upiId,
  requireTransactionRef,
}: DelegatePaymentPanelProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    setFileError(null);
    setRefError(null);

    if (!file) {
      setFileError("Attach a payment screenshot.");
      return;
    }
    if (requireTransactionRef && !transactionRef.trim()) {
      setRefError("Transaction reference is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("screenshot", file);
      formData.set("transactionReference", transactionRef.trim());
      const result = await submitDelegatePayment(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.push("/delegate/status");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [file, transactionRef, requireTransactionRef, router]);

  return (
    <div className="flex flex-col gap-6">
      <Panel wash className="flex flex-col gap-3">
        <SummaryRow label="Participant" value={participantName} />
        <SummaryRow label="Institution" value={institution} />
        <SummaryRow label="Registration" value="Delegate registration" />
        <SummaryRow label="Amount" value={amountLabel} emphasize />
      </Panel>

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
          file={file}
          onChange={(f) => {
            setFile(f);
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
        htmlFor="dp-utr"
        hint={requireTransactionRef ? undefined : "Optional."}
        error={refError ?? undefined}
        required={requireTransactionRef}
      >
        <Input
          id="dp-utr"
          value={transactionRef}
          invalid={!!refError}
          onChange={(e) => setTransactionRef(e.target.value)}
        />
      </Field>

      {formError ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {formError}
        </p>
      ) : null}

      <Button
        className="w-full"
        trailingArrow
        loading={submitting}
        disabled={!amountKnown || !qrImageUrl}
        onClick={handleSubmit}
      >
        Submit for verification
      </Button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-ice-500">{label}</span>
      <span className={emphasize ? "text-[16px] font-semibold text-ice-100" : "text-[15px] text-ice-100"}>
        {value}
      </span>
    </div>
  );
}
