/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  EditableAnimation,
  EditableImageAsset,
  EditableTextLayer,
  LottieJSON,
  MotionKeyframe,
} from "@/lib/types";
import { getMotionFontFamily } from "@/lib/loadFont";
import { resolveZippedImage } from "@/lib/unzipAssets";

type AnyRecord = Record<string, any>;

type ParseLottieOptions = {
  zipPath?: string | null;
  imageDataUrls?: Record<string, string>;
  imageReplacements?: Record<string, string>;
};

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function cloneLottie<T extends LottieJSON>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function normalizeAssetPath(folder: unknown, fileName: unknown) {
  return `${asString(folder)}${asString(fileName)}`.replace(/\\/g, "/");
}

function firstNumber(value: unknown, fallback: number) {
  if (typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return firstNumber(value[0], fallback);
  }

  if (isRecord(value) && "k" in value) {
    return firstNumber(value.k, fallback);
  }

  return fallback;
}

function firstVector(value: unknown, fallback: number[]) {
  if (Array.isArray(value) && value.every((item) => typeof item === "number")) {
    return value as number[];
  }

  if (Array.isArray(value) && isRecord(value[0]) && Array.isArray(value[0].s)) {
    return value[0].s as number[];
  }

  if (isRecord(value) && "k" in value) {
    return firstVector(value.k, fallback);
  }

  return fallback;
}

function makeLinearKeyframe<TValue>(frame: number, value: TValue): MotionKeyframe<TValue> {
  return {
    frame,
    value,
    easing: { type: "linear" },
  };
}

function toHexColor(value: unknown, fallback = "#ffffff") {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const [r, g, b] = value;
  const toChannel = (channel: unknown) =>
    Math.round(Math.min(1, Math.max(0, typeof channel === "number" ? channel : 1)) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toChannel(r)}${toChannel(g)}${toChannel(b)}`;
}

function collectLayers(root: AnyRecord) {
  const topLayers = Array.isArray(root.layers) ? (root.layers as AnyRecord[]) : [];
  const assets = Array.isArray(root.assets) ? (root.assets as AnyRecord[]) : [];
  const precompLayers = assets.flatMap((asset) =>
    Array.isArray(asset.layers) ? (asset.layers as AnyRecord[]) : [],
  );

  return [...topLayers, ...precompLayers];
}

function getTextDocuments(layer: AnyRecord) {
  const textData = layer.t?.d?.k;

  if (Array.isArray(textData)) {
    return textData
      .map((keyframe) => (isRecord(keyframe?.s) ? keyframe.s : null))
      .filter(Boolean) as AnyRecord[];
  }

  if (isRecord(textData?.s)) {
    return [textData.s];
  }

  if (isRecord(textData)) {
    return [textData];
  }

  return [];
}

function getLayerPosition(layer: AnyRecord, width: number, height: number) {
  const position = firstVector(layer.ks?.p?.k, [width / 2, height / 2, 0]);
  return [asNumber(position[0], width / 2), asNumber(position[1], height / 2)];
}

function getTextLayerBounds(layer: AnyRecord, document: AnyRecord, width: number, height: number) {
  const [x, y] = getLayerPosition(layer, width, height);
  const fontSize = asNumber(document.s, 24);
  const documentSize = Array.isArray(document.sz) ? document.sz : null;
  const layerWidth = asNumber(layer.sw, asNumber(documentSize?.[0], Math.min(width, fontSize * 8)));
  const layerHeight = asNumber(layer.sh, asNumber(documentSize?.[1], fontSize * 1.35));
  const textBoxPosition = Array.isArray(document.ps) ? document.ps : null;
  const offsetX = asNumber(textBoxPosition?.[0], -layerWidth / 2);
  const offsetY = asNumber(textBoxPosition?.[1], -layerHeight / 2);

  return {
    x: Math.max(0, x + offsetX),
    y: Math.max(0, y + offsetY),
    width: Math.max(1, layerWidth),
    height: Math.max(1, layerHeight),
  };
}

function getLayerRefs(layers: AnyRecord[]) {
  const refs = new Map<string, string[]>();

  layers.forEach((layer) => {
    if (layer.ty !== 2 || typeof layer.refId !== "string") {
      return;
    }

    const existing = refs.get(layer.refId) ?? [];
    existing.push(asString(layer.nm, layer.refId));
    refs.set(layer.refId, existing);
  });

  return refs;
}

function setPositionX(position: unknown, x: number) {
  if (!isRecord(position)) {
    return;
  }

  const value = position.k;
  if (Array.isArray(value) && value.every((item) => typeof item === "number")) {
    value[0] = x;
    return;
  }

  if (!Array.isArray(value)) {
    return;
  }

  value.forEach((keyframe) => {
    if (!isRecord(keyframe)) {
      return;
    }

    if (Array.isArray(keyframe.s)) {
      keyframe.s[0] = x;
    }

    if (Array.isArray(keyframe.e)) {
      keyframe.e[0] = x;
    }
  });
}

function alignFlashSaleSlicesToBackground(lottieData: LottieJSON) {
  const json = lottieData as AnyRecord;
  const layers = collectLayers(json);
  const assets = Array.isArray(json.assets) ? (json.assets as AnyRecord[]) : [];
  const backgroundAsset = assets.find((asset) => asset.id === "image_8");
  const backgroundLayer = layers.find((layer) => layer.ty === 2 && layer.refId === "image_8");
  const centerX = firstNumber(backgroundLayer?.ks?.a?.k, asNumber(backgroundAsset?.w, 216) / 2);

  layers.forEach((layer) => {
    if (layer.ty !== 2 || !["image_2", "image_3", "image_4"].includes(asString(layer.refId))) {
      return;
    }

    setPositionX(layer.ks?.p, centerX);
  });
}

export function rewriteLottieImageSources(
  lottieData: LottieJSON,
  imageDataUrls: Record<string, string>,
  imageReplacements: Record<string, string> = {},
) {
  const next = cloneLottie(lottieData);
  const json = next as AnyRecord;
  const assets = Array.isArray(json.assets) ? (json.assets as AnyRecord[]) : [];

  alignFlashSaleSlicesToBackground(next);

  assets.forEach((asset) => {
    if (!asset || typeof asset.id !== "string" || typeof asset.p !== "string") {
      return;
    }

    const replacement = imageReplacements[asset.id];
    const zippedImage = resolveZippedImage(imageDataUrls, asString(asset.u), asString(asset.p));
    const resolvedSource = replacement ?? zippedImage;

    if (resolvedSource) {
      asset.u = "";
      asset.p = resolvedSource;
      asset.e = 1;
    }
  });

  return next;
}

export function parseLottieToEditableAnimation(
  lottieData: LottieJSON,
  {
    zipPath = null,
    imageDataUrls = {},
    imageReplacements = {},
  }: ParseLottieOptions = {},
): EditableAnimation {
  const json = lottieData as AnyRecord;
  const width = asNumber(json.w, 156);
  const height = asNumber(json.h, 84);
  const fps = asNumber(json.fr, 30);
  const inPoint = asNumber(json.ip, 0);
  const outPoint = asNumber(json.op, fps * 3);
  const totalFrames = Math.max(1, Math.round(outPoint - inPoint));
  const layers = collectLayers(json);
  const assets = Array.isArray(json.assets) ? (json.assets as AnyRecord[]) : [];
  const layerRefs = getLayerRefs(layers);
  const warnings: string[] = [];
  const resolvedData = rewriteLottieImageSources(lottieData, imageDataUrls, imageReplacements);

  const textLayers = layers
    .map((layer, visibleIndex) => {
      if (layer.ty !== 5) {
        return null;
      }

      const document = getTextDocuments(layer)[0];
      if (!document) {
        return null;
      }

      const value = asString(document.t);
      const fontSize = asNumber(document.s, 24);
      const bounds = getTextLayerBounds(layer, document, width, height);

      return {
        id: String(layer.ind ?? layer.nm ?? `text-${visibleIndex}`),
        layerIndex: visibleIndex,
        name: asString(layer.nm, `Text ${visibleIndex + 1}`),
        value,
        originalValue: value,
        bounds,
        fontSize,
        color: toHexColor(document.fc, "#ffffff"),
        align: document.j === 0 ? "left" : document.j === 2 ? "right" : "center",
        transformOrigin: "50% 50%",
        keyframes: {
          position: [makeLinearKeyframe(inPoint, firstVector(layer.ks?.p?.k, [bounds.x, bounds.y, 0]))],
          scale: [makeLinearKeyframe(inPoint, firstVector(layer.ks?.s?.k, [100, 100, 100]))],
          opacity: [makeLinearKeyframe(inPoint, firstNumber(layer.ks?.o?.k, 100))],
        },
      } satisfies EditableTextLayer;
    })
    .filter(Boolean) as EditableTextLayer[];

  const imageAssets = assets
    .filter((asset) => isRecord(asset) && typeof asset.id === "string" && typeof asset.p === "string")
    .map((asset): EditableImageAsset => {
      const originalPath = normalizeAssetPath(asset.u, asset.p);
      const resolvedSource =
        imageReplacements[asset.id] ??
        resolveZippedImage(imageDataUrls, asString(asset.u), asString(asset.p)) ??
        originalPath;

      if (!imageReplacements[asset.id] && !resolveZippedImage(imageDataUrls, asString(asset.u), asString(asset.p))) {
        warnings.push(`未在 ZIP 中找到图片素材：${originalPath}`);
      }

      return {
        id: String(asset.id),
        name: asString(asset.nm, asString(asset.p, String(asset.id))),
        width: asNumber(asset.w, 1),
        height: asNumber(asset.h, 1),
        src: resolvedSource,
        originalPath,
        layerNames: layerRefs.get(String(asset.id)) ?? [],
        fit: "cover",
        replacementDataUrl: imageReplacements[asset.id] ?? null,
      };
    });

  return {
    id: `zip-lottie-${asString(json.nm, "animation")}`,
    name: asString(json.nm, "闪购微动画"),
    source: "lottie",
    zipPath,
    width,
    height,
    fps,
    inPoint,
    outPoint,
    totalFrames,
    duration: totalFrames / fps,
    lottieData: resolvedData,
    aeProbe: null,
    textLayers,
    imageAssets,
    warnings,
  };
}

export function replaceTextDocumentsInLottie(
  lottieData: LottieJSON,
  replacements: Record<string, string>,
  textLayers: EditableTextLayer[],
) {
  const next = cloneLottie(lottieData);
  const json = next as AnyRecord;
  const textLayerMap = new Map(textLayers.map((layer) => [layer.id, layer]));

  collectLayers(json).forEach((layer) => {
    if (layer.ty !== 5) {
      return;
    }

    const layerId = String(layer.ind ?? layer.nm ?? "");
    const value = replacements[layerId] ?? (typeof layer.nm === "string" ? replacements[layer.nm] : undefined);
    const editableLayer = textLayerMap.get(layerId);

    if (typeof value !== "string") {
      return;
    }

    getTextDocuments(layer).forEach((document) => {
      document.t = value;
      document.f = getMotionFontFamily();
      document.sz = document.sz ?? [editableLayer?.bounds.width ?? 0, editableLayer?.bounds.height ?? 0];
      document.lh = document.lh ?? editableLayer?.fontSize ?? document.s;
    });
  });

  return next;
}
