/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { SmartTextRenderer } from "@/components/templates/SmartTextRenderer";
import {
  DEFAULT_WAIST_BACKGROUND,
  VIP_88_BACKGROUND,
  VIP_88_LEFT_WHEAT,
  VIP_88_RIGHT_WHEAT,
  VIP_88_WORDMARK,
} from "@/lib/waistBackgrounds";

type WaistBannerProps = {
  text: string;
  backgroundDataUrl: string | null;
  letterSpacing: number;
  vip88AssetsVisible?: boolean;
};

export const WaistBanner = React.forwardRef<HTMLDivElement, WaistBannerProps>(
  ({ text, backgroundDataUrl, letterSpacing, vip88AssetsVisible = true }, ref) => {
    const imageSrc = backgroundDataUrl || DEFAULT_WAIST_BACKGROUND;
    const isVip88 = imageSrc === VIP_88_BACKGROUND;
    const showVip88Assets = isVip88 && vip88AssetsVisible;

    return (
      <div
        ref={ref}
        className="export-canvas relative h-[34px] w-[222px] overflow-hidden"
        data-export-template="waist-banner"
      >
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        {isVip88 ? (
          <div className="absolute inset-0 flex items-center justify-center gap-0 text-white">
            {showVip88Assets ? (
              <>
                <img
                  src={VIP_88_LEFT_WHEAT}
                  alt=""
                  className="h-[18px] w-[19px] shrink-0 object-contain"
                  draggable={false}
                />
                <img
                  src={VIP_88_WORDMARK}
                  alt=""
                  className="h-[18px] w-[53px] shrink-0 object-contain"
                  draggable={false}
                />
              </>
            ) : null}
            <SmartTextRenderer
              text={text}
              chineseFont="fliggy"
              className="min-w-0 text-[22px] leading-none text-white"
              fontWeight={500}
              trackingEm={0}
            />
            {showVip88Assets ? (
              <img
                src={VIP_88_RIGHT_WHEAT}
                alt=""
                className="h-[18px] w-[19px] shrink-0 object-contain"
                draggable={false}
              />
            ) : null}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center text-[22px] leading-[140%] text-white">
            <SmartTextRenderer
              text={text}
              chineseFont="fliggy"
              className="text-[22px] leading-[140%] text-white"
              trackingEm={letterSpacing}
            />
          </div>
        )}
      </div>
    );
  },
);
WaistBanner.displayName = "WaistBanner";
