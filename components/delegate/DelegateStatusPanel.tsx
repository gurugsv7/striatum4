"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { replaceDelegateScreenshot } from "@/lib/actions/delegate";
import { getSignedScreenshotUrl } from "@/lib/actions/storage";
import type { DelegateApplicationStatus } from "@/lib/types/enums";
import type { PaymentSubmissionRow } from "@/lib/types/database";
import { Signal } from "@/components/signal/Signal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Lightbox } from "@/components/ui/Lightbox";
import { Spinner } from "@/components/ui/Spinner";

export interface DelegateStatusPanelProps {
  applicationStatus: DelegateApplicationStatus;
  rejectionReason: string | null;
  adminNote: string | null;
  submission: PaymentSubmissionRow | null;
}

export function DelegateStatusPanel({
  applicationStatus,
  rejectionReason,
  adminNote,
  submission,
}: DelegateStatusPanelProps) {
  const router = useRouter();
  const rejected = applicationStatus === "PAYMENT_REJECTED";

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const [lightboxError, setLightboxError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

  const canReplace =
    !!submission && (submission.status === "PENDING_REVIEW" || submission.status === "NEEDS_RESUBMISSION");

  const handleViewSubmission = useCallback(async () => {
    if (!submission) return;
    setLightboxError(null);
    setLightboxLoading(true);
    setLightboxOpen(true);
    const result = await getSignedScreenshotUrl(submission.id);
    setLightboxLoading(false);
    if (!result.ok) {
      setLightboxError(result.error);
      return;
    }
    setLightboxUrl(result.data);
  }, [submission]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 800);
  }, [router]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Signal orientation="vertical" variant={rejected ? "dormant" : "pulse"} length={48} />
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-[28px] leading-tight text-ice-100">
            {rejected ? "Payment needs attention" : "Payment submitted"}
          </h1>
          <p className="text-[15px] text-ice-500">
            {rejected ? "Resubmission required." : "Verification pending."}
          </p>
        </div>
        <StatusChip status={rejected ? "PAYMENT_REJECTED" : "PENDING_REVIEW"} />
      </div>

      {rejected ? (
        <Panel className="flex flex-col gap-2 border-danger/30 bg-danger/5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-danger">
            Reason
          </p>
          <p className="text-[15px] leading-[1.55] text-ice-100">
            {rejectionReason ?? "Your Delegate payment could not be verified."}
          </p>
          {adminNote ? (
            <p className="text-[13px] leading-[1.55] text-ice-500">{adminNote}</p>
          ) : null}
        </Panel>
      ) : (
        <p className="max-w-[42ch] self-center text-center text-[15px] leading-[1.55] text-ice-500">
          Your payment proof has been received. The STRIATUM team will review it before
          activating your Delegate ID. You can leave this page — we&apos;ll let you know.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={!submission}
            onClick={handleViewSubmission}
          >
            View submission
          </Button>
          {canReplace ? (
            <Button
              variant={rejected ? "primary" : "secondary"}
              trailingArrow={rejected}
              onClick={() => setReplaceMode((v) => !v)}
            >
              {rejected ? "Resubmit payment proof" : "Replace screenshot"}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {replaceMode ? (
          <ReplaceScreenshotForm onDone={() => setReplaceMode(false)} />
        ) : null}
      </div>

      <Lightbox
        open={lightboxOpen && !!lightboxUrl}
        onClose={() => {
          setLightboxOpen(false);
          setLightboxUrl(null);
        }}
        src={lightboxUrl ?? ""}
        alt="Your payment screenshot"
      />
      {lightboxOpen && lightboxLoading ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-abyss-900/60">
          <Spinner label="Loading screenshot" />
        </div>
      ) : null}
      {lightboxOpen && lightboxError ? (
        <div className="fixed inset-x-6 bottom-6 z-[75] rounded-md border border-danger/40 bg-abyss-800 p-4 text-center">
          <p className="text-[13px] font-medium text-danger">{lightboxError}</p>
        </div>
      ) : null}
    </div>
  );
}

function ReplaceScreenshotForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    if (!file) {
      setFileError("Attach a payment screenshot.");
      return;
    }
    setFileError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("screenshot", file);
      formData.set("transactionReference", transactionRef.trim());
      const result = await replaceDelegateScreenshot(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.refresh();
      onDone();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [file, transactionRef, router, onDone]);

  return (
    <Panel className="flex flex-col gap-4">
      <p className="text-[15px] font-semibold text-ice-100">New payment screenshot</p>
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
      <Field label="UTR / Transaction reference" htmlFor="rp-utr" hint="Optional.">
        <Input id="rp-utr" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
      </Field>
      {formError ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {formError}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button loading={submitting} onClick={handleSubmit}>
          Submit
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
