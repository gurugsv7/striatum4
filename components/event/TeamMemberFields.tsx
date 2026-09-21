"use client";

import { Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";

export interface TeamMemberValue {
  fullName: string;
  email: string;
  mobile: string;
  college: string;
  year: string;
  isLead: boolean;
}

export interface TeamMemberFieldsProps {
  members: TeamMemberValue[];
  onChange: (members: TeamMemberValue[]) => void;
  minTeamSize: number | null;
  maxTeamSize: number | null;
}

export const EMPTY_MEMBER: TeamMemberValue = {
  fullName: "",
  email: "",
  mobile: "",
  college: "",
  year: "",
  isLead: false,
};

/** Team member repeater. The lead (index 0) is fixed to the signed-in delegate and cannot be removed. */
export function TeamMemberFields({ members, onChange, minTeamSize, maxTeamSize }: TeamMemberFieldsProps) {
  const canAdd = maxTeamSize == null || members.length < maxTeamSize;
  const canRemove = (index: number) => index !== 0 && (minTeamSize == null || members.length > minTeamSize);

  const update = (index: number, patch: Partial<TeamMemberValue>) => {
    const next = members.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-5">
      {members.map((member, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-md border border-line-100 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-signal-500">
              {index === 0 ? "Team lead (you)" : `Member ${index + 1}`}
            </span>
            {canRemove(index) ? (
              <IconButton
                icon={<Trash2 className="size-4" />}
                label="Remove member"
                onClick={() => onChange(members.filter((_, i) => i !== index))}
              />
            ) : null}
          </div>
          <Field label="Full name" required>
            <Input
              value={member.fullName}
              onChange={(e) => update(index, { fullName: e.target.value })}
              disabled={index === 0}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input
                type="email"
                value={member.email}
                onChange={(e) => update(index, { email: e.target.value })}
                disabled={index === 0}
              />
            </Field>
            <Field label="Mobile">
              <Input value={member.mobile} onChange={(e) => update(index, { mobile: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="College">
              <Input value={member.college} onChange={(e) => update(index, { college: e.target.value })} />
            </Field>
            <Field label="Year of study">
              <Input value={member.year} onChange={(e) => update(index, { year: e.target.value })} />
            </Field>
          </div>
        </div>
      ))}

      {canAdd ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange([...members, { ...EMPTY_MEMBER }])}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add member
        </Button>
      ) : null}

      <p className="text-[13px] text-ice-500">
        {minTeamSize != null || maxTeamSize != null
          ? `Team size: ${minTeamSize ?? "—"}–${maxTeamSize ?? "—"} members`
          : "No team size limit announced."}
      </p>
    </div>
  );
}
