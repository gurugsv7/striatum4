import { Panel } from "@/components/ui/Panel";
import type { PublishedResult } from "@/lib/queries/results";

export interface EventResultsPanelProps {
  result: PublishedResult | null;
}

/** Published results only — draft results never reach this component (query-layer enforced). */
export function EventResultsPanel({ result }: EventResultsPanelProps) {
  if (!result) {
    return (
      <Panel className="flex flex-col items-center gap-1 py-8 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ice-500">RESULTS</span>
        <p className="font-serif text-lg text-ice-100">RESULTS NOT PUBLISHED</p>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-4">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-500">RESULTS</span>
      <ul className="flex flex-col divide-y divide-line-100">
        {result.entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-200 font-mono text-[13px] text-ice-300">
                {entry.position ?? "—"}
              </span>
              <div className="flex flex-col">
                <span className="text-[15px] font-medium text-ice-100">
                  {entry.participant_name ?? entry.label ?? "Not announced"}
                </span>
                {entry.institution ? (
                  <span className="text-[13px] text-ice-500">{entry.institution}</span>
                ) : null}
              </div>
            </div>
            {entry.score ? (
              <span className="font-mono text-[13px] text-ice-500">{entry.score}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
