"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { Wordmark } from "@/components/brand/Wordmark";
import { iconForEventType } from "./EventTypeIcon";
import type { EventTypeRow } from "@/lib/types/database";

export type ExploreMode = "EVENTS" | "SCHEDULE";
export type ExploreSort = "date" | "name";

export interface ExploreControlsProps {
  eventTypes: EventTypeRow[];
  search: string;
  typeId: string | null;
  mode: ExploreMode;
  sort: ExploreSort;
}

/**
 * Owns every piece of Explore filter/search/sort state by writing it into
 * the URL query string (so it survives navigation, per the product spec).
 * Renders: back + centered lockup + search/filter icon buttons, the mode
 * SegmentedControl, and the circular event-type filter row.
 */
export function ExploreControls({ eventTypes, search, typeId, mode, sort }: ExploreControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchOpen, setSearchOpen] = useState(search.length > 0);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(search);

  const pushParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value.length === 0) params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-2">
        <IconButton
          icon={<ArrowLeft className="size-5" />}
          label="Go back"
          onClick={() => router.back()}
        />
        <div className="flex justify-center">
          <Wordmark variant="compact" />
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Search className="size-5" />}
            label="Search events"
            active={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          />
          <IconButton
            icon={<SlidersHorizontal className="size-5" />}
            label="Sort events"
            active={sortOpen}
            onClick={() => setSortOpen(true)}
          />
        </div>
      </div>

      {searchOpen ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            leadingIcon={<Search className="size-4" />}
            placeholder="Search by name or type"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              pushParams({ q: e.target.value });
            }}
            className="flex-1"
          />
          {searchValue ? (
            <IconButton
              icon={<X className="size-4" />}
              label="Clear search"
              onClick={() => {
                setSearchValue("");
                pushParams({ q: null });
              }}
            />
          ) : null}
        </div>
      ) : null}

      <SegmentedControl
        options={[
          { value: "EVENTS", label: "EVENTS" },
          { value: "SCHEDULE", label: "SCHEDULE" },
        ]}
        value={mode}
        onChange={(v) => pushParams({ mode: v === "EVENTS" ? null : v })}
        className="w-full"
      />

      <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-1">
        <TypeFilterButton
          active={!typeId}
          label="All"
          onClick={() => pushParams({ type: null })}
        />
        {eventTypes.map((type) => (
          <TypeFilterButton
            key={type.id}
            active={typeId === type.id}
            label={type.label}
            icon={iconForEventType(type.key)}
            onClick={() => pushParams({ type: typeId === type.id ? null : type.id })}
          />
        ))}
      </div>

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort events">
        <div className="flex flex-col gap-2">
          {(
            [
              { value: "date", label: "By date" },
              { value: "name", label: "By name" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                pushParams({ sort: option.value === "date" ? null : option.value });
                setSortOpen(false);
              }}
              className={cn(
                "flex h-12 items-center justify-between rounded-md border px-4 text-[15px] font-medium",
                sort === option.value
                  ? "border-signal-500 text-signal-400"
                  : "border-line-200 text-ice-100",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function TypeFilterButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon?: ReturnType<typeof iconForEventType>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-1.5"
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full border transition-colors",
          active
            ? "border-signal-500 bg-signal-500/10 text-signal-400"
            : "border-line-200 text-ice-500",
        )}
      >
        {Icon ? <Icon className="size-5" aria-hidden="true" /> : null}
      </span>
      <span
        className={cn(
          "text-[11px] font-medium",
          active ? "text-ice-100" : "text-ice-500",
        )}
      >
        {label}
      </span>
      <span
        className={cn("h-0.5 w-5 rounded-full", active ? "bg-signal-500" : "bg-transparent")}
      />
    </button>
  );
}
