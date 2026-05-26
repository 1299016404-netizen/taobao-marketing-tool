"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layers3 } from "lucide-react";
import { LottieComposition } from "@/components/motion/LottieComposition";
import { TimelineScrubber } from "@/components/timeline/TimelineScrubber";
import { useAnimationStore } from "@/lib/animationStore";

type AnimationPreviewProps = {
  exportRef: React.RefObject<HTMLDivElement | null>;
};

export function AnimationPreview({ exportRef }: AnimationPreviewProps) {
  const animation = useAnimationStore((state) => state.animation);
  const currentFrame = useAnimationStore((state) => state.currentFrame);
  const adjustments = useAnimationStore((state) => state.adjustments);
  const previewScale = React.useMemo(() => {
    if (!animation) {
      return 1;
    }

    const widthScale = 720 / animation.width;
    const heightScale = 420 / animation.height;
    return Math.max(1, Math.min(5, Math.floor(Math.min(widthScale, heightScale))));
  }, [animation]);

  return (
    <section className="grid min-h-[680px] overflow-hidden rounded-lg border border-[rgba(20,22,28,0.12)] bg-white/72 shadow-[0_28px_80px_rgba(20,22,28,0.1)] lg:grid-rows-[minmax(0,1fr)_auto]">
      <div className="checkerboard-dark grid min-h-[520px] place-items-center overflow-auto p-5">
        <AnimatePresence mode="wait">
          {animation ? (
            <motion.div
              key={animation.id}
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="preview-frame-wrap"
            >
              <div
                className="grid place-items-center"
                style={{
                  width: animation.width * previewScale,
                  height: animation.height * previewScale,
                }}
              >
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: "50% 50%",
                  }}
                >
                  <div
                    ref={exportRef}
                    className="export-stage relative grid place-items-center bg-transparent"
                    style={{
                      width: animation.width,
                      height: animation.height,
                      transform: "translateZ(0)",
                    }}
                  >
                    <LottieComposition
                      animation={animation}
                      currentFrame={currentFrame}
                      adjustments={adjustments}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-3 text-center text-[#3a3d45]"
            >
              <Layers3 className="mx-auto text-[#b91942]" />
              <span className="text-sm font-medium">正在加载动画素材</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TimelineScrubber />
    </section>
  );
}
