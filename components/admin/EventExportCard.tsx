'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { EventRow } from '@/lib/types/database';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export interface EventExportCardProps {
  events: EventRow[];
}

/** CSV export scoped to a single selected event's registrations. */
export function EventExportCard({ events }: EventExportCardProps) {
  const [eventId, setEventId] = useState(events[0]?.id ?? '');

  return (
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-1">
        <h3 className="text-[15px] font-semibold text-ice-100">Registrations for a Selected Event</h3>
        <Select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          options={events.map((e) => ({ value: e.id, label: e.name }))}
          placeholder="Select an event"
        />
      </div>
      <a href={eventId ? `/admin/exports/download?type=event-registrations&eventId=${eventId}` : undefined}>
        <Button type="button" variant="secondary" size="sm" disabled={!eventId}>
          <Download className="size-4" aria-hidden="true" />
          Download CSV
        </Button>
      </a>
    </Panel>
  );
}
