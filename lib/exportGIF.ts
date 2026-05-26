import { captureAnimationFrames, downloadBlob, type FrameCaptureOptions } from "@/lib/captureFrames";

type GIFConstructor = new (options: {
  workers?: number;
  quality?: number;
  transparent?: string | number | null;
  workerScript?: string;
  width?: number;
  height?: number;
}) => {
  addFrame: (canvas: HTMLCanvasElement, options: { delay: number; copy: boolean }) => void;
  on: (event: "finished" | "progress", callback: (value: Blob | number) => void) => void;
  render: () => void;
};

export type ExportGIFOptions = FrameCaptureOptions & {
  filename?: string;
  quality?: number;
};

let ffmpegPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function loadGifConstructor() {
  const gifModule = await import("gif.js");
  return ((gifModule as { default?: GIFConstructor }).default ?? gifModule) as GIFConstructor;
}

function canvasToPngBytes(canvas: HTMLCanvasElement) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("无法从画布生成 PNG 帧。"));
        return;
      }

      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, "image/png");
  });
}

async function getFFmpeg() {
  if (ffmpegPromise) {
    return ffmpegPromise;
  }

  ffmpegPromise = (async () => {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);
    const ffmpeg = new FFmpeg();
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const coreURL = await toBlobURL(`${basePath}/ffmpeg/ffmpeg-core.js`, "text/javascript");
    const wasmURL = await toBlobURL(`${basePath}/ffmpeg/ffmpeg-core.wasm`, "application/wasm");
    await ffmpeg.load({ coreURL, wasmURL });
    return ffmpeg;
  })().catch((error) => {
    ffmpegPromise = null;
    throw error;
  });

  return ffmpegPromise;
}

async function encodeWithFFmpeg(canvases: HTMLCanvasElement[], fps: number) {
  const ffmpeg = await getFFmpeg();
  const outputName = "output.gif";
  const frameNames = canvases.map((_, index) => `frame_${String(index).padStart(4, "0")}.png`);

  await Promise.all(
    canvases.map(async (canvas, index) => {
      await ffmpeg.writeFile(frameNames[index], await canvasToPngBytes(canvas));
    }),
  );

  const result = await ffmpeg.exec([
    "-framerate",
    String(fps),
    "-i",
    "frame_%04d.png",
    "-vf",
    "split[s0][s1];[s0]palettegen=reserve_transparent=on:stats_mode=full[p];[s1][p]paletteuse=dither=sierra2_4a:alpha_threshold=128",
    "-loop",
    "0",
    outputName,
  ]);

  if (result !== 0) {
    throw new Error("ffmpeg.wasm GIF 编码失败。");
  }

  const data = await ffmpeg.readFile(outputName);
  await Promise.allSettled([...frameNames, outputName].map((name) => ffmpeg.deleteFile(name)));

  if (typeof data === "string") {
    return new Blob([data], { type: "image/gif" });
  }

  const outputBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(outputBuffer).set(data);

  return new Blob([outputBuffer], { type: "image/gif" });
}

async function encodeWithGifJs(
  canvases: HTMLCanvasElement[],
  delays: number[],
  quality: number,
) {
  const GIF = await loadGifConstructor();
  const encoder = new GIF({
    workers: 2,
    quality,
    transparent: null,
    workerScript: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/gif.worker.js`,
  });

  canvases.forEach((canvas, index) => {
    encoder.addFrame(canvas, {
      delay: delays[index] ?? 50,
      copy: true,
    });
  });

  return new Promise<Blob>((resolve, reject) => {
    encoder.on("finished", (value) => {
      if (value instanceof Blob) {
        resolve(value);
        return;
      }
      reject(new Error("GIF 编码器没有返回 Blob。"));
    });
    encoder.render();
  });
}

export async function warmupFFmpegWasm() {
  return getFFmpeg();
}

export async function exportGIF({
  element,
  totalFrames,
  fps,
  scale,
  renderFrame,
  onProgress,
  filename = "lottie-animation.gif",
  quality = 8,
}: ExportGIFOptions) {
  const { canvases, delays } = await captureAnimationFrames({
    element,
    totalFrames,
    fps,
    scale,
    renderFrame,
    onProgress,
  });

  let blob: Blob;

  try {
    blob = await encodeWithFFmpeg(canvases, fps);
  } catch (error) {
    console.warn("ffmpeg.wasm GIF export failed, falling back to gif.js", error);
    blob = await encodeWithGifJs(canvases, delays, quality);
  }

  downloadBlob(blob, filename);
  return blob;
}
