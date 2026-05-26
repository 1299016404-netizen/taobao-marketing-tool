import { toBlob, toPng } from "html-to-image";
import type { PixelRatio, TemplateId } from "@/lib/types";

const templateFileNames: Record<TemplateId, string> = {
  "tao-main-search": "tao-main-search-tag",
  "tao-travel-tab": "tao-travel-tab",
  "mini-app": "mini-app-card",
  "waist-banner": "waist-banner",
};

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

export function makeExportFileName(templateId: TemplateId) {
  return `${templateFileNames[templateId]}-${timestamp()}.png`;
}

export async function exportNodeToPngDataUrl(
  node: HTMLElement,
  pixelRatio: PixelRatio = 3,
) {
  await document.fonts.ready;

  return toPng(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: "transparent",
    style: {
      transform: "none",
      transformOrigin: "top left",
    },
  });
}

export async function exportNodeToPngBlob(
  node: HTMLElement,
  pixelRatio: PixelRatio = 3,
) {
  await document.fonts.ready;

  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: "transparent",
    style: {
      transform: "none",
      transformOrigin: "top left",
    },
  });

  if (!blob) {
    throw new Error("PNG 导出失败，请重试。");
  }

  return blob;
}

export async function downloadNodeAsPng(
  node: HTMLElement,
  templateId: TemplateId,
  pixelRatio: PixelRatio = 3,
) {
  const dataUrl = await exportNodeToPngDataUrl(node, pixelRatio);
  const link = document.createElement("a");
  link.download = makeExportFileName(templateId);
  link.href = dataUrl;
  link.click();
}
