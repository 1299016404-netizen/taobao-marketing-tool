export type TemplateId =
  | "tao-main-search"
  | "tao-travel-tab"
  | "mini-app"
  | "waist-banner";

export type PixelRatio = 2 | 3;

export type TemplateConfig = {
  text: string;
  backgroundColor: string;
  miniIconDataUrl: string | null;
  waistBackgroundDataUrl: string | null;
  waistLetterSpacing: number;
  vip88AssetsVisible?: boolean;
  pixelRatio: PixelRatio;
};

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  shortName: string;
  figmaNode: string;
  exportSize: string;
};

export const TEMPLATE_META: TemplateMeta[] = [
  {
    id: "waist-banner",
    name: "腰封设计",
    description: "选择背景并控制字间距",
    shortName: "腰封",
    figmaNode: "1125:35275",
    exportSize: "222 × 34",
  },
  {
    id: "tao-main-search",
    name: "淘主搜常规标",
    description: "透明底自适应宽度标签",
    shortName: "主搜",
    figmaNode: "1125:35273",
    exportSize: "自适应宽度 × 32",
  },
  {
    id: "tao-travel-tab",
    name: "淘旅行标签",
    description: "含上下透明留白的标签",
    shortName: "旅行",
    figmaNode: "1125:35274",
    exportSize: "自适应宽度 × 52",
  },
  {
    id: "mini-app",
    name: "淘 / 支 / 微轻应用",
    description: "左侧文案渐变右侧营销图标",
    shortName: "轻应用",
    figmaNode: "1125:35272",
    exportSize: "292 × 58",
  },
];

export const DEFAULT_CONFIG: TemplateConfig = {
  text: "东京5天4晚",
  backgroundColor: "#FF3D00",
  miniIconDataUrl: null,
  waistBackgroundDataUrl: null,
  waistLetterSpacing: 0.09,
  pixelRatio: 3,
};

export type ExportScale = 1;

export type ExportFormat = "gif" | "apng";

export type ExportPhase =
  | "idle"
  | "capturing"
  | "encoding"
  | "finalizing"
  | "done"
  | "error";

export type ExportState = {
  phase: ExportPhase;
  format: ExportFormat | null;
  progress: number;
  message: string;
};

export type EasingCurve = {
  type: "linear" | "hold" | "bezier";
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

export type MotionKeyframe<TValue = number | number[]> = {
  frame: number;
  value: TValue;
  easing: EasingCurve;
};

export type LayerBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EditableTextLayer = {
  id: string;
  layerIndex: number;
  name: string;
  value: string;
  originalValue: string;
  bounds: LayerBounds;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  transformOrigin: string;
  keyframes: {
    position: MotionKeyframe<number[]>[];
    scale: MotionKeyframe<number[]>[];
    opacity: MotionKeyframe<number>[];
  };
};

export type EditableImageAsset = {
  id: string;
  name: string;
  width: number;
  height: number;
  src: string | null;
  originalPath: string;
  layerNames: string[];
  fit: "cover" | "contain";
  replacementDataUrl: string | null;
};

export type AEProbe = {
  sourcePath: string;
  fileSize: number;
  riffSignature: string;
  textLayerCount: number;
  transformGroupCount: number;
  keyframeHintCount: number;
  imageAssetNames: string[];
  effectNames: string[];
  warnings: string[];
};

export type LottieJSON = Record<string, unknown>;

export type AnimationSource = "lottie" | "aep-probe" | "fallback";

export type EditableAnimation = {
  id: string;
  name: string;
  source: AnimationSource;
  zipPath: string | null;
  width: number;
  height: number;
  fps: number;
  inPoint: number;
  outPoint: number;
  totalFrames: number;
  duration: number;
  lottieData: LottieJSON | null;
  aeProbe: AEProbe | null;
  textLayers: EditableTextLayer[];
  imageAssets: EditableImageAsset[];
  warnings: string[];
};

export type AnimationAdjustments = {
  translateX: number;
  translateY: number;
  scale: number;
  opacity: number;
};
