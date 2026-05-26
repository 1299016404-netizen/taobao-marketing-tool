"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRafLoop } from "react-use";
import { AnimationPreview } from "@/components/preview/AnimationPreview";
import { ParameterPanel } from "@/components/editor/ParameterPanel";
import { useAnimationStore } from "@/lib/animationStore";
import { loadAnimationPackage } from "@/lib/lottieAdapter";
import { loadMotionFont } from "@/lib/loadFont";

function LottieEditorTheme() {
  return (
    <style jsx global>{`
      :root {
        --font-interface:
          "SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "PingFang SC",
          "PingFangSCMedium", sans-serif;
        --font-zaozi: var(--font-interface);
      }

      body {
        color: #171920;
        font-family: var(--font-interface);
        background:
          radial-gradient(circle at 18px 18px, rgba(25, 27, 34, 0.11) 1px, transparent 1.4px),
          linear-gradient(180deg, #f2f3f5 0%, #f7f6f4 56%, #f8f5f2 100%);
        background-size: 16px 16px, 100% 100%;
      }

      .checkerboard-dark {
        background-color: #f7f6f4;
        background-image:
          radial-gradient(circle at 1px 1px, rgba(25, 27, 34, 0.16) 1px, transparent 1.5px);
        background-position: -12px 0;
        background-size: 16px 16px;
      }

      .export-stage {
        contain: layout paint style;
        will-change: transform;
      }

      .preview-frame-wrap {
        filter: drop-shadow(0 28px 54px rgba(43, 54, 24, 0.16));
      }

      .timeline-range {
        width: 100%;
        height: 22px;
        appearance: none;
        cursor: pointer;
        background: transparent;
      }

      button,
      input,
      textarea,
      select {
        font-family: var(--font-interface);
      }

      .timeline-range::-webkit-slider-runnable-track {
        height: 8px;
        border: 1px solid rgba(25, 27, 34, 0.08);
        border-radius: 999px;
        background: rgba(25, 27, 34, 0.12);
      }

      .timeline-range::-webkit-slider-thumb {
        width: 18px;
        height: 18px;
        margin-top: -6px;
        appearance: none;
        border: 2px solid #b91942;
        border-radius: 999px;
        background: #b91942;
        box-shadow: 0 0 0 4px rgba(127, 157, 69, 0.16);
      }

      .timeline-range::-moz-range-track {
        height: 8px;
        border: 1px solid rgba(25, 27, 34, 0.08);
        border-radius: 999px;
        background: rgba(25, 27, 34, 0.12);
      }

      .timeline-range::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border: 2px solid #b91942;
        border-radius: 999px;
        background: #b91942;
      }
    `}</style>
  );
}

export function AEAnimationTool() {
  const exportRef = React.useRef<HTMLDivElement | null>(null);
  const lastTimeRef = React.useRef<number | null>(null);
  const frameRemainderRef = React.useRef(0);
  const [importError, setImportError] = React.useState<string | null>(null);
  const isPlaying = useAnimationStore((state) => state.isPlaying);
  const togglePlayback = useAnimationStore((state) => state.togglePlayback);
  const setLoadedPackage = useAnimationStore((state) => state.setLoadedPackage);

  const [stopClock, startClock] = useRafLoop((time) => {
    const state = useAnimationStore.getState();
    if (!state.animation || !state.isPlaying) {
      lastTimeRef.current = time;
      return;
    }

    const lastTime = lastTimeRef.current ?? time;
    const delta = Math.max(0, time - lastTime);
    lastTimeRef.current = time;
    frameRemainderRef.current += (delta / 1000) * state.animation.fps * state.playbackSpeed;

    const step = Math.floor(frameRemainderRef.current);
    if (step <= 0) {
      return;
    }

    frameRemainderRef.current -= step;
    const nextFrame = (state.currentFrame + step) % state.animation.totalFrames;
    state.setCurrentFrame(nextFrame);
  }, false);

  React.useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      await loadMotionFont().catch(() => undefined);
      const { animation: loadedAnimation, packageData } = await loadAnimationPackage();
      if (mounted) {
        setLoadedPackage(loadedAnimation, packageData);
        setImportError(null);
      }
    }

    void bootstrap().catch((error) => {
      if (mounted) {
        setImportError(error instanceof Error ? error.message : "ZIP 动画加载失败");
      }
    });

    return () => {
      mounted = false;
    };
  }, [setLoadedPackage]);

  React.useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = null;
      startClock();
      return;
    }

    stopClock();
  }, [isPlaying, startClock, stopClock]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlayback]);

  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 text-[#171920] sm:px-6 lg:px-8">
      <LottieEditorTheme />
      <div className="mx-auto grid w-full max-w-[1440px] gap-5">
        {importError ? (
          <div className="rounded-md border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {importError}
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]"
        >
          <div className="grid content-start gap-4">
            <ParameterPanel exportRef={exportRef} />
          </div>
          <AnimationPreview exportRef={exportRef} />
        </motion.div>
      </div>
    </main>
  );
}
