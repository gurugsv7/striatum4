import { Layers, Trophy, Presentation, Sparkles, type LucideIcon } from "lucide-react";

/**
 * Decorative icon for an event_types row, chosen from its `key` (never its
 * label text — labels are free-form admin copy). This is a display-only
 * mapping; it invents no category that isn't already in the database, it
 * only picks which glyph represents an existing row. Unknown keys fall back
 * to a neutral glyph rather than guessing.
 */
const ICONS: Record<string, LucideIcon> = {
  WORKSHOP: Layers,
  COMPETITION: Trophy,
  PRESENTATION: Presentation,
  OTHER: Sparkles,
};

export function iconForEventType(key: string | null | undefined): LucideIcon {
  if (!key) return Sparkles;
  return ICONS[key.toUpperCase()] ?? Sparkles;
}
