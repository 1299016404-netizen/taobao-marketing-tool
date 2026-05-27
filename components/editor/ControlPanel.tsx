"use client";

/* eslint-disable @next/next/no-img-element */

import { AppWindow, Loader2, Plane, Tags, TicketPercent, Upload } from "lucide-react";
import type * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorInput } from "@/components/controls/ColorInput";
import { Dropzone } from "@/components/upload/Dropzone";
import type { PixelRatio, TemplateConfig, TemplateId } from "@/lib/types";
import { TEMPLATE_META } from "@/lib/types";
import {
  AUTO_FILLED_WAIST_TEXTS,
  DEFAULT_WAIST_BACKGROUND,
  VIP_88_BACKGROUND,
  VIP_88_LEFT_WHEAT,
  VIP_88_RIGHT_WHEAT,
  VIP_88_WORDMARK,
  WAIST_BACKGROUND_OPTIONS,
} from "@/lib/waistBackgrounds";

type UploadState = {
  phase: "idle" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
  copied?: boolean;
  fallbackBlob?: Blob;
  fallbackFileName?: string;
  /** CORS 软成功：请求已发送到阿里图库，响应不可读取，无回链 URL */
  softSuccess?: boolean;
};

type ControlPanelProps = {
  activeTemplate: TemplateId;
  config: TemplateConfig;
  uploading: boolean;
  onTemplateChange: (template: TemplateId) => void;
  onConfigChange: (patch: Partial<TemplateConfig>) => void;
  onUpload: () => void;
  uploadResult?: UploadState;
  onCopy?: () => void;
};

const moduleIcons: Record<TemplateId, React.ComponentType<{ className?: string }>> = {
  "tao-main-search": Tags,
  "tao-travel-tab": Plane,
  "mini-app": AppWindow,
  "waist-banner": TicketPercent,
};

const waistLetterSpacingByTextLength: Record<number, number> = {
  4: 0.2,
  5: 0.12,
  6: 0.08,
  7: 0.04,
  8: 0,
  9: -0.04,
};

function getWaistLetterSpacingForText(text: string) {
  const textLength = Array.from(text.replace(/\s/g, "")).length;
  return waistLetterSpacingByTextLength[textLength];
}

export function ControlPanel({
  activeTemplate,
  config,
  uploading,
  onTemplateChange,
  onConfigChange,
  onUpload,
  uploadResult,
  onCopy,
}: ControlPanelProps) {
  const isMiniApp = activeTemplate === "mini-app";
  const isWaistBanner = activeTemplate === "waist-banner";
  const selectedWaistBackground =
    config.waistBackgroundDataUrl || DEFAULT_WAIST_BACKGROUND;
  const vip88AssetsVisible = config.vip88AssetsVisible !== false;
  const waistLetterSpacingPercent = Number(
    (config.waistLetterSpacing * 100).toFixed(2),
  );
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = event.target.value;

    if (!isWaistBanner) {
      onConfigChange({ text: nextText });
      return;
    }

    const nextLetterSpacing = getWaistLetterSpacingForText(nextText);

    onConfigChange(
      nextLetterSpacing === undefined
        ? { text: nextText }
        : { text: nextText, waistLetterSpacing: nextLetterSpacing },
    );
  };

  return (
    <aside className="glass-panel flex min-h-[640px] flex-col gap-5 overflow-hidden rounded-lg p-5 lg:h-full lg:min-h-0">
        <div className="grid gap-2">
          <div className="grid gap-2">
            {TEMPLATE_META.map((item) => {
              const Icon = moduleIcons[item.id];
              const active = item.id === activeTemplate;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTemplateChange(item.id)}
                  className="relative overflow-hidden rounded-[8px] border border-[rgba(20,22,28,0.12)] bg-white/66 p-3 text-left shadow-none transition-colors duration-200 hover:border-[rgba(20,22,28,0.22)] hover:bg-white focus-visible:outline-none"
                >
                  {active ? (
                    <motion.span
                      layoutId="active-module"
                      className="absolute inset-0 bg-[linear-gradient(135deg,rgba(185,25,66,0.12),rgba(255,255,255,0.72))]"
                      transition={{ duration: 0.22 }}
                    />
                  ) : null}
                  <span className="relative flex items-center gap-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-md border transition-colors ${
                        active
                          ? "border-[#b91942]/55 bg-transparent text-[#b91942]"
                          : "border-[rgba(20,22,28,0.14)] bg-transparent text-[#8a8d94]"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex min-h-9 min-w-0 flex-col justify-center">
                      <span className="block text-sm font-semibold text-[#171920]">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-xs leading-[1.35] text-[#6f737b]">
                        {item.description}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[rgba(20,22,28,0.12)]" />

        <div className="scrollbar-none grid min-h-0 flex-1 content-start gap-4 overflow-y-auto pr-1">
          <div className="grid gap-2">
            <Input
              id="template-text"
              aria-label="文案输入"
              value={config.text}
              onChange={handleTextChange}
              placeholder={isWaistBanner ? "春节提前订特惠" : "东京5天4晚"}
            />
          </div>

          {!isWaistBanner ? (
            <ColorInput
              label={isMiniApp ? "左侧背景色" : "标签背景色"}
              value={config.backgroundColor}
              onChange={(value) => onConfigChange({ backgroundColor: value })}
            />
          ) : null}

          {isMiniApp ? (
            <Dropzone
              label="右侧营销切图"
              hint="建议透明 PNG，导出时按 39 × 39 居中裁切"
              value={config.miniIconDataUrl}
              onChange={(value) => onConfigChange({ miniIconDataUrl: value })}
            />
          ) : null}

          {isWaistBanner ? (
            <>
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-[#171920]">
                      ⚠️ 腰封严格根据场景使用
                    </Label>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#b91942]/20 bg-white/72 px-2 py-1 text-xs font-semibold text-[#b91942]">
                    {WAIST_BACKGROUND_OPTIONS.length} 款
                  </span>
                </div>
                <div className="grid gap-2 pr-1">
                  {WAIST_BACKGROUND_OPTIONS.map((item) => {
                    const selected =
                      selectedWaistBackground === item.src;
                    const isVip88 = item.src === VIP_88_BACKGROUND;
                    const sampleText = selected ? config.text : "专享特惠";
                    const showVip88Assets =
                      isVip88 && (!selected || vip88AssetsVisible);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          // 安全覆盖规则：仅当当前文案处于“自动文案集”（初始默认 + 各腰封默认文案）
                          // 才以新腰封的 defaultText 覆盖，避免冲掉用户手动输入。
                          const canOverrideText =
                            !selected &&
                            item.defaultText !== undefined &&
                            AUTO_FILLED_WAIST_TEXTS.has(config.text);
                          const nextText = canOverrideText
                            ? item.defaultText!
                            : config.text;
                          const nextLetterSpacing =
                            canOverrideText &&
                            getWaistLetterSpacingForText(nextText) !== undefined
                              ? getWaistLetterSpacingForText(nextText)
                              : undefined;

                          onConfigChange({
                            waistBackgroundDataUrl: item.src,
                            ...(canOverrideText ? { text: nextText } : {}),
                            ...(isVip88 && config.vip88AssetsVisible === undefined
                              ? { vip88AssetsVisible: true }
                              : {}),
                            ...(nextLetterSpacing !== undefined
                              ? { waistLetterSpacing: nextLetterSpacing }
                              : {}),
                          });
                        }}
                        className={`relative grid grid-rows-[20px_auto] gap-2 rounded-[8px] border border-[rgba(20,22,28,0.12)] bg-white p-2 text-left shadow-none transition-colors duration-200 hover:border-[rgba(20,22,28,0.2)] hover:bg-white focus-visible:outline-none ${
                          selected
                            ? "bg-white shadow-none"
                            : "shadow-none"
                        }`}
                      >
	                        <span
	                          className={`flex h-5 min-w-0 items-center ${
	                            selected && isVip88 ? "pr-32" : "pr-10"
	                          }`}
	                        >
                          <span className="truncate text-xs font-semibold text-[#171920]">
                            {item.label}
                          </span>
                          {selected && isVip88 ? (
                            <span className="absolute right-2 top-2 flex h-5 overflow-hidden rounded-full border border-[#b91942]/20 bg-white/80 p-[1px] text-[10px] font-semibold leading-none">
                              {[
                                { label: "图形文字", value: true },
                                { label: "只有文字", value: false },
                              ].map((option) => {
                                const active = vip88AssetsVisible === option.value;
                                return (
                                  <span
                                    key={option.label}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onConfigChange({
                                        vip88AssetsVisible: option.value,
                                      });
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key !== "Enter" && event.key !== " ") {
                                        return;
                                      }

                                      event.preventDefault();
                                      event.stopPropagation();
                                      onConfigChange({
                                        vip88AssetsVisible: option.value,
                                      });
                                    }}
	                                    className={`grid h-full cursor-pointer place-items-center whitespace-nowrap rounded-full px-1.5 transition-colors ${
                                      active
                                        ? "bg-[#b91942]/12 text-[#b91942]"
                                        : "text-[#6f737b] hover:bg-[rgba(20,22,28,0.06)]"
                                    }`}
                                  >
                                    {option.label}
                                  </span>
                                );
                              })}
                            </span>
                          ) : selected ? (
                            <span className="absolute right-2 top-2 grid h-5 place-items-center rounded-full bg-[#b91942] px-1.5 text-[10px] font-semibold leading-none text-white">
                              当前
                            </span>
                          ) : null}
                        </span>
                        <span className="relative block aspect-[666/102] w-full overflow-hidden rounded-b-[8px] bg-transparent">
                          <img
                            src={item.src}
                            alt=""
                            className="absolute inset-0 h-full w-full rounded-b-[8px] object-fill"
                            draggable={false}
                          />
                          {isVip88 ? (
                            <span className="absolute inset-0 flex items-center justify-center gap-0">
                              {showVip88Assets ? (
                                <>
                                  <img
                                    src={VIP_88_LEFT_WHEAT}
                                    alt=""
                                    className="h-[30px] w-[32px] shrink-0 object-contain"
                                    draggable={false}
                                  />
                                  <img
                                    src={VIP_88_WORDMARK}
                                    alt=""
                                    className="h-[30px] w-[88px] shrink-0 object-contain"
                                    draggable={false}
                                  />
                                </>
                              ) : null}
                              <span
                                className="truncate text-[36px] leading-none text-white"
                                style={{
                                  fontFamily:
                                    "FliggyFontMedium, FliggyFont, sans-serif",
                                  fontWeight: 500,
                                }}
                              >
                                {sampleText}
                              </span>
                              {showVip88Assets ? (
                                <img
                                  src={VIP_88_RIGHT_WHEAT}
                                  alt=""
                                  className="h-[30px] w-[32px] shrink-0 object-contain"
                                  draggable={false}
                                />
                              ) : null}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {isWaistBanner ? (
          <div className="grid shrink-0 gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="waist-letter-spacing">字间距</Label>
              <span className="text-xs font-semibold text-[#b91942]">
                {waistLetterSpacingPercent}%
              </span>
            </div>
            <Slider
              id="waist-letter-spacing"
              min={-10}
              max={100}
              step={1}
              value={[waistLetterSpacingPercent]}
              onValueChange={([value]) =>
                onConfigChange({ waistLetterSpacing: value / 100 })
              }
            />
          </div>
        ) : null}

        <div className="h-px bg-[rgba(20,22,28,0.12)]" />

        <div className="grid gap-3">

          {uploadResult?.phase === "success" && uploadResult.url ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={uploadResult.url}
                  className="min-w-0 flex-1 truncate rounded border border-emerald-200 bg-white px-2 py-1.5 text-xs text-[#3a3d45] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded border border-emerald-200 bg-white px-2 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                >
                  {uploadResult.copied ? "已复制" : "复制"}
                </button>
              </div>
            </div>
          ) : null}
          {uploadResult?.phase === "success" && !uploadResult.url && uploadResult.softSuccess ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-xs font-medium text-emerald-800 mb-1">已上传至阿里图片库</p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  在 GitHub Pages 静态部署下浏览器无法读取跨域响应，因此拿不到 CDN 链接。
                  图片已同步下载到本地作为备份，请前往图库后台复制 CDN 链接。
                </p>
              </div>
              <a
                href="https://tps.alibaba-inc.com/mine"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-white text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                打开阿里图库后台复制链接
              </a>
            </div>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="h-[52px] shadow-none hover:shadow-none"
            onClick={onUpload}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {uploading ? "上传中..." : "上传到阿里图片库"}
          </Button>

          {uploadResult?.phase === "error" && uploadResult.error ? (
            <div className="mt-3 space-y-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <p className="text-xs font-medium text-amber-800 mb-1">图片已下载，请在阿里图库页面上传</p>
                <p className="text-xs text-amber-700">{uploadResult.error}</p>
              </div>
              <a
                href="https://content.alibaba-inc.com/work/internal-media-management/pic/upload?iframe=3"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[rgba(20,22,28,0.14)] bg-white text-xs font-medium text-[#171920] transition hover:bg-gray-50"
              >
                重新打开阿里图库上传页
              </a>
            </div>
          ) : null}
        </div>
    </aside>
  );
}
