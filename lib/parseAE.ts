import type { AEProbe } from "@/lib/types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const IMAGE_RE = /[^"'\n\r\t{}<>|]+?\.(?:png|jpe?g|webp|psd|ai)/gi;
const EFFECT_RE = /ADBE\s+[A-Za-z0-9 _-]+/g;

function toAsciiText(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let output = "";
  let run = "";

  for (const byte of bytes) {
    if (byte >= 32 && byte <= 126) {
      run += String.fromCharCode(byte);
      continue;
    }

    if (run.length >= 3) {
      output += `${run}\n`;
    }
    run = "";
  }

  if (run.length >= 3) {
    output += `${run}\n`;
  }

  return output;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function cleanAssetName(value: string) {
  const normalized = value.replace(/\\/g, "/").trim();
  const name = normalized.split("/").pop() ?? normalized;
  return name.replace(/^[^A-Za-z0-9\u4e00-\u9fff_. ()-]+/, "").trim();
}

function countMatches(text: string, pattern: string) {
  return text.split(pattern).length - 1;
}

export async function probeAEFile(sourcePath = `${BASE_PATH}/assets/抽免单.aep`): Promise<AEProbe> {
  const response = await fetch(sourcePath, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`无法读取 AE 工程：${sourcePath}`);
  }

  const buffer = await response.arrayBuffer();
  const ascii = toAsciiText(buffer);
  const riffSignature = ascii.slice(0, 4);
  const images = unique(
    Array.from(ascii.matchAll(IMAGE_RE))
      .map((match) => cleanAssetName(match[0]))
      .filter((name) => /\.(?:png|jpe?g|webp|psd|ai)$/i.test(name)),
  ).slice(0, 80);
  const effects = unique(
    Array.from(ascii.matchAll(EFFECT_RE))
      .map((match) => match[0].replace("ADBE", "").trim())
      .filter((name) => name.length > 2 && !name.includes("Group End")),
  ).slice(0, 32);

  return {
    sourcePath,
    fileSize: buffer.byteLength,
    riffSignature,
    textLayerCount: countMatches(ascii, "ADBE Text Document"),
    transformGroupCount: countMatches(ascii, "ADBE Transform Group"),
    keyframeHintCount: countMatches(ascii, "otkyotda") + countMatches(ascii, "tdmn"),
    imageAssetNames: images,
    effectNames: effects,
    warnings: [
      ".aep 是 Adobe 私有二进制格式，浏览器无法完整解码关键帧数值。",
      "本工具会探测 AEP 图层线索；高精度 1:1 渲染请放入 Bodymovin 导出的同名 Lottie JSON。",
    ],
  };
}
