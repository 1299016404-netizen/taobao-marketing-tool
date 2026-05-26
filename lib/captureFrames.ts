export type FrameCaptureProgress = {
  frame: number;
  totalFrames: number;
  progress: number;
};

export type FrameCaptureOptions = {
  element: HTMLElement;
  totalFrames: number;
  fps: number;
  scale: number;
  renderFrame: (frame: number) => Promise<void> | void;
  onProgress?: (progress: FrameCaptureProgress) => void;
};

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function waitForFonts() {
  if ("fonts" in document) {
    await document.fonts.ready.catch(() => undefined);
  }
}

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      reject(new Error("动画帧渲染超时，请重试导出。"));
    }, 10000);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("无法渲染动画帧。"));
    };
    image.src = url;
  });
}

async function captureLottieSvgToCanvas(element: HTMLElement, scale: number) {
  const lottieContainer = element.querySelector("[data-lottie-preview]") as HTMLElement | null;
  const svg = lottieContainer?.querySelector("svg");

  if (!lottieContainer || !svg) {
    return null;
  }

  const width = Math.max(1, Math.round(element.offsetWidth));
  const height = Math.max(1, Math.round(element.offsetHeight));
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法创建导出画布。");
  }

  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", String(width));
  clonedSvg.setAttribute("height", String(height));

  const serializedSvg = new XMLSerializer().serializeToString(clonedSvg);
  const blobUrl = URL.createObjectURL(
    new Blob([serializedSvg], { type: "image/svg+xml;charset=utf-8" }),
  );

  try {
    const image = await loadImageFromUrl(blobUrl);
    const transformHost = lottieContainer.parentElement as HTMLElement | null;
    const style = transformHost ? window.getComputedStyle(transformHost) : null;
    const opacity = style ? Number.parseFloat(style.opacity || "1") : 1;
    const transform = style?.transform && style.transform !== "none" ? new DOMMatrix(style.transform) : null;
    const originX = width / 2;
    const originY = height / 2;

    context.save();
    context.scale(scale, scale);
    context.globalAlpha = Number.isFinite(opacity) ? opacity : 1;

    if (transform) {
      context.translate(originX, originY);
      context.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
      context.translate(-originX, -originY);
    }

    context.drawImage(image, 0, 0, width, height);
    context.restore();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }

  return canvas;
}

export async function captureElementToCanvas(element: HTMLElement, scale: number) {
  const svgCanvas = await captureLottieSvgToCanvas(element, scale);
  if (svgCanvas) {
    return svgCanvas;
  }

  const { default: html2canvas } = await import("html2canvas");

  return html2canvas(element, {
    backgroundColor: null,
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: element.offsetWidth,
    height: element.offsetHeight,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
  });
}

export async function captureAnimationFrames({
  element,
  totalFrames,
  fps,
  scale,
  renderFrame,
  onProgress,
}: FrameCaptureOptions) {
  const frameCount = Math.max(1, Math.round(totalFrames));
  const delay = Math.max(1, Math.round(1000 / fps));
  const canvases: HTMLCanvasElement[] = [];

  for (let frame = 0; frame < frameCount; frame += 1) {
    await renderFrame(frame);
    await waitForFonts();
    await waitForPaint();
    canvases.push(await captureElementToCanvas(element, scale));
    onProgress?.({
      frame,
      totalFrames: frameCount,
      progress: (frame + 1) / frameCount,
    });
  }

  return {
    canvases,
    delays: Array.from({ length: frameCount }, () => delay),
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
