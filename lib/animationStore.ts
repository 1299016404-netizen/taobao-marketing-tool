"use client";

import { create } from "zustand";
import type {
  AnimationAdjustments,
  EditableAnimation,
  ExportScale,
  ExportState,
} from "@/lib/types";
import { replaceTextInLottie } from "@/lib/replaceText";
import { fitImageToAssetDataUrl, replaceImageAssetInLottie } from "@/lib/replaceImage";
import type { UnzippedLottiePackage } from "@/lib/unzipAssets";

type AnimationStore = {
  animation: EditableAnimation | null;
  animationPackage: UnzippedLottiePackage | null;
  currentFrame: number;
  isPlaying: boolean;
  playbackSpeed: number;
  exportScale: ExportScale;
  adjustments: AnimationAdjustments;
  textValues: Record<string, string>;
  imageReplacements: Record<string, string>;
  exportState: ExportState;
  setAnimation: (animation: EditableAnimation) => void;
  setLoadedPackage: (animation: EditableAnimation, animationPackage: UnzippedLottiePackage) => void;
  setCurrentFrame: (frame: number) => void;
  togglePlayback: () => void;
  setPlaying: (playing: boolean) => void;
  restart: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setExportScale: (scale: ExportScale) => void;
  setAdjustment: (patch: Partial<AnimationAdjustments>) => void;
  setTextLayerValue: (layerId: string, value: string) => void;
  setImageReplacement: (assetId: string, dataUrl: string) => Promise<void>;
  setExportState: (patch: Partial<ExportState>) => void;
};

const idleExportState: ExportState = {
  phase: "idle",
  format: null,
  progress: 0,
  message: "",
};

function clampFrame(frame: number, totalFrames: number) {
  return Math.max(0, Math.min(Math.max(0, totalFrames - 1), Math.round(frame)));
}

export const useAnimationStore = create<AnimationStore>((set, get) => ({
  animation: null,
  animationPackage: null,
  currentFrame: 0,
  isPlaying: true,
  playbackSpeed: 1,
  exportScale: 1,
  adjustments: {
    translateX: 0,
    translateY: 0,
    scale: 1,
    opacity: 1,
  },
  textValues: {},
  imageReplacements: {},
  exportState: idleExportState,
  setAnimation: (animation) =>
    set({
      animation,
      animationPackage: null,
      currentFrame: 0,
      isPlaying: true,
      textValues: Object.fromEntries(animation.textLayers.map((layer) => [layer.id, layer.value])),
      imageReplacements: {},
      exportState: idleExportState,
    }),
  setLoadedPackage: (animation, animationPackage) =>
    set({
      animation,
      animationPackage,
      currentFrame: 0,
      isPlaying: true,
      textValues: Object.fromEntries(animation.textLayers.map((layer) => [layer.id, layer.value])),
      imageReplacements: Object.fromEntries(
        animation.imageAssets
          .filter((asset) => asset.replacementDataUrl)
          .map((asset) => [asset.id, asset.replacementDataUrl as string]),
      ),
      exportState: idleExportState,
    }),
  setCurrentFrame: (frame) => {
    const totalFrames = get().animation?.totalFrames ?? 1;
    set({ currentFrame: clampFrame(frame, totalFrames) });
  },
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  restart: () => set({ currentFrame: 0, isPlaying: true }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: Math.max(0.1, Math.min(3, speed)) }),
  setExportScale: (scale) => set({ exportScale: scale }),
  setAdjustment: (patch) =>
    set((state) => ({
      adjustments: {
        ...state.adjustments,
        ...patch,
      },
    })),
  setTextLayerValue: (layerId, value) =>
    set((state) => {
      if (!state.animation) {
        return state;
      }

      const textLayers = state.animation.textLayers.map((layer) =>
        layer.id === layerId ? { ...layer, value } : layer,
      );
      const lottieData = state.animation.lottieData
        ? replaceTextInLottie(state.animation.lottieData, { [layerId]: value }, textLayers)
        : null;

      return {
        animation: {
          ...state.animation,
          lottieData,
          textLayers,
        },
        textValues: {
          ...state.textValues,
          [layerId]: value,
        },
      };
    }),
  setImageReplacement: async (assetId, dataUrl) => {
    const animation = get().animation;
    const asset = animation?.imageAssets.find((imageAsset) => imageAsset.id === assetId);

    if (!animation || !asset) {
      return;
    }

    const fittedDataUrl = await fitImageToAssetDataUrl(dataUrl, asset.width, asset.height);

    set((state) => {
      if (!state.animation || !state.animation.imageAssets.some((imageAsset) => imageAsset.id === assetId)) {
        return state;
      }

      const imageAssets = state.animation.imageAssets.map((imageAsset) =>
        imageAsset.id === assetId
          ? {
              ...imageAsset,
              replacementDataUrl: fittedDataUrl,
              src: fittedDataUrl,
            }
          : imageAsset,
      );
      const lottieData = state.animation.lottieData
        ? replaceImageAssetInLottie(state.animation.lottieData, assetId, fittedDataUrl)
        : null;

      return {
        animation: {
          ...state.animation,
          lottieData,
          imageAssets,
        },
        imageReplacements: {
          ...state.imageReplacements,
          [assetId]: fittedDataUrl,
        },
      };
    });
  },
  setExportState: (patch) =>
    set((state) => ({
      exportState: {
        ...state.exportState,
        ...patch,
      },
    })),
}));
