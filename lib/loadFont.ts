const FONT_FAMILY = "SF Pro Text";
const FONT_PATH = "";

let fontPromise: Promise<void> | null = null;

export function getMotionFontFamily() {
  return FONT_FAMILY;
}

export function getMotionFontPath() {
  return FONT_PATH;
}

export async function loadMotionFont() {
  if (typeof window === "undefined" || !("fonts" in document)) {
    return;
  }

  fontPromise ??= document.fonts.ready.then(() => undefined);
  await fontPromise;
}
