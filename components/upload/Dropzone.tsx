"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { ImagePlus, RotateCcw, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileToDataUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  label: string;
  hint: string;
  value: string | null;
  previewShape?: "square" | "wide";
  onChange: (dataUrl: string | null) => void;
};

export function Dropzone({
  label,
  hint,
  value,
  previewShape = "square",
  onChange,
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onChange(await fileToDataUrl(file));
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[#3a3d45]">{label}</div>
          <div className="mt-1 text-[11px] text-[#8a8d94]">{hint}</div>
        </div>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            title="清空图片"
          >
            <RotateCcw />
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "group grid min-h-[112px] place-items-center rounded-md border border-dashed border-[rgba(20,22,28,0.16)] bg-white/58 p-3 text-left transition-all duration-200 hover:border-[rgba(20,22,28,0.28)] hover:bg-white",
          dragging && "border-[#b91942]/60 bg-white/82",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/apng,image/svg+xml"
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />

        {value ? (
          <span
            className={cn(
              "block overflow-hidden rounded-md border border-[rgba(20,22,28,0.12)] bg-white/86 shadow-none",
              previewShape === "wide" ? "h-[58px] w-[180px]" : "size-[72px]",
            )}
          >
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </span>
        ) : (
          <span className="flex flex-col items-center gap-3 text-center text-[#3a3d45]">
            <span className="grid size-11 place-items-center rounded-[8px] border border-[#b91942]/20 bg-white/72 text-[#b91942] transition-transform duration-200 group-hover:-translate-y-0.5">
              {dragging ? <UploadCloud /> : <ImagePlus />}
            </span>
            <span className="text-sm">拖拽图片到这里，或点击上传</span>
          </span>
        )}
      </button>
    </div>
  );
}
