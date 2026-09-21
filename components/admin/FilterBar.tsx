'use client';

/**
 * STRIATUM 4.0 admin — filter bar: tabs + search + selects, state held in
 * the URL query string so views are shareable and survive refresh.
 */
import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FilterTab {
  value: string;
  label: string;
}

export interface FilterSelect {
  param: string;
  placeholder: string;
  options: { value: string; label: string }[];
}

export interface FilterBarProps {
  /** Query param name for the tab group, e.g. "status". */
  tabParam?: string;
  tabs?: FilterTab[];
  searchParam?: string;
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  className?: string;
}

export function FilterBar({
  tabParam = 'status',
  tabs,
  searchParam = 'q',
  searchPlaceholder = 'Search…',
  selects,
  className,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get(searchParam) ?? '');

  useEffect(() => {
    setSearchValue(searchParams.get(searchParam) ?? '');
  }, [searchParams, searchParam]);

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const usp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') usp.delete(key);
        else usp.set(key, value);
      }
      usp.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${usp.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const activeTab = searchParams.get(tabParam) ?? tabs?.[0]?.value ?? '';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {tabs && tabs.length > 0 ? (
        <div role="tablist" className="flex flex-wrap items-center gap-1 border-b border-line-100">
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <button
                key={tab.value}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => pushParams({ [tabParam]: tab.value === tabs[0].value ? undefined : tab.value })}
                className={cn(
                  'relative flex h-10 items-center px-3 text-[13px] font-medium transition-colors',
                  isActive ? 'text-ice-100' : 'text-ice-500 hover:text-ice-300'
                )}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-signal-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {searchParam ? (
          <div className="relative flex min-w-[220px] flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-ice-500" aria-hidden="true" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') pushParams({ [searchParam]: searchValue });
              }}
              onBlur={() => pushParams({ [searchParam]: searchValue })}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-md border border-line-200 bg-abyss-600 pl-9 pr-3 text-[14px] text-ice-100 outline-none placeholder:text-ice-700 focus:border-signal-500"
            />
          </div>
        ) : null}

        {selects?.map((select) => (
          <select
            key={select.param}
            value={searchParams.get(select.param) ?? ''}
            onChange={(e) => pushParams({ [select.param]: e.target.value })}
            className="h-10 rounded-md border border-line-200 bg-abyss-600 px-3 text-[13px] text-ice-100 outline-none focus:border-signal-500"
          >
            <option value="">{select.placeholder}</option>
            {select.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
