import JSZip from "jszip";
import type { LottieJSON } from "@/lib/types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const DEFAULT_ZIP_PATH = `${BASE_PATH}/assets/闪购微动画.zip`;

export type UnzippedLottiePackage = {
  zipPath: string;
  dataPath: string;
  lottieData: LottieJSON;
  imageDataUrls: Record<string, string>;
  fileNames: string[];
};

function normalizeZipPath(path: string) {
  return path.replace(/^\.\/+/, "").replace(/\\/g, "/");
}

function shouldIgnoreZipEntry(path: string) {
  const normalized = normalizeZipPath(path);
  return normalized.startsWith("__MACOSX/") || normalized.includes("/__MACOSX/");
}

function isImagePath(path: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}

function getImageMimeType(path: string) {
  const normalized = path.toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  if (normalized.endsWith(".gif")) {
    return "image/gif";
  }

  return "application/octet-stream";
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("无法读取 ZIP 图片素材。"));
    reader.readAsDataURL(blob);
  });
}

function addImageAliases(map: Record<string, string>, path: string, dataUrl: string) {
  const normalized = normalizeZipPath(path);
  const fileName = normalized.split("/").pop();
  map[normalized] = dataUrl;

  if (fileName) {
    map[fileName] = dataUrl;
  }
}

export function resolveZippedImage(
  imageDataUrls: Record<string, string>,
  folder: string,
  fileName: string,
) {
  const fullPath = normalizeZipPath(`${folder || ""}${fileName || ""}`);
  return imageDataUrls[fullPath] ?? imageDataUrls[fileName] ?? null;
}

export async function unzipLottiePackage(zipPath = DEFAULT_ZIP_PATH): Promise<UnzippedLottiePackage> {
  const response = await fetch(zipPath, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`无法加载 ZIP：${zipPath} (${response.status})`);
  }

  const archive = await JSZip.loadAsync(await response.arrayBuffer());
  const entries = Object.values(archive.files).filter(
    (entry) => !entry.dir && !shouldIgnoreZipEntry(entry.name),
  );
  const dataEntry =
    entries.find((entry) => normalizeZipPath(entry.name) === "data.json") ??
    entries.find((entry) => normalizeZipPath(entry.name).endsWith("/data.json"));

  if (!dataEntry) {
    throw new Error("ZIP 中没有找到 data.json。");
  }

  const dataText = await dataEntry.async("text");
  const lottieData = JSON.parse(dataText) as LottieJSON;
  const imageDataUrls: Record<string, string> = {};

  await Promise.all(
    entries
      .filter((entry) => isImagePath(entry.name))
      .map(async (entry) => {
        const blob = new Blob([await entry.async("arraybuffer")], {
          type: getImageMimeType(entry.name),
        });
        addImageAliases(imageDataUrls, entry.name, await blobToDataUrl(blob));
      }),
  );

  return {
    zipPath,
    dataPath: normalizeZipPath(dataEntry.name),
    lottieData,
    imageDataUrls,
    fileNames: entries.map((entry) => normalizeZipPath(entry.name)).sort(),
  };
}
