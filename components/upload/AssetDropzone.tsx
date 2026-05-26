"use client";

import * as React from "react";
import { fileToDataUrl } from "@/lib/utils";

type AssetDropzoneProps = {
  label: string;
  meta?: string;
  previewSrc?: string | null;
  onChange: (dataUrl: string) => void;
};

export function AssetDropzone({ label, meta, previewSrc, onChange }: AssetDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = React.useState(false);

  const handleFiles = React.useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        return;
      }

      onChange(await fileToDataUrl(file));
    },
    [onChange],
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        void handleFiles(event.dataTransfer.files);
      }}
      className={[
        "group grid gap-3 rounded-lg border p-3 transition",
        isOver
          ? "border-[#b91942]/60 bg-white/82"
          : "border-[rgba(20,22,28,0.16)] bg-white/58 hover:border-[rgba(20,22,28,0.28)] hover:bg-white",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#171920]">{label}</span>
          {meta ? <span className="mt-0.5 block truncate text-[11px] text-[#8a8d94]">{meta}</span> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-24 overflow-hidden rounded-md border border-[rgba(20,22,28,0.12)] bg-white/72 text-left"
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span className="grid h-full place-items-center text-xs font-medium text-[#8a8d94]">
            暂无素材
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
