"use client";

import * as React from "react";
import type { TemplateConfig, TemplateId } from "@/lib/types";
import { TaoMainSearchTag } from "@/templates/TaoMainSearchTag";
import { TaoTravelTab } from "@/templates/TaoTravelTab";
import { MiniAppCard } from "@/templates/MiniAppCard";
import { WaistBanner } from "@/templates/WaistBanner";

type PreviewStageProps = {
  activeTemplate: TemplateId;
  config: TemplateConfig;
  exportRef: React.RefObject<HTMLDivElement | null>;
};

export function PreviewStage({
  activeTemplate,
  config,
  exportRef,
}: PreviewStageProps) {
  return (
    <section className="glass-panel relative grid min-h-[560px] w-full min-w-0 overflow-hidden rounded-lg lg:h-full lg:min-h-0">
      <div className="checkerboard grid h-full min-h-0 w-full min-w-0 place-items-center px-6 py-10">
        <div className="grid w-full min-w-0 place-items-center p-10 sm:p-16">
          <div className="grid w-full min-w-0 place-items-center">
            <div className="inline-grid origin-center scale-[2] place-items-center">
              {activeTemplate === "tao-main-search" ? (
                <TaoMainSearchTag
                  ref={exportRef}
                  text={config.text}
                  backgroundColor={config.backgroundColor}
                />
              ) : null}
              {activeTemplate === "tao-travel-tab" ? (
                <TaoTravelTab
                  ref={exportRef}
                  text={config.text}
                  backgroundColor={config.backgroundColor}
                />
              ) : null}
              {activeTemplate === "mini-app" ? (
                <MiniAppCard
                  ref={exportRef}
                  text={config.text}
                  backgroundColor={config.backgroundColor}
                  iconDataUrl={config.miniIconDataUrl}
                />
              ) : null}
              {activeTemplate === "waist-banner" ? (
                <WaistBanner
                  ref={exportRef}
                  text={config.text}
                  backgroundDataUrl={config.waistBackgroundDataUrl}
                  letterSpacing={config.waistLetterSpacing}
                  vip88AssetsVisible={config.vip88AssetsVisible !== false}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
