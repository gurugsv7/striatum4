"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { LogOut, IdCard, FileText, UserCircle } from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import type { DelegateState } from "@/lib/auth/guards";
import type { DelegateApplicationRow } from "@/lib/types/database";
import { Panel } from "@/components/ui/Panel";
import { StatusChip } from "@/components/ui/StatusChip";
import { Divider } from "@/components/ui/Divider";
import { formatDateTime } from "@/lib/format/date";
import { DELEGATE_APPLICATION_STATUS_LABELS } from "@/lib/types/enums";
import { cn } from "@/lib/utils/cn";

export interface ProfilePanelProps {
  email: string;
  fullName: string | null;
  delegateState: DelegateState;
  application: DelegateApplicationRow | null;
  memberSince: string;
}

export function ProfilePanel({
  email,
  fullName,
  delegateState,
  application,
  memberSince,
}: ProfilePanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    // signOut() redirects server-side on success; the resulting
    // NEXT_REDIRECT is expected to propagate, not be caught here.
    await signOut();
  }, []);

  const statusLabel =
    delegateState.status === "ACTIVE"
      ? DELEGATE_APPLICATION_STATUS_LABELS.APPROVED
      : delegateState.status === "NONE" || delegateState.status === "DRAFT"
        ? "Not registered"
        : DELEGATE_APPLICATION_STATUS_LABELS[delegateState.status];

  return (
    <div className="flex flex-col gap-6">
      <Panel wash className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line-200 text-ice-300">
            <UserCircle className="size-6" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-[17px] font-semibold text-ice-100">
              {fullName?.trim() || "STRIATUM participant"}
            </p>
            <p className="truncate text-[13px] text-ice-500">{email}</p>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-3">
          <Row label="Institution" value={application?.college ?? "—"} />
          <Row label="Year of study" value={application?.year_of_study ?? "—"} />
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-ice-500">Delegate status</span>
            <StatusChip
              status={
                delegateState.status === "ACTIVE"
                  ? "APPROVED"
                  : delegateState.status === "NONE" || delegateState.status === "DRAFT"
                    ? "NOT_SUBMITTED"
                    : delegateState.status
              }
            />
          </div>
          {delegateState.status === "ACTIVE" ? (
            <Row label="Delegate ID" value={delegateState.delegate.delegate_id} mono />
          ) : null}
        </div>
      </Panel>

      <div className="flex flex-col gap-3">
        {delegateState.status === "ACTIVE" ? (
          <Link href="/delegate/pass">
            <ActionRow icon={<IdCard className="size-4" />} label="View Delegate Pass" />
          </Link>
        ) : null}

        {application ? (
          <button type="button" className="w-full text-left" onClick={() => setDetailsOpen((v) => !v)}>
            <ActionRow icon={<FileText className="size-4" />} label="Registration details" />
          </button>
        ) : null}

        {detailsOpen && application ? (
          <Panel className="flex flex-col gap-2">
            <Row label="Full name" value={application.full_name} />
            <Row label="Mobile" value={application.mobile} />
            <Row label="Student ID" value={application.student_id ?? "—"} />
            <Row label="Submitted" value={formatDateTime(application.submitted_at)} />
            <Row label="Status" value={statusLabel} />
          </Panel>
        ) : null}

        <button type="button" className="w-full text-left" onClick={handleSignOut} disabled={signingOut}>
          <ActionRow icon={<LogOut className="size-4" />} label={signingOut ? "Signing out…" : "Sign out"} destructive />
        </button>
      </div>

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ice-700">
        Member since {formatDateTime(memberSince)}
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[13px] text-ice-500">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right",
          mono ? "break-all font-mono text-[15px] text-signal-400" : "text-[15px] text-ice-100"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
}) {
  return (
    <Panel className="flex items-center gap-3 py-3.5 hover:border-signal-500">
      <span className={destructive ? "text-danger" : "text-ice-300"}>{icon}</span>
      <span className={destructive ? "text-[15px] font-medium text-danger" : "text-[15px] font-medium text-ice-100"}>
        {label}
      </span>
    </Panel>
  );
}
