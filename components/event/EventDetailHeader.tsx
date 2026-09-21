"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Share2, Check } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Wordmark } from "@/components/brand/Wordmark";

export interface EventDetailHeaderProps {
  eventName: string;
  shareUrl: string;
}

/**
 * Back + centered brand lockup + share. Bookmark is intentionally omitted —
 * there is no bookmarks table/column to persist it against, and a dead
 * control is worse than no control (per the task brief).
 */
export function EventDetailHeader({ eventName, shareUrl }: EventDetailHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: eventName, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently no-op
    }
  };

  return (
    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
      <IconButton icon={<ArrowLeft className="size-5" />} label="Go back" onClick={() => router.back()} />
      <div className="flex justify-center">
        <Wordmark variant="compact" />
      </div>
      <IconButton
        icon={copied ? <Check className="size-4 text-success" /> : <Share2 className="size-5" />}
        label={copied ? "Link copied" : "Share event"}
        onClick={handleShare}
      />
    </div>
  );
}
