import { cn } from "@/lib/utils/cn";

export interface StatusChipProps {
  /** Any status string from the product's state machines (see docs/00-PRODUCT.md §5). */
  status: string;
  className?: string;
}

type Tone = "warning" | "signal" | "danger" | "neutral" | "success";

const TONE_CLASSES: Record<Tone, string> = {
  warning: "border-warning/40 bg-warning/10 text-warning",
  signal: "border-signal-500/40 bg-signal-500/10 text-signal-400",
  danger: "border-danger/40 bg-danger/10 text-danger",
  neutral: "border-line-200 bg-abyss-600 text-ice-500",
  success: "border-success/40 bg-success/10 text-success",
};

const HUMAN_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  NOT_SUBMITTED: "Not submitted",
  PAYMENT_PENDING: "Payment pending",
  PENDING_REVIEW: "Under review",
  PAYMENT_UNDER_REVIEW: "Under review",
  PENDING_APPROVAL: "Pending approval",
  PENDING: "Pending",
  PAYMENT_REJECTED: "Rejected",
  REJECTED: "Rejected",
  NEEDS_RESUBMISSION: "Needs resubmission",
  CANCELLED: "Cancelled",
  APPROVED: "Approved",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  PUBLISHED: "Published",
  NOT_CHECKED_IN: "Not checked in",
  CHECKED_IN: "Checked in",
};

function toneFor(normalized: string): Tone {
  if (normalized.includes("PENDING") || normalized === "PAYMENT_PENDING") {
    return "warning";
  }
  if (
    normalized === "APPROVED" ||
    normalized === "CONFIRMED" ||
    normalized === "ACTIVE" ||
    normalized === "PUBLISHED"
  ) {
    return "signal";
  }
  if (normalized.includes("REJECTED") || normalized === "CANCELLED") {
    return "danger";
  }
  if (normalized === "CHECKED_IN") {
    return "success";
  }
  return "neutral";
}

/** Maps every status enum in the product spec to a colour + human label. */
export function StatusChip({ status, className }: StatusChipProps) {
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const tone = toneFor(normalized);
  const label =
    HUMAN_LABEL[normalized] ??
    normalized
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-[13px] font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
