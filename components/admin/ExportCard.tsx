import { Download } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';

export interface ExportCardProps {
  title: string;
  description: string;
  type: string;
  eventId?: string;
}

/** A single CSV download tile, delivered via the exports/download route handler. */
export function ExportCard({ title, description, type, eventId }: ExportCardProps) {
  const href = eventId
    ? `/admin/exports/download?type=${type}&eventId=${eventId}`
    : `/admin/exports/download?type=${type}`;

  return (
    <Panel className="flex flex-col gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-ice-100">{title}</h3>
        <p className="mt-1 text-[13px] text-ice-500">{description}</p>
      </div>
      <a href={href} className="w-fit">
        <Button type="button" variant="secondary" size="sm">
          <Download className="size-4" aria-hidden="true" />
          Download CSV
        </Button>
      </a>
    </Panel>
  );
}
