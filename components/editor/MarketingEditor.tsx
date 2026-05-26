"use client";

import * as React from "react";
import { toast } from "sonner";
import { ControlPanel } from "@/components/editor/ControlPanel";
import { PreviewStage } from "@/components/preview/PreviewStage";
import { exportNodeToPngBlob, makeExportFileName } from "@/lib/exportPNG";
import { uploadToAliyun, ALIYUN_IMAGE_LIBRARY_URL } from "@/lib/uploadToAliyun";
import type { PixelRatio, TemplateConfig, TemplateId } from "@/lib/types";
import { DEFAULT_WAIST_BACKGROUND } from "@/lib/waistBackgrounds";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

type UploadState = {
  phase: "idle" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
  copied?: boolean;
  fallbackBlob?: Blob;
  fallbackFileName?: string;
  /** CORS 软成功：请求已发出到阿里图库，但响应不可读取，无法获取回链 URL */
  softSuccess?: boolean;
};

export function MarketingEditor() {
  const exportRef = React.useRef<HTMLDivElement | null>(null);
  const [activeTemplate, setActiveTemplate] =
    React.useState<TemplateId>("tao-main-search");
  const [uploadState, setUploadState] = React.useState<UploadState>({
    phase: "idle",
  });
  const [configs, setConfigs] = React.useState<Record<TemplateId, TemplateConfig>>({
    "tao-main-search": {
      text: "我是纯中文标签",
      backgroundColor: "#FF3D00",
      miniIconDataUrl: null,
      waistBackgroundDataUrl: null,
      waistLetterSpacing: 0.09,
      pixelRatio: 3,
    },
    "tao-travel-tab": {
      text: "我是纯中文标签",
      backgroundColor: "#FF3D00",
      miniIconDataUrl: null,
      waistBackgroundDataUrl: null,
      waistLetterSpacing: 0.09,
      pixelRatio: 3,
    },
    "mini-app": {
      text: "文案内容极限是十二字",
      backgroundColor: "#FFE5E5",
      miniIconDataUrl: `${BASE_PATH}/images/mini-app-marketing-icon.png`,
      waistBackgroundDataUrl: null,
      waistLetterSpacing: 0.09,
      pixelRatio: 3,
    },
    "waist-banner": {
      text: "春节提前订特惠",
      backgroundColor: "#FF5533",
      miniIconDataUrl: null,
      waistBackgroundDataUrl: DEFAULT_WAIST_BACKGROUND,
      waistLetterSpacing: 0.04,
      pixelRatio: 3,
    },
  });

  const activeConfig = configs[activeTemplate];

  const updateActiveConfig = React.useCallback(
    (patch: Partial<TemplateConfig>) => {
      setConfigs((current) => ({
        ...current,
        [activeTemplate]: {
          ...current[activeTemplate],
          ...patch,
        },
      }));
    },
    [activeTemplate],
  );

  const triggerFallback = React.useCallback((blob: Blob, fileName: string, errorMsg?: string) => {
    // 1. 自动下载图片
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    // 2. 自动打开阿里图库上传页（新标签页）
    window.open(ALIYUN_IMAGE_LIBRARY_URL, '_blank');

    // 3. 更新状态为 fallback 模式
    setUploadState({
      phase: 'error',
      error: errorMsg || '自动上传超时，已为您下载图片并打开上传页面',
      fallbackBlob: blob,
      fallbackFileName: fileName,
    });
    toast('图片已下载，请在打开的页面上传', { duration: 5000 });
  }, []);

  const handleUpload = React.useCallback(async () => {
    const node = exportRef.current;
    if (!node || uploadState.phase === 'uploading') return;

    try {
      setUploadState({ phase: 'uploading' });

      // 截图（3x高清）
      const blob = await exportNodeToPngBlob(node, 3);
      const fileName = makeExportFileName(activeTemplate);

      console.log(`[上传] 截图完成 ${(blob.size / 1024).toFixed(0)}KB, 尝试自动上传(15s超时)...`);

      // 尝试自动上传（最多15秒）
      const result = await uploadToAliyun(blob, fileName);

      if (result.success && result.url) {
        setUploadState({ phase: 'success', url: result.url });
        toast.success('上传成功');
      } else if (result.success && result.softSuccess) {
        // CORS 软成功：静态部署（GitHub Pages）下请求已送达阿里图库，但响应不可读，无法获取 CDN URL。
        // 自动下载图片到本地作为备份，避免用户因拿不到链接而无图可用。
        console.log('[上传] CORS 软成功，展示成功状态并自动下载备份');
        try {
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(objectUrl);
        } catch (e) {
          console.warn('[上传] 软成功备份下载失败', e);
        }
        setUploadState({
          phase: 'success',
          softSuccess: true,
          fallbackBlob: blob,
          fallbackFileName: fileName,
        });
        toast.success('已上传至阿里图片库（已下载本地备份）');
      } else {
        // 自动上传失败 → 立即执行手动回退
        console.warn('[上传] 自动失败，执行手动回退');
        triggerFallback(blob, fileName, result.error);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '上传失败';
      console.error('[上传] 异常:', msg);
      setUploadState({ phase: 'error', error: msg });
      toast.error('上传失败');
    }
  }, [activeConfig.pixelRatio, activeTemplate, uploadState.phase, triggerFallback]);

  const handleCopy = React.useCallback(async () => {
    if (!uploadState.url) return;
    const url = uploadState.url;
    try {
      await navigator.clipboard.writeText(url);
      setUploadState((prev) => ({ ...prev, copied: true }));
      toast.success("链接已复制");
      setTimeout(
        () => setUploadState((prev) => ({ ...prev, copied: false })),
        2000,
      );
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setUploadState((prev) => ({ ...prev, copied: true }));
      toast.success("链接已复制");
      setTimeout(
        () => setUploadState((prev) => ({ ...prev, copied: false })),
        2000,
      );
    }
  }, [uploadState.url]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleUpload();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUpload]);

  return (
    <main
      className="relative grid min-h-[100svh] place-items-center p-4 lg:p-8"
      data-ui-version="module-desc-removed"
    >
      <div
        className="mx-auto grid w-full max-w-[1240px] items-stretch gap-5 lg:h-[calc(100svh-64px)] lg:grid-cols-[360px_minmax(0,1fr)]"
      >
        <ControlPanel
          activeTemplate={activeTemplate}
          config={activeConfig}
          uploading={uploadState.phase === "uploading"}
          onTemplateChange={setActiveTemplate}
          onConfigChange={updateActiveConfig}
          onUpload={handleUpload}
          uploadResult={uploadState}
          onCopy={handleCopy}
        />
        <PreviewStage
          activeTemplate={activeTemplate}
          config={activeConfig}
          exportRef={exportRef}
        />
      </div>
    </main>
  );
}
