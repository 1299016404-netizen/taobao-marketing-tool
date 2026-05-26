"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useAnimationStore } from "@/lib/animationStore";

function formatTime(frame: number, fps: number) {
  return `${(frame / fps).toFixed(2)} 秒`;
}

export function TimelineScrubber() {
  const animation = useAnimationStore((state) => state.animation);
  const currentFrame = useAnimationStore((state) => state.currentFrame);
  const isPlaying = useAnimationStore((state) => state.isPlaying);
  const setCurrentFrame = useAnimationStore((state) => state.setCurrentFrame);
  const togglePlayback = useAnimationStore((state) => state.togglePlayback);
  const restart = useAnimationStore((state) => state.restart);

  const totalFrames = animation?.totalFrames ?? 1;
  const fps = animation?.fps ?? 30;

  return (
    <section className="border-t border-[rgba(20,22,28,0.12)] bg-white/72 px-4 py-3">
      <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={isPlaying ? "暂停" : "播放"}
            onClick={togglePlayback}
            className="grid size-10 place-items-center rounded-[8px] border border-[#b91942] bg-[#b91942] text-white shadow-none transition hover:-translate-y-0.5 hover:bg-[#a11438]"
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            type="button"
            title="重播"
            onClick={restart}
            className="grid size-10 place-items-center rounded-md border border-[rgba(20,22,28,0.14)] bg-white/82 text-[#171920] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <RotateCcw size={17} />
          </button>
        </div>

        <div className="grid gap-2">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalFrames - 1)}
            value={currentFrame}
            onChange={(event) => setCurrentFrame(Number(event.target.value))}
            className="timeline-range"
            aria-label="时间轴"
          />
          <div className="flex items-center justify-between text-[12px] font-medium text-[#3a3d45]">
            <span>第 {currentFrame + 1} 帧</span>
            <span>{formatTime(currentFrame, fps)} / {formatTime(totalFrames, fps)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
