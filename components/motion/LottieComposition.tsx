"use client";

import * as React from "react";
import type { AnimationItem } from "lottie-web";
import type { AnimationAdjustments, EditableAnimation } from "@/lib/types";

type LottieCompositionProps = {
  animation: EditableAnimation;
  currentFrame: number;
  adjustments: AnimationAdjustments;
};

export function LottieComposition({
  animation,
  currentFrame,
  adjustments,
}: LottieCompositionProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const animationRef = React.useRef<AnimationItem | null>(null);
  const currentFrameRef = React.useRef(currentFrame);

  React.useEffect(() => {
    currentFrameRef.current = currentFrame;
  }, [currentFrame]);

  React.useEffect(() => {
    let disposed = false;

    async function mountLottie() {
      if (!containerRef.current || !animation.lottieData) {
        return;
      }

      const { default: lottie } = await import("lottie-web");
      if (disposed || !containerRef.current) {
        return;
      }

      animationRef.current?.destroy();
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: animation.lottieData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: false,
          hideOnTransparent: false,
        },
      });
      animationRef.current.setSubframe(false);
      animationRef.current.goToAndStop(animation.inPoint + currentFrameRef.current, true);
    }

    void mountLottie();

    return () => {
      disposed = true;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [animation.inPoint, animation.lottieData]);

  React.useEffect(() => {
    animationRef.current?.goToAndStop(animation.inPoint + currentFrame, true);
  }, [animation.inPoint, currentFrame]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: animation.width,
        height: animation.height,
        transform: `translate3d(${adjustments.translateX}px, ${adjustments.translateY}px, 0) scale(${adjustments.scale})`,
        opacity: adjustments.opacity,
        transformOrigin: "50% 50%",
      }}
    >
      <div ref={containerRef} className="h-full w-full" data-lottie-preview />
    </div>
  );
}
