"use client";

import * as React from "react";
import { FileImage, Loader2, Upload, Check, Copy } from "lucide-react";
import { exportAPNG } from "@/lib/exportAPNG";
import { exportGIF, warmupFFmpegWasm } from "@/lib/exportGIF";
import { useAnimationStore } from "@/lib/animationStore";
import { uploadToAliyun } from "@/lib/uploadToAliyun";
import type { ExportFormat } from "@/lib/types";

type ExportPanelProps = {
  exportRef: React.RefObject<HTMLDivElement | null>;
  variant?: "card" | "inline";
};

type UploadState = {
  phase: "idle" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
  copied?: boolean;
};

export function ExportPanel({ exportRef, variant = "card" }: ExportPanelProps) {
  const animation = useAnimationStore((state) => state.animation);
  const currentFrame = useAnimationStore((state) => state.currentFrame);
  const isPlaying = useAnimationStore((state) => state.isPlaying);
  const exportScale = useAnimationStore((state) => state.exportScale);
  const exportState = useAnimationStore((state) => state.exportState);
  const setCurrentFrame = useAnimationStore((state) => state.setCurrentFrame);
  const setPlaying = useAnimationStore((state) => state.setPlaying);
  const setExportState = useAnimationStore((state) => state.setExportState);

  const [lastExportedBlob, setLastExportedBlob] = React.useState<Blob | null>(null);
  const [uploadState, setUploadState] = React.useState<UploadState>({ phase: "idle" });

  const handleExport = React.useCallback(
    async (format: ExportFormat) => {
      if (!animation || !exportRef.current || exportState.phase === "capturing" || exportState.phase === "encoding") {
        return;
      }

      const previousFrame = currentFrame;
      const wasPlaying = isPlaying;
      setPlaying(false);
      setExportState({
        phase: "capturing",
        format,
        progress: 0,
        message: "正在采集帧",
      });

      const renderFrame = async (frame: number) => {
        setCurrentFrame(frame);
      };

      try {
        let blob: Blob;

        if (format === "gif") {
          await warmupFFmpegWasm().catch(() => null);
          blob = await exportGIF({
            element: exportRef.current,
            totalFrames: animation.totalFrames,
            fps: animation.fps,
            scale: exportScale,
            renderFrame,
            filename: `${animation.name}-${exportScale}x.gif`,
            onProgress: ({ progress }) =>
              setExportState({
                phase: progress >= 1 ? "encoding" : "capturing",
                progress: progress * 0.82,
                message: progress >= 1 ? "正在编码 GIF" : "正在采集帧",
              }),
          });
        } else {
          blob = await exportAPNG({
            element: exportRef.current,
            totalFrames: animation.totalFrames,
            fps: animation.fps,
            scale: exportScale,
            renderFrame,
            filename: `${animation.name}-${exportScale}x.png`,
            loopCount: 3,
            onProgress: ({ progress }) =>
              setExportState({
                phase: progress >= 1 ? "encoding" : "capturing",
                progress: progress * 0.88,
                message: progress >= 1 ? "正在编码动图" : "正在采集帧",
              }),
          });
        }

        setLastExportedBlob(blob);
        setUploadState({ phase: "idle" });
        setExportState({
          phase: "done",
          format,
          progress: 1,
          message: "导出完成",
        });
      } catch (error) {
        setExportState({
          phase: "error",
          format,
          progress: 0,
          message: error instanceof Error ? error.message : "导出失败",
        });
      } finally {
        setCurrentFrame(previousFrame);
        setPlaying(wasPlaying);
      }
    },
    [
      animation,
      currentFrame,
      exportRef,
      exportScale,
      exportState.phase,
      isPlaying,
      setCurrentFrame,
      setExportState,
      setPlaying,
    ],
  );

  const handleUpload = React.useCallback(async () => {
    if (!lastExportedBlob || !animation) return;

    setUploadState({ phase: "uploading" });

    const ext = lastExportedBlob.type === "image/gif" ? "gif" : "png";
    const fileName = `${animation.name}-${exportScale}x.${ext}`;

    const result = await uploadToAliyun(lastExportedBlob, fileName);

    if (result.success && result.url) {
      setUploadState({ phase: "success", url: result.url });
    } else {
      setUploadState({ phase: "error", error: result.error || "上传失败" });
    }
  }, [lastExportedBlob, animation, exportScale]);

  const handleCopy = React.useCallback(async () => {
    if (!uploadState.url) return;
    try {
      await navigator.clipboard.writeText(uploadState.url);
      setUploadState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setUploadState((prev) => ({ ...prev, copied: false })), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = uploadState.url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setUploadState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setUploadState((prev) => ({ ...prev, copied: false })), 2000);
    }
  }, [uploadState.url]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        void handleExport("apng");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleExport]);

  const busy = exportState.phase === "capturing" || exportState.phase === "encoding";
  const showMessage = exportState.phase !== "idle" && Boolean(exportState.message);
  const canUpload = Boolean(lastExportedBlob) && !busy && uploadState.phase !== "uploading";
  const containerClassName =
    variant === "inline"
      ? "grid gap-3 rounded-lg border border-[rgba(20,22,28,0.12)] bg-white/58 p-3"
      : "grid gap-3 rounded-lg border border-[rgba(20,22,28,0.12)] bg-white/72 p-4";

  return (
    <section className={containerClassName}>
      <div className="grid gap-2">
        <button
          type="button"
          disabled={!animation || busy}
          onClick={() => void handleExport("apng")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[rgba(20,22,28,0.14)] bg-white/82 text-sm font-bold text-[#171920] shadow-none transition hover:-translate-y-0.5 hover:border-[rgba(20,22,28,0.24)] hover:bg-white disabled:pointer-events-none disabled:opacity-50"
        >
          {busy && exportState.format === "apng" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileImage size={16} />
          )}
          导出动图
        </button>

        <button
          type="button"
          disabled={!canUpload}
          onClick={() => void handleUpload()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[rgba(20,22,28,0.14)] bg-white/82 text-sm font-bold text-[#171920] shadow-none transition hover:-translate-y-0.5 hover:border-[rgba(20,22,28,0.24)] hover:bg-white disabled:pointer-events-none disabled:opacity-50"
        >
          {uploadState.phase === "uploading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {uploadState.phase === "uploading" ? "上传中…" : "上传阿里图片库"}
        </button>
      </div>

      {/* Upload result */}
      {uploadState.phase === "success" && uploadState.url && (
        <div className="grid gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 p-2.5">
          <p className="text-xs font-medium text-emerald-700">上传成功</p>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={uploadState.url}
              className="min-w-0 flex-1 truncate rounded border border-emerald-200 bg-white px-2 py-1 text-xs text-[#3a3d45]"
            />
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-50"
              title="复制链接"
            >
              {uploadState.copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          {uploadState.copied && (
            <p className="text-xs text-emerald-600">已复制</p>
          )}
        </div>
      )}

      {uploadState.phase === "error" && uploadState.error && (
        <div className="rounded-md border border-red-200 bg-red-50/60 p-2.5">
          <p className="whitespace-pre-wrap text-xs text-red-700">{uploadState.error}</p>
        </div>
      )}

      <div className="grid gap-2">
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(20,22,28,0.12)]">
          <div
            className="h-full rounded-full bg-[#b91942] transition-[width]"
            style={{ width: `${Math.round(exportState.progress * 100)}%` }}
          />
        </div>
        {showMessage ? (
          <p className="text-xs font-medium text-[#3a3d45]">{exportState.message}</p>
        ) : null}
      </div>
    </section>
  );
}
