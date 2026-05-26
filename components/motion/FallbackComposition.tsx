"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FittedText } from "@/components/motion/FittedText";
import type { AnimationAdjustments, EditableAnimation } from "@/lib/types";

type FallbackCompositionProps = {
  animation: EditableAnimation;
  currentFrame: number;
  adjustments: AnimationAdjustments;
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeOutBack(value: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function easeInOut(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function segment(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

export function FallbackComposition({
  animation,
  currentFrame,
  adjustments,
}: FallbackCompositionProps) {
  const progress = animation.totalFrames <= 1 ? 0 : currentFrame / (animation.totalFrames - 1);
  const intro = easeOutBack(segment(progress, 0.02, 0.32));
  const reveal = easeInOut(segment(progress, 0.16, 0.46));
  const shine = segment(progress, 0.28, 0.72);
  const settle = Math.sin(progress * Math.PI * 2) * 1.8;
  const uploadedImage = animation.imageAssets.find((asset) => asset.replacementDataUrl)?.replacementDataUrl;

  return (
    <div
      className="relative overflow-hidden rounded-[18px]"
      style={{
        width: animation.width,
        height: animation.height,
        transform: `translate3d(${adjustments.translateX}px, ${adjustments.translateY}px, 0) scale(${adjustments.scale})`,
        opacity: adjustments.opacity,
        transformOrigin: "50% 50%",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#7a111d_0%,#ff5a2f_42%,#ffd15c_100%)]" />
      <div className="absolute inset-[7px] rounded-[14px] border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.03))]" />
      <div
        className="absolute left-[-40px] top-[28px] h-[170px] w-[220px] rounded-[999px] bg-[#49131a]/35 blur-[24px]"
        style={{ opacity: 0.64 + 0.2 * reveal }}
      />
      <div
        className="absolute right-[-22px] top-[12px] h-[190px] w-[230px] rotate-[-12deg] rounded-[34px] bg-white/18"
        style={{
          transform: `translate3d(${(1 - intro) * 46}px, ${settle}px, 0) rotate(-12deg)`,
        }}
      />
      <div
        className="absolute bottom-[-26px] left-[34px] h-[92px] w-[470px] rounded-[40px] bg-[#fff7c6]/28 blur-[18px]"
        style={{ opacity: reveal }}
      />

      <motion.div
        className="absolute left-[30px] top-[28px] h-[176px] w-[176px] rounded-[34px] bg-[linear-gradient(145deg,rgba(255,255,255,0.34),rgba(255,255,255,0.05))] shadow-[0_24px_54px_rgba(87,18,10,0.25)]"
        style={{
          transform: `translate3d(${(1 - intro) * -34}px, ${(1 - intro) * 16}px, 0) scale(${0.82 + intro * 0.18})`,
          opacity: intro,
        }}
      >
        {uploadedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={uploadedImage}
            alt=""
            className="h-full w-full rounded-[34px] object-cover"
            draggable={false}
          />
        ) : (
          <div className="grid h-full w-full place-items-center rounded-[34px] border border-white/30">
            <span className="font-zaozi text-[64px] leading-none text-white/92">免</span>
          </div>
        )}
      </motion.div>

      <div
        className="absolute left-[82px] top-[24px] h-[190px] w-[420px]"
        style={{
          transform: `translate3d(${(1 - intro) * 28}px, ${(1 - intro) * 10}px, 0) scale(${0.96 + intro * 0.04})`,
          opacity: Math.min(1, intro + 0.05),
          transformOrigin: "50% 50%",
        }}
      >
        {animation.textLayers.map((layer) => (
          <FittedText
            key={layer.id}
            layer={layer}
            className={
              layer.id === "headline"
                ? "drop-shadow-[0_6px_0_rgba(89,22,10,0.18)]"
                : "drop-shadow-[0_2px_8px_rgba(97,23,10,0.18)]"
            }
          />
        ))}
      </div>

      <div
        className="absolute top-0 h-full w-[88px] skew-x-[-18deg] bg-white/28 blur-[4px]"
        style={{
          left: `${-120 + shine * 790}px`,
          opacity: segment(progress, 0.28, 0.38) * (1 - segment(progress, 0.66, 0.76)),
        }}
      />
      <div
        className="absolute bottom-[15px] right-[22px] h-[23px] w-[96px] rounded-full bg-[#4a1012]/18"
        style={{ transform: `scaleX(${0.7 + reveal * 0.3})`, opacity: reveal }}
      />
    </div>
  );
}
