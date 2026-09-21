"use client";

import { useState } from "react";
import { Mail, Search, Filter } from "lucide-react";
import { PageContainer } from "@/components/shell/PageContainer";
import { AppHeader } from "@/components/shell/AppHeader";
import { FocusedFlowHeader } from "@/components/shell/FocusedFlowHeader";
import { BottomNav } from "@/components/shell/BottomNav";
import { Wordmark } from "@/components/brand/Wordmark";
import { LogoMark } from "@/components/brand/LogoMark";
import { Signal, type SignalVariant } from "@/components/signal/Signal";
import { SignalRule } from "@/components/signal/SignalRule";
import { MembraneTransition } from "@/components/signal/MembraneTransition";
import { DelegateImprint, type DelegateImprintState } from "@/components/delegate/DelegateImprint";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio } from "@/components/ui/Radio";
import { Field } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Sheet } from "@/components/ui/Sheet";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { StatusChip } from "@/components/ui/StatusChip";
import { Tabs } from "@/components/ui/Tabs";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Divider } from "@/components/ui/Divider";
import { Stepper } from "@/components/ui/Stepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Lightbox } from "@/components/ui/Lightbox";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { QrPanel } from "@/components/ui/QrPanel";
import { CopyField } from "@/components/ui/CopyField";
import { Spinner } from "@/components/ui/Spinner";

const SIGNAL_VARIANTS: SignalVariant[] = ["dormant", "travelling", "arrived", "pulse"];
const IMPRINT_STATES: DelegateImprintState[] = ["unassigned", "pending", "rejected", "active"];

const STATUSES = [
  "DRAFT",
  "PAYMENT_PENDING",
  "PAYMENT_UNDER_REVIEW",
  "PAYMENT_REJECTED",
  "APPROVED",
  "PENDING_APPROVAL",
  "CONFIRMED",
  "CANCELLED",
  "NOT_SUBMITTED",
  "PENDING_REVIEW",
  "NEEDS_RESUBMISSION",
  "NOT_CHECKED_IN",
  "CHECKED_IN",
  "PUBLISHED",
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-8 hairline-t first:border-t-0 first:pt-0">
      <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-ice-500">{title}</h3>
      {children}
    </div>
  );
}

function ColorSwatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="size-10 shrink-0 rounded-md border border-line-100"
        style={{ background: `var(${varName})` }}
      />
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-[13px] text-ice-100">{name}</span>
        <span className="font-mono text-[11px] text-ice-500">{varName}</span>
      </div>
    </div>
  );
}

function ToastDemo() {
  const { push } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => push({ title: "Payment proof submitted", tone: "info" })}
      >
        Trigger info toast
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => push({ title: "Delegate ID issued", tone: "success" })}
      >
        Trigger success toast
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => push({ title: "Payment rejected", tone: "error" })}
      >
        Trigger error toast
      </Button>
    </div>
  );
}

export default function StyleguideClient() {
  const [tab, setTab] = useState("events");
  const [segment, setSegment] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [membraneActive, setMembraneActive] = useState(false);
  const [dropzoneFile, setDropzoneFile] = useState<File | null>(null);

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-abyss-900 pb-24">
        <AppHeader unread />

        <PageContainer wide className="flex flex-col gap-10 py-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">
              Development only
            </p>
            <h1 className="mt-2 font-serif text-[32px] text-ice-100">Styleguide</h1>
            <p className="mt-1 max-w-[60ch] text-[15px] leading-[1.55] text-ice-500">
              Every token, type role, and component in the STRIATUM 4.0 design system, for visual
              review against docs/01-DESIGN-SYSTEM.md.
            </p>
          </div>

          {/* ---------------------------------------------------------- */}
          <section>
            <SectionHeader index="01" eyebrow="TOKENS" heading="Colour" />
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              <ColorSwatch name="abyss-900" varName="--abyss-900" />
              <ColorSwatch name="abyss-800" varName="--abyss-800" />
              <ColorSwatch name="abyss-700" varName="--abyss-700" />
              <ColorSwatch name="abyss-600" varName="--abyss-600" />
              <ColorSwatch name="line-100" varName="--line-100" />
              <ColorSwatch name="line-200" varName="--line-200" />
              <ColorSwatch name="ice-100" varName="--ice-100" />
              <ColorSwatch name="ice-300" varName="--ice-300" />
              <ColorSwatch name="ice-500" varName="--ice-500" />
              <ColorSwatch name="ice-700" varName="--ice-700" />
              <ColorSwatch name="signal-400" varName="--signal-400" />
              <ColorSwatch name="signal-500" varName="--signal-500" />
              <ColorSwatch name="signal-600" varName="--signal-600" />
              <ColorSwatch name="electric" varName="--electric" />
              <ColorSwatch name="success" varName="--success" />
              <ColorSwatch name="warning" varName="--warning" />
              <ColorSwatch name="danger" varName="--danger" />
            </div>
          </section>

          <section>
            <SectionHeader index="02" eyebrow="TOKENS" heading="Typography" />
            <div className="mt-4 flex flex-col gap-5">
              <div>
                <p className="font-serif text-[34px] text-ice-100">Page heading — 28–34px serif</p>
                <span className="font-mono text-xs text-ice-500">Instrument Serif</span>
              </div>
              <div>
                <p className="font-serif text-2xl text-ice-100">Section heading — 20–24px</p>
                <span className="font-mono text-xs text-ice-500">serif or sans</span>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ice-100">Person / event name — 20–28px, 600</p>
                <span className="font-mono text-xs text-ice-500">Inter</span>
              </div>
              <div>
                <p className="text-[17px] leading-[1.55] text-ice-100">
                  Body — 15–17px, 400, line-height 1.55. The quick brown fox jumps over the lazy dog
                  near the abyssal ground.
                </p>
              </div>
              <div>
                <p className="text-[18px] text-ice-100">Important value — 16–18px, e.g. S4-26-0184</p>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-ice-100">Button label — 15–16px, 600</p>
              </div>
              <div>
                <p className="text-[13px] text-ice-500">Functional metadata — 12–14px</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ice-500">
                  Decorative microtype — 10–11px, no necessary information
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-ice-100">S4-26-0184 — JetBrains Mono, IDs only</p>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          <section>
            <SectionHeader index="03" eyebrow="MOTIF" heading="The Signal" />
            <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {SIGNAL_VARIANTS.map((v) => (
                <div key={v} className="flex flex-col items-center gap-2 rounded-md border border-line-100 p-4">
                  <Signal variant={v} length={72} />
                  <span className="font-mono text-xs text-ice-500">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-4">
              <SignalRule label="Signal rule, dormant" />
              <SignalRule label="Signal rule, arrived" variant="arrived" />
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-ice-500">Vertical:</span>
                <Signal orientation="vertical" variant="travelling" length={72} />
              </div>
              <Button onClick={() => setMembraneActive(true)}>Trigger membrane transition</Button>
              <MembraneTransition active={membraneActive} onComplete={() => setMembraneActive(false)} />
            </div>
          </section>

          <section>
            <SectionHeader index="04" eyebrow="IDENTITY" heading="The Delegate Imprint" />
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              {IMPRINT_STATES.map((s) => (
                <div key={s} className="flex flex-col items-center gap-2 rounded-md border border-line-100 p-4">
                  <DelegateImprint state={s} delegateId="S4-26-0184" size="sm" />
                  <span className="font-mono text-xs text-ice-500">{s}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          <section>
            <SectionHeader index="05" eyebrow="PRIMITIVES" heading="Buttons" />
            <div className="mt-4 flex flex-col gap-4">
              <Block title="Variants">
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </Block>
              <Block title="Sizes">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </Block>
              <Block title="States">
                <div className="flex flex-wrap items-center gap-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button trailingArrow>Continue with email</Button>
                </div>
              </Block>
              <Block title="Icon button">
                <div className="flex gap-3">
                  <IconButton icon={<Search className="size-4" />} label="Search" />
                  <IconButton icon={<Filter className="size-4" />} label="Filter" variant="outline" />
                  <IconButton icon={<Filter className="size-4" />} label="Filter (active)" active />
                </div>
              </Block>
            </div>
          </section>

          <section>
            <SectionHeader index="06" eyebrow="PRIMITIVES" heading="Form controls" />
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Email" htmlFor="sg-email" hint="We'll send a magic link.">
                <Input id="sg-email" placeholder="you@college.edu" leadingIcon={<Mail className="size-4" />} />
              </Field>
              <Field label="Institution" htmlFor="sg-college" error="This field is required.">
                <Input id="sg-college" placeholder="College / Institution" invalid />
              </Field>
              <Field label="Year of study" htmlFor="sg-year">
                <Select
                  id="sg-year"
                  placeholder="Select year"
                  options={[
                    { value: "1", label: "1st year" },
                    { value: "2", label: "2nd year" },
                    { value: "3", label: "3rd year" },
                  ]}
                />
              </Field>
              <Field label="Notes" htmlFor="sg-notes" hint="Optional.">
                <Textarea id="sg-notes" placeholder="Anything else the organizers should know" />
              </Field>
              <div className="flex flex-col gap-2">
                <Checkbox id="sg-terms" label="I agree to the terms and privacy policy" />
                <Checkbox id="sg-terms-2" label="Disabled option" disabled />
              </div>
              <div className="flex flex-col gap-2">
                <Radio id="sg-r1" name="sg-radio" label="Individual" defaultChecked />
                <Radio id="sg-r2" name="sg-radio" label="Team" />
              </div>
            </div>
          </section>

          <section>
            <SectionHeader index="07" eyebrow="PRIMITIVES" heading="Surfaces & overlays" />
            <div className="mt-4 flex flex-col gap-6">
              <Block title="Panel">
                <Panel wash className="max-w-sm">
                  <p className="text-[15px] text-ice-100">A hairline-bordered surface with the radial depth wash.</p>
                </Panel>
              </Block>
              <Block title="Modal / Sheet / Lightbox">
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
                  <Button variant="secondary" onClick={() => setSheetOpen(true)}>Open sheet</Button>
                  <Button variant="secondary" onClick={() => setLightboxOpen(true)}>Open lightbox</Button>
                </div>
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Approve payment">
                  <p className="text-[15px] text-ice-300">This action is idempotent and cannot be undone twice.</p>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => setModalOpen(false)}>Confirm</Button>
                  </div>
                </Modal>
                <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filter events">
                  <div className="flex flex-col gap-3">
                    <Chip>Workshops</Chip>
                    <Chip selected>Competitions</Chip>
                  </div>
                </Sheet>
                <Lightbox
                  open={lightboxOpen}
                  onClose={() => setLightboxOpen(false)}
                  src="/brand/striatum-logo.svg"
                  alt="Sample payment screenshot"
                />
              </Block>
            </div>
          </section>

          <section>
            <SectionHeader index="08" eyebrow="PRIMITIVES" heading="Chips & status" />
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Chip>Default</Chip>
                <Chip selected>Selected</Chip>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <StatusChip key={s} status={s} />
                ))}
              </div>
            </div>
          </section>

          <section>
            <SectionHeader index="09" eyebrow="PRIMITIVES" heading="Navigation" />
            <div className="mt-4 flex flex-col gap-6">
              <Tabs
                items={[
                  { value: "events", label: "Events" },
                  { value: "schedule", label: "Schedule" },
                ]}
                value={tab}
                onChange={setTab}
              />
              <SegmentedControl
                options={[
                  { value: "all", label: "All" },
                  { value: "delegate", label: "Delegate" },
                  { value: "event", label: "Event" },
                ]}
                value={segment}
                onChange={setSegment}
              />
              <Stepper
                steps={[{ label: "Your Details" }, { label: "Payment" }]}
                currentIndex={1}
              />
              <Divider label="or" />
            </div>
          </section>

          <section>
            <SectionHeader index="10" eyebrow="PRIMITIVES" heading="Feedback states" />
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="flex items-center gap-4">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
              <EmptyState
                title="Nothing here yet"
                description="Events you register for will appear here with their individual QR passes."
                action={<Button size="sm">Explore events →</Button>}
              />
              <ErrorState
                title="Couldn't load this page"
                description="Check your connection and try again."
                action={<Button size="sm" variant="secondary">Retry</Button>}
              />
              <ToastDemo />
            </div>
          </section>

          <section>
            <SectionHeader index="11" eyebrow="DELEGATE" heading="QR, copy & upload" />
            <div className="mt-4 flex flex-col gap-6">
              <div className="flex flex-wrap items-start gap-6">
                <QrPanel value="https://striatum.example/verify/S4-26-0184" label="Delegate verification QR" />
                <div className="flex w-full max-w-sm flex-col gap-4">
                  <CopyField label="UPI ID" value="striatum4@upi" />
                  <CopyField label="Delegate ID" value="S4-26-0184" />
                </div>
              </div>
              <div className="max-w-md">
                <FileDropzone file={dropzoneFile} onChange={setDropzoneFile} />
              </div>
            </div>
          </section>

          <section>
            <SectionHeader index="12" eyebrow="SHELL" heading="Header variants" />
            <div className="mt-4 flex flex-col gap-4">
              <div className="overflow-hidden rounded-md border border-line-100">
                <FocusedFlowHeader />
              </div>
              <div className="flex items-center gap-4">
                <LogoMark size={40} />
                <Wordmark variant="full" />
              </div>
            </div>
          </section>
        </PageContainer>

        <BottomNav />
      </div>
    </ToastProvider>
  );
}
