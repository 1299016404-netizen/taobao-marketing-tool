import type { EditableTextLayer, LottieJSON } from "@/lib/types";
import { replaceTextDocumentsInLottie } from "@/lib/parseLottie";

export function replaceTextInLottie(
  lottieData: LottieJSON,
  replacements: Record<string, string>,
  textLayers: EditableTextLayer[] = [],
) {
  return replaceTextDocumentsInLottie(lottieData, replacements, textLayers);
}
