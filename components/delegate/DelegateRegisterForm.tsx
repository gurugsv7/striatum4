"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Building2, GraduationCap, Hash } from "lucide-react";

import { saveDelegateApplication } from "@/lib/actions/delegate";
import { buildDelegateApplicationSchema } from "@/lib/validation/delegate";
import type { DelegateFormFieldRow } from "@/lib/types/database";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

export interface DelegateRegisterDefaults {
  fullName: string;
  email: string;
  mobile: string;
  college: string;
  yearOfStudy: string;
  studentId: string;
  extra: Record<string, unknown>;
}

export interface DelegateRegisterFormProps {
  extraFields: DelegateFormFieldRow[];
  defaultValues: DelegateRegisterDefaults;
}

type FieldErrors = Record<string, string>;

const YEAR_OPTIONS = [
  { value: "1st year", label: "1st year" },
  { value: "2nd year", label: "2nd year" },
  { value: "3rd year", label: "3rd year" },
  { value: "4th year", label: "4th year" },
  { value: "Final year", label: "Final year" },
  { value: "Intern", label: "Intern" },
  { value: "Postgraduate", label: "Postgraduate" },
  { value: "Faculty", label: "Faculty" },
];

export function DelegateRegisterForm({ extraFields, defaultValues }: DelegateRegisterFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultValues.fullName);
  const [mobile, setMobile] = useState(defaultValues.mobile);
  const [college, setCollege] = useState(defaultValues.college);
  const [yearOfStudy, setYearOfStudy] = useState(defaultValues.yearOfStudy);
  const [studentId, setStudentId] = useState(defaultValues.studentId);
  const [extra, setExtra] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of extraFields) {
      const v = defaultValues.extra[f.key];
      initial[f.key] = typeof v === "string" ? v : v != null ? String(v) : "";
    }
    return initial;
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    const schema = buildDelegateApplicationSchema(extraFields);
    const parsed = schema.safeParse({
      fullName,
      email: defaultValues.email,
      mobile,
      college,
      yearOfStudy,
      studentId,
      extra,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in nextErrors)) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await saveDelegateApplication(parsed.data);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.push("/delegate/payment");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [extraFields, fullName, defaultValues.email, mobile, college, yearOfStudy, studentId, extra, router]);

  return (
    <Panel wash className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
        01 — YOUR DETAILS
      </p>

      <Field label="Full name" htmlFor="dr-full-name" error={errors.fullName} required>
        <Input
          id="dr-full-name"
          leadingIcon={<User className="size-4" />}
          value={fullName}
          invalid={!!errors.fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </Field>

      <Field label="Email" htmlFor="dr-email" hint="From your STRIATUM account.">
        <Input
          id="dr-email"
          type="email"
          readOnly
          disabled
          leadingIcon={<Mail className="size-4" />}
          value={defaultValues.email}
        />
      </Field>

      <Field label="Mobile number" htmlFor="dr-mobile" error={errors.mobile} required>
        <Input
          id="dr-mobile"
          type="tel"
          leadingIcon={<Phone className="size-4" />}
          value={mobile}
          invalid={!!errors.mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </Field>

      <Field label="College / institution" htmlFor="dr-college" error={errors.college} required>
        <Input
          id="dr-college"
          leadingIcon={<Building2 className="size-4" />}
          value={college}
          invalid={!!errors.college}
          onChange={(e) => setCollege(e.target.value)}
        />
      </Field>

      <Field label="Year of study" htmlFor="dr-year" error={errors.yearOfStudy} required>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 z-10 flex size-4 items-center justify-center text-ice-500">
            <GraduationCap className="size-4" />
          </span>
          <Select
            id="dr-year"
            className="pl-10"
            placeholder="Select year"
            options={YEAR_OPTIONS}
            value={yearOfStudy}
            invalid={!!errors.yearOfStudy}
            onChange={(e) => setYearOfStudy(e.target.value)}
          />
        </div>
      </Field>

      <Field label="Student ID" htmlFor="dr-student-id" hint="Optional, unless required by the organizers.">
        <Input
          id="dr-student-id"
          leadingIcon={<Hash className="size-4" />}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      </Field>

      {extraFields.map((f) => (
        <Field
          key={f.id}
          label={f.label}
          htmlFor={`dr-extra-${f.key}`}
          hint={f.help_text ?? undefined}
          error={errors[f.key]}
          required={f.required}
        >
          <ExtraFieldControl
            field={f}
            value={extra[f.key] ?? ""}
            invalid={!!errors[f.key]}
            onChange={(v) => setExtra((prev) => ({ ...prev, [f.key]: v }))}
          />
        </Field>
      ))}

      {formError ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {formError}
        </p>
      ) : null}

      <Button className="w-full" trailingArrow loading={submitting} onClick={handleSubmit}>
        Proceed to payment
      </Button>
    </Panel>
  );
}

function ExtraFieldControl({
  field,
  value,
  invalid,
  onChange,
}: {
  field: DelegateFormFieldRow;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const id = `dr-extra-${field.key}`;

  if (field.field_type === "TEXTAREA") {
    return (
      <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  }

  if (field.field_type === "SELECT") {
    const options = Array.isArray(field.options)
      ? (field.options as unknown[]).filter((o): o is string => typeof o === "string")
      : [];
    return (
      <Select
        id={id}
        placeholder={`Select ${field.label.toLowerCase()}`}
        options={options.map((o) => ({ value: o, label: o }))}
        value={value}
        invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  const inputType =
    field.field_type === "EMAIL"
      ? "email"
      : field.field_type === "TEL"
        ? "tel"
        : field.field_type === "NUMBER"
          ? "number"
          : field.field_type === "DATE"
            ? "date"
            : "text";

  return (
    <Input id={id} type={inputType} value={value} invalid={invalid} onChange={(e) => onChange(e.target.value)} />
  );
}
