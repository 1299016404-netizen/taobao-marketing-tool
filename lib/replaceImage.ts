import type { LottieJSON } from "@/lib/types";

type AnyRecord = Record<string, unknown>;

function cloneLottie(data: LottieJSON): LottieJSON {
  return JSON.parse(JSON.stringify(data)) as LottieJSON;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取替换图片。"));
    image.src = src;
  });
}

export async function fitImageToAssetDataUrl(dataUrl: string, width: number, height: number) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  if (!context) {
    throw new Error("无法创建图片替换画布。");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const targetWidth = image.naturalWidth * scale;
  const targetHeight = image.naturalHeight * scale;
  const x = (canvas.width - targetWidth) / 2;
  const y = (canvas.height - targetHeight) / 2;

  context.drawImage(image, x, y, targetWidth, targetHeight);

  return canvas.toDataURL("image/png");
}

export function replaceImageAssetInLottie(
  lottieData: LottieJSON,
  assetId: string,
  dataUrl: string,
) {
  const next = cloneLottie(lottieData);
  const json = next as AnyRecord;
  const assets = Array.isArray(json.assets) ? (json.assets as AnyRecord[]) : [];

  assets.forEach((asset) => {
    if (String(asset.id) === assetId) {
      asset.u = "";
      asset.p = dataUrl;
      asset.e = 1;
    }
  });

  return next;
}
