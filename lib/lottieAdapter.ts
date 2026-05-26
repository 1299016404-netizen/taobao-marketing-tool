import type { EditableAnimation, LottieJSON } from "@/lib/types";
import {
  parseLottieToEditableAnimation,
  rewriteLottieImageSources,
} from "@/lib/parseLottie";
import {
  DEFAULT_ZIP_PATH,
  unzipLottiePackage,
  type UnzippedLottiePackage,
} from "@/lib/unzipAssets";

export async function loadAnimationPackage(zipPath = DEFAULT_ZIP_PATH): Promise<{
  animation: EditableAnimation;
  packageData: UnzippedLottiePackage;
}> {
  const packageData = await unzipLottiePackage(zipPath);
  const animation = parseLottieToEditableAnimation(packageData.lottieData, {
    zipPath,
    imageDataUrls: packageData.imageDataUrls,
  });

  return {
    animation,
    packageData,
  };
}

export function adaptLottieToEditableAnimation(
  data: LottieJSON,
  packageData?: Pick<UnzippedLottiePackage, "imageDataUrls" | "zipPath"> | null,
) {
  return parseLottieToEditableAnimation(data, {
    zipPath: packageData?.zipPath ?? null,
    imageDataUrls: packageData?.imageDataUrls ?? {},
  });
}

export { rewriteLottieImageSources };
