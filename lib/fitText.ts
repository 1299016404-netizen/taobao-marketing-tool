import type { LayerBounds } from "@/lib/types";
import type { CSSProperties } from "react";

type FitTextOptions = {
  text: string;
  bounds: LayerBounds;
  baseFontSize: number;
  minScale?: number;
  maxLetterSpacing?: number;
  minLetterSpacing?: number;
};

export type FitTextResult = {
  fontSize: number;
  letterSpacing: number;
  scale: number;
  lineHeight: number;
  transformOrigin: string;
};

const CJK_PATTERN = /[\u2e80-\u9fff\uff00-\uffef]/;

function characterWeight(character: string) {
  if (character.trim() === "") {
    return 0.36;
  }

  if (CJK_PATTERN.test(character)) {
    return 1;
  }

  if (/[0-9]/.test(character)) {
    return 0.62;
  }

  if (/[A-Z]/.test(character)) {
    return 0.68;
  }

  return 0.56;
}

export function estimateTextWidth(text: string, fontSize: number, letterSpacing: number) {
  const characters = Array.from(text || " ");
  const glyphWidth = characters.reduce(
    (total, character) => total + characterWeight(character) * fontSize,
    0,
  );

  return glyphWidth + Math.max(0, characters.length - 1) * letterSpacing;
}

export function getStableTextFit({
  text,
  bounds,
  baseFontSize,
  minScale = 0.48,
  maxLetterSpacing = 1.8,
  minLetterSpacing = -2.6,
}: FitTextOptions): FitTextResult {
  const safeText = text.trim().length > 0 ? text : " ";
  const characterCount = Math.max(1, Array.from(safeText).length);
  const availableWidth = Math.max(1, bounds.width);
  const baseWidth = estimateTextWidth(safeText, baseFontSize, 0);
  const desiredSpacing = (availableWidth - baseWidth) / Math.max(1, characterCount - 1);
  const letterSpacing = Math.min(maxLetterSpacing, Math.max(minLetterSpacing, desiredSpacing));
  const spacedWidth = estimateTextWidth(safeText, baseFontSize, letterSpacing);
  const scale = Math.min(1, Math.max(minScale, availableWidth / Math.max(1, spacedWidth)));
  const verticalScale = Math.min(1, Math.max(minScale, bounds.height / Math.max(1, baseFontSize * 1.15)));

  return {
    fontSize: baseFontSize,
    letterSpacing,
    scale: Math.min(scale, verticalScale),
    lineHeight: Math.min(bounds.height, baseFontSize * 1.08),
    transformOrigin: "50% 50%",
  };
}

export function getFittedTextStyle(options: FitTextOptions): CSSProperties {
  const fit = getStableTextFit(options);

  return {
    fontFamily: "var(--font-zaozi)",
    fontSize: fit.fontSize,
    letterSpacing: fit.letterSpacing,
    lineHeight: `${fit.lineHeight}px`,
    transform: `scale(${fit.scale})`,
    transformOrigin: fit.transformOrigin,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "clip",
    fontSynthesis: "none",
  };
}
