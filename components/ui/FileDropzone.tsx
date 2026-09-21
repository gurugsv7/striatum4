"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./IconButton";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export interface FileDropzoneProps {
  /** Currently held file, controlled by the parent. */
  file: File | null;
  onChange: (file: File | null) => void;
  onError?: (message: string) => void;
  className?: string;
}

/**
 * Accepts a single JPEG/PNG/WEBP up to 8MB, shows a real object-URL preview,
 * supports replace and remove. Holds the File only — upload happens in a
 * server action wired by a later agent.
 */
export function FileDropzone({ file, onChange, onError, className }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const validateAndSet = useCallback(
    (candidate: File | undefined | null) => {
      if (!candidate) return;
      if (!ACCEPTED_TYPES.includes(candidate.type)) {
        onError?.("Only JPG, PNG or WEBP images are accepted.");
        return;
      }
      if (candidate.size > MAX_BYTES) {
        onError?.("File must be 8MB or smaller.");
        return;
      }
      onChange(candidate);
    },
    [onChange, onError],
  );

  if (file && previewUrl) {
    return (
      <div className={cn("overflow-hidden rounded-lg border border-line-100", className)}>
        <div className="relative bg-abyss-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Payment screenshot preview"
            className="max-h-72 w-full object-contain"
          />
          <IconButton
            icon={<X className="size-4" />}
            label="Remove screenshot"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 bg-abyss-900/70"
          />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line-100 px-4 py-3">
          <span className="truncate text-[13px] text-ice-500">{file.name}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 text-[13px] font-semibold text-signal-500 underline underline-offset-4"
          >
            Replace
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        validateAndSet(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex min-h-[176px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
        dragOver ? "border-signal-500 bg-signal-500/5" : "border-line-200",
        className,
      )}
    >
      <ImageIcon className="size-6 text-ice-500" aria-hidden="true" />
      <p className="text-[15px] font-medium text-ice-100">Upload payment screenshot</p>
      <p className="text-[13px] text-ice-500">JPG, PNG or WEBP — up to 8MB</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 inline-flex h-11 items-center gap-2 rounded-md border border-line-200 px-4 text-[15px] font-semibold text-ice-100 hover:border-signal-500 hover:text-signal-400"
      >
        <UploadCloud className="size-4" aria-hidden="true" />
        Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files?.[0])}
      />
    </div>
  );
}
