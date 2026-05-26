"use client";

import * as React from "react";
import { toast } from "sonner";
import { ExportPanel } from "@/components/export/ExportPanel";
import { AssetDropzone } from "@/components/upload/AssetDropzone";
import { useAnimationStore } from "@/lib/animationStore";

type ParameterPanelProps = {
  exportRef: React.RefObject<HTMLDivElement | null>;
};

export function ParameterPanel({ exportRef }: ParameterPanelProps) {
  const animation = useAnimationStore((state) => state.animation);
  const setImageReplacement = useAnimationStore((state) => state.setImageReplacement);

  return (
    <aside className="grid content-start gap-4">
      {animation?.imageAssets.length ? (
        <section className="grid gap-3 rounded-lg border border-[rgba(20,22,28,0.12)] bg-white/72 p-4">
          <div className="grid gap-3">
            {animation.imageAssets.map((asset, index) => (
              <AssetDropzone
                key={asset.id}
                label={`素材 ${String(index + 1).padStart(2, "0")}`}
                meta={`${asset.width}×${asset.height}`}
                previewSrc={asset.src}
                onChange={(dataUrl) => {
                  void setImageReplacement(asset.id, dataUrl).catch((error) => {
                    toast.error(error instanceof Error ? error.message : "图片替换失败");
                  });
                }}
              />
            ))}
            <ExportPanel exportRef={exportRef} variant="inline" />
          </div>
        </section>
      ) : null}
    </aside>
  );
}
