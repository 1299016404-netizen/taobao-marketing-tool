import { captureAnimationFrames, downloadBlob, type FrameCaptureOptions } from "@/lib/captureFrames";

type PakoModule = {
  deflate: (data: Uint8Array, options?: { level?: number }) => Uint8Array;
};

type Bytes = Uint8Array<ArrayBufferLike>;
type FrameRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExportAPNGOptions = FrameCaptureOptions & {
  filename?: string;
  loopCount?: number;
};

const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const minTargetBytes = 290 * 1024;
const paddedTargetBytes = 295 * 1024;
const maxTargetBytes = 300 * 1024;
const pngCrcTable = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  pngCrcTable[index] = value >>> 0;
}

function writeUint16(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >>> 8) & 255;
  bytes[offset + 1] = value & 255;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >>> 24) & 255;
  bytes[offset + 1] = (value >>> 16) & 255;
  bytes[offset + 2] = (value >>> 8) & 255;
  bytes[offset + 3] = value & 255;
}

function crc32(bytes: Uint8Array, offset: number, length: number) {
  let crc = 0xffffffff;
  for (let index = offset; index < offset + length; index += 1) {
    crc = pngCrcTable[(crc ^ bytes[index]) & 255] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Bytes = new Uint8Array()) {
  const chunk = new Uint8Array(12 + data.byteLength);
  const typeOffset = 4;
  writeUint32(chunk, 0, data.byteLength);

  for (let index = 0; index < 4; index += 1) {
    chunk[typeOffset + index] = type.charCodeAt(index);
  }

  chunk.set(data, 8);
  writeUint32(chunk, 8 + data.byteLength, crc32(chunk, typeOffset, 4 + data.byteLength));
  return chunk;
}

function getChunk(buffer: Bytes, chunkName: string) {
  let offset = pngSignature.byteLength;

  while (offset + 12 <= buffer.byteLength) {
    const length =
      ((buffer[offset] << 24) |
        (buffer[offset + 1] << 16) |
        (buffer[offset + 2] << 8) |
        buffer[offset + 3]) >>>
      0;
    const type = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7],
    );

    if (type === chunkName) {
      return {
        dataOffset: offset + 8,
        length,
        start: offset,
      };
    }

    offset += 12 + length;
  }

  return null;
}

function concatBytes(parts: Bytes[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.byteLength;
  });

  return output;
}

function makeIhdrChunk(width: number, height: number) {
  const data = new Uint8Array(13);
  writeUint32(data, 0, width);
  writeUint32(data, 4, height);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return makeChunk("IHDR", data);
}

function makeActlChunk(frameCount: number, loopCount: number) {
  const data = new Uint8Array(8);
  writeUint32(data, 0, frameCount);
  writeUint32(data, 4, Math.max(0, Math.round(loopCount)));
  return makeChunk("acTL", data);
}

function makeFctlChunk({
  sequence,
  rect,
  delay,
}: {
  sequence: number;
  rect: FrameRect;
  delay: number;
}) {
  const data = new Uint8Array(26);
  writeUint32(data, 0, sequence);
  writeUint32(data, 4, rect.width);
  writeUint32(data, 8, rect.height);
  writeUint32(data, 12, rect.x);
  writeUint32(data, 16, rect.y);
  writeUint16(data, 20, Math.max(1, Math.round(delay)));
  writeUint16(data, 22, 1000);
  data[24] = 0;
  data[25] = 0;
  return makeChunk("fcTL", data);
}

function makeFdatChunk(sequence: number, compressedFrame: Bytes) {
  const data = new Uint8Array(4 + compressedFrame.byteLength);
  writeUint32(data, 0, sequence);
  data.set(compressedFrame, 4);
  return makeChunk("fdAT", data);
}

function canvasToRgba(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("无法读取导出画布。");
  }

  return context.getImageData(0, 0, canvas.width, canvas.height).data;
}

function getFrameDiffRect(
  previous: Uint8ClampedArray | null,
  current: Uint8ClampedArray,
  width: number,
  height: number,
): FrameRect {
  if (!previous) {
    return {
      x: 0,
      y: 0,
      width,
      height,
    };
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (
        previous[offset] !== current[offset] ||
        previous[offset + 1] !== current[offset + 1] ||
        previous[offset + 2] !== current[offset + 2] ||
        previous[offset + 3] !== current[offset + 3]
      ) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    return {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function rgbaToPngScanlines(
  rgba: Uint8ClampedArray,
  canvasWidth: number,
  canvasHeight: number,
  rect: FrameRect,
) {
  const safeX = Math.max(0, Math.min(canvasWidth - 1, rect.x));
  const safeY = Math.max(0, Math.min(canvasHeight - 1, rect.y));
  const safeRect = {
    x: safeX,
    y: safeY,
    width: Math.max(1, Math.min(canvasWidth - safeX, rect.width)),
    height: Math.max(1, Math.min(canvasHeight - safeY, rect.height)),
  };
  const rowSize = safeRect.width * 4;
  const scanlines = new Uint8Array((rowSize + 1) * safeRect.height);

  for (let row = 0; row < safeRect.height; row += 1) {
    const targetStart = row * (rowSize + 1);
    scanlines[targetStart] = 0;

    for (let column = 0; column < safeRect.width; column += 1) {
      const sourceStart = ((safeRect.y + row) * canvasWidth + safeRect.x + column) * 4;
      const targetPixel = targetStart + 1 + column * 4;
      scanlines[targetPixel] = rgba[sourceStart];
      scanlines[targetPixel + 1] = rgba[sourceStart + 1];
      scanlines[targetPixel + 2] = rgba[sourceStart + 2];
      scanlines[targetPixel + 3] = rgba[sourceStart + 3];
    }
  }

  return scanlines;
}

function hasChunk(buffer: Bytes, chunkName: string) {
  return Boolean(getChunk(buffer, chunkName));
}

function applyApngLoopCount(buffer: Bytes, loopCount: number) {
  const chunk = getChunk(buffer, "acTL");
  if (!chunk || chunk.length !== 8) {
    throw new Error("动图编码失败：导出文件缺少循环控制信息。");
  }

  writeUint32(buffer as Uint8Array, chunk.dataOffset + 4, Math.max(0, Math.round(loopCount)));
  writeUint32(buffer as Uint8Array, chunk.start + 16, crc32(buffer as Uint8Array, chunk.start + 4, 12));
}

function padPngToTargetRange(buffer: Bytes) {
  if (buffer.byteLength > maxTargetBytes) {
    throw new Error("无损导出的文件已超过 300KB，无法在不损失清晰度的情况下继续压缩。");
  }

  if (buffer.byteLength >= minTargetBytes) {
    return buffer;
  }

  const iend = getChunk(buffer, "IEND");
  if (!iend) {
    throw new Error("动图编码失败：导出文件缺少结束信息。");
  }

  const paddingBytes = Math.max(0, paddedTargetBytes - buffer.byteLength - 12);
  if (paddingBytes <= 0) {
    return buffer;
  }

  return concatBytes([
    buffer.subarray(0, iend.start),
    makeChunk("npTc", new Uint8Array(paddingBytes)),
    buffer.subarray(iend.start),
  ]);
}

async function loadPako() {
  const pakoModule = await import("pako");
  return ((pakoModule as { default?: PakoModule }).default ?? pakoModule) as PakoModule;
}

async function encodeDiffApng(canvases: HTMLCanvasElement[], delays: number[], loopCount: number) {
  const firstCanvas = canvases[0];
  if (!firstCanvas || canvases.length <= 1) {
    throw new Error("动画帧数不足，无法生成可播放动图。");
  }

  const pako = await loadPako();
  const chunks: Bytes[] = [
    pngSignature,
    makeIhdrChunk(firstCanvas.width, firstCanvas.height),
    makeActlChunk(canvases.length, loopCount),
  ];
  let sequence = 0;
  let previousFrame: Uint8ClampedArray | null = null;

  canvases.forEach((canvas, index) => {
    if (canvas.width !== firstCanvas.width || canvas.height !== firstCanvas.height) {
      throw new Error("动画帧尺寸不一致，无法导出动图。");
    }

    const currentFrame = canvasToRgba(canvas);
    const rect = getFrameDiffRect(previousFrame, currentFrame, canvas.width, canvas.height);
    const scanlines = rgbaToPngScanlines(currentFrame, canvas.width, canvas.height, rect);
    const compressedFrame = pako.deflate(scanlines, { level: 9 });
    const delay = delays[index] ?? Math.max(1, Math.round(1000 / 20));

    chunks.push(
      makeFctlChunk({
        sequence,
        rect,
        delay,
      }),
    );
    sequence += 1;

    if (index === 0) {
      chunks.push(makeChunk("IDAT", compressedFrame));
    } else {
      chunks.push(makeFdatChunk(sequence, compressedFrame));
      sequence += 1;
    }

    previousFrame = currentFrame;
  });

  chunks.push(makeChunk("IEND"));

  const output = concatBytes(chunks);
  applyApngLoopCount(output, loopCount);

  if (!hasChunk(output, "acTL") || !hasChunk(output, "fcTL") || !hasChunk(output, "fdAT")) {
    throw new Error("动图编码失败：导出文件缺少动画帧信息。");
  }

  return padPngToTargetRange(output);
}

async function encodeFullFrameApng(
  canvases: HTMLCanvasElement[],
  delays: number[],
  fps: number,
  loopCount: number,
) {
  const firstCanvas = canvases[0];
  if (!firstCanvas || canvases.length <= 1) {
    throw new Error("动画帧数不足，无法生成可播放动图。");
  }

  const pako = await loadPako();
  const chunks: Bytes[] = [
    pngSignature,
    makeIhdrChunk(firstCanvas.width, firstCanvas.height),
    makeActlChunk(canvases.length, loopCount),
  ];
  let sequence = 0;

  canvases.forEach((canvas, index) => {
    if (canvas.width !== firstCanvas.width || canvas.height !== firstCanvas.height) {
      throw new Error("动画帧尺寸不一致，无法导出动图。");
    }

    const rect = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    };
    const scanlines = rgbaToPngScanlines(canvasToRgba(canvas), canvas.width, canvas.height, rect);
    const compressedFrame = pako.deflate(scanlines, { level: 6 });
    const delay = delays[index] ?? Math.max(1, Math.round(1000 / fps));

    chunks.push(
      makeFctlChunk({
        sequence,
        rect,
        delay,
      }),
    );
    sequence += 1;

    if (index === 0) {
      chunks.push(makeChunk("IDAT", compressedFrame));
      return;
    }

    chunks.push(makeFdatChunk(sequence, compressedFrame));
    sequence += 1;
  });

  chunks.push(makeChunk("IEND"));

  const output = concatBytes(chunks);
  if (!hasChunk(output, "acTL") || !hasChunk(output, "fcTL") || !hasChunk(output, "fdAT")) {
    throw new Error("动图编码失败：导出文件缺少动画帧信息。");
  }

  return output;
}

export async function exportAPNG({
  element,
  totalFrames,
  fps,
  scale,
  renderFrame,
  onProgress,
  filename = "lottie-animation.png",
  loopCount = 3,
}: ExportAPNGOptions) {
  const { canvases, delays } = await captureAnimationFrames({
    element,
    totalFrames,
    fps,
    scale,
    renderFrame,
    onProgress,
  });

  let output: Bytes;

  try {
    output = await encodeDiffApng(canvases, delays, loopCount);
  } catch (error) {
    console.warn("APNG diff export failed, falling back to full-frame encoder", error);
    output = await encodeFullFrameApng(canvases, delays, fps, loopCount);
  }

  if (output.byteLength > maxTargetBytes) {
    throw new Error("无损导出的文件已超过 300KB，无法在不损失清晰度的情况下继续压缩。");
  }

  const blobBuffer = new ArrayBuffer(output.byteLength);
  new Uint8Array(blobBuffer).set(output);
  const blob = new Blob([blobBuffer], { type: "image/png" });
  downloadBlob(blob, filename);
  return blob;
}
