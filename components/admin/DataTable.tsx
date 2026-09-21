import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EmptyState } from '@/components/ui/EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Column is sortable — sortKey is the query-string value used for `sort`. */
  sortKey?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Current sort state, read from the URL by the caller. */
  sort?: { key: string; dir: 'asc' | 'desc' };
  /** Base path used to build sort links (existing query params are preserved by the caller via baseParams). */
  basePath?: string;
  baseParams?: Record<string, string | undefined>;
  /** Pagination */
  page?: number;
  pageSize?: number;
  total?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Optional: renders a link wrapper around each row for row-click navigation. */
  rowHref?: (row: T) => string | undefined;
}

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') usp.set(k, v);
  }
  const qs = usp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Server-rendered dense data table. Sorting and pagination are plain links
 * (query-string state) so views are shareable, survive refresh, and require
 * no client JS. Sticky header, compact row density suited to hundreds of
 * rows.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  sort,
  basePath = '',
  baseParams = {},
  page = 1,
  pageSize,
  total,
  emptyTitle = 'Nothing here yet.',
  emptyDescription,
  emptyAction,
  rowHref,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const totalPages = pageSize && total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-line-100">
        <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-abyss-800">
            <tr>
              {columns.map((col) => {
                const isSorted = sort && sort.key === col.sortKey;
                const nextDir = isSorted && sort?.dir === 'asc' ? 'desc' : 'asc';
                const content = (
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortKey ? (
                      isSorted ? (
                        sort?.dir === 'asc' ? (
                          <ArrowUp className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                      )
                    ) : null}
                  </span>
                );
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap border-b border-line-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ice-500',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.sortKey ? (
                      <Link
                        href={buildHref(basePath, {
                          ...baseParams,
                          sort: col.sortKey,
                          dir: nextDir,
                          page: undefined,
                        })}
                        className="hover:text-ice-100"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = rowHref?.(row);
              return (
                <tr
                  key={getRowId(row)}
                  className="border-b border-line-100 last:border-b-0 odd:bg-abyss-800/30 hover:bg-abyss-700/50"
                >
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-2.5 align-middle text-ice-100',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {href && i === 0 ? (
                        <Link href={href} className="block hover:text-signal-400">
                          {col.render(row)}
                        </Link>
                      ) : (
                        col.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages && totalPages > 1 ? (
        <div className="flex items-center justify-between text-[13px] text-ice-500">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={buildHref(basePath, { ...baseParams, page: String(Math.max(1, page - 1)) })}
              aria-disabled={page <= 1}
              className={cn(
                'inline-flex h-9 items-center rounded-md border border-line-200 px-3',
                page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-signal-500 hover:text-signal-400'
              )}
            >
              Previous
            </Link>
            <Link
              href={buildHref(basePath, {
                ...baseParams,
                page: String(Math.min(totalPages, page + 1)),
              })}
              aria-disabled={page >= totalPages}
              className={cn(
                'inline-flex h-9 items-center rounded-md border border-line-200 px-3',
                page >= totalPages
                  ? 'pointer-events-none opacity-40'
                  : 'hover:border-signal-500 hover:text-signal-400'
              )}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
