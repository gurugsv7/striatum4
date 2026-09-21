"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { CopyField } from "@/components/ui/CopyField";
import { TeamMemberFields, EMPTY_MEMBER, type TeamMemberValue } from "./TeamMemberFields";
import { registerForEvent } from "@/lib/actions/events";
import type { EventFormFieldRow, EventRow, Json } from "@/lib/types/database";

export interface EventRegisterFormProps {
  event: EventRow;
  delegateId: string;
  participantName: string;
  participantEmail: string;
  formFields: EventFormFieldRow[];
}

function optionList(options: Json | null): { value: string; label: string }[] {
  if (!Array.isArray(options)) return [];
  return options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : (opt as { value: string; label: string }),
  );
}

export function EventRegisterForm({
  event,
  delegateId,
  participantName,
  participantEmail,
  formFields,
}: EventRegisterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMemberValue[]>([
    { ...EMPTY_MEMBER, fullName: participantName, email: participantEmail, isLead: true },
  ]);

  const isTeam = event.format === "TEAM";

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        eventId: event.id,
        extra,
      };
      if (isTeam) {
        payload.teamName = teamName;
        payload.members = members.map((m) => ({
          fullName: m.fullName,
          email: m.email || undefined,
          mobile: m.mobile || undefined,
          college: m.college || undefined,
          year: m.year || undefined,
          isLead: m.isLead,
        }));
      }

      const result = await registerForEvent(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.data.nextRoute);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
          Your delegate identity
        </span>
        <CopyField label="Delegate ID" value={delegateId} />
        <p className="text-[13px] text-ice-500">
          Attached automatically — this is who you&apos;ll be registered as for {event.name}.
        </p>
      </Panel>

      {isTeam ? (
        <div className="flex flex-col gap-4">
          <Field label="Team name" hint="Optional — leave blank to use your own name.">
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </Field>
          <TeamMemberFields
            members={members}
            onChange={setMembers}
            minTeamSize={event.min_team_size}
            maxTeamSize={event.max_team_size}
          />
        </div>
      ) : null}

      {formFields.length > 0 ? (
        <div className="flex flex-col gap-4">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ice-500">
            Event details
          </span>
          {formFields.map((field) => (
            <Field key={field.id} label={field.label} required={field.required} hint={field.help_text ?? undefined}>
              {field.field_type === "TEXTAREA" ? (
                <Textarea
                  required={field.required}
                  value={extra[field.key] ?? ""}
                  onChange={(e) => setExtra((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : field.field_type === "SELECT" ? (
                <Select
                  required={field.required}
                  options={optionList(field.options)}
                  placeholder="Select…"
                  value={extra[field.key] ?? ""}
                  onChange={(e) => setExtra((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : (
                <Input
                  required={field.required}
                  type={
                    field.field_type === "EMAIL"
                      ? "email"
                      : field.field_type === "TEL"
                        ? "tel"
                        : field.field_type === "NUMBER"
                          ? "number"
                          : field.field_type === "DATE"
                            ? "date"
                            : "text"
                  }
                  value={extra[field.key] ?? ""}
                  onChange={(e) => setExtra((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </Field>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}

      <Button size="lg" trailingArrow loading={isPending} onClick={handleSubmit}>
        {event.is_paid ? "PROCEED TO PAYMENT" : "CONFIRM REGISTRATION"}
      </Button>
    </div>
  );
}
