"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Tabs } from "@/components/ui/Tabs";

export interface DetailTab {
  value: string;
  label: string;
  panel: ReactNode;
}

export interface EventDetailTabsProps {
  tabs: DetailTab[];
}

/**
 * Tab bar + panel switch. The tab LIST is computed server-side (see
 * buildDetailTabs in this same module) so a tab only ever appears when its
 * underlying column actually has data — this component just switches which
 * already-rendered panel is visible.
 */
export function EventDetailTabs({ tabs }: EventDetailTabsProps) {
  const [active, setActive] = useState(tabs[0]?.value ?? "");
  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <Tabs items={tabs.map((t) => ({ value: t.value, label: t.label }))} value={active} onChange={setActive} />
      <div>{tabs.find((t) => t.value === active)?.panel}</div>
    </div>
  );
}
