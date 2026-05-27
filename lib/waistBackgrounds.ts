const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export type WaistBackgroundOption = {
  id: string;
  label: string;
  src: string;
  /** 切换到该腰封时用作输入框默认文案（为 undefined 则不覆盖现有文案） */
  defaultText?: string;
};

export const VIP_88_BACKGROUND = `${BASE_PATH}/images/waist-banners/vip-88.png`;
export const VIP_88_LEFT_WHEAT = `${BASE_PATH}/images/waist-assets/left-wheat-custom.png`;
export const VIP_88_RIGHT_WHEAT = `${BASE_PATH}/images/waist-assets/right-wheat.png`;
export const VIP_88_WORDMARK = `${BASE_PATH}/images/waist-assets/88vip-wordmark.png`;

export const WAIST_BACKGROUND_OPTIONS: WaistBackgroundOption[] = [
  {
    id: "general-waist",
    label: "通用腰封",
    src: `${BASE_PATH}/images/waist-banners/general-waist.png`,
    // 通用腰封不覆盖文案
  },
  {
    id: "limited-subsidy",
    label: "限时补贴",
    src: `${BASE_PATH}/images/waist-banners/limited-subsidy.png`,
    defaultText: "限时补贴",
  },
  {
    id: "vip-88",
    label: "88VIP",
    src: VIP_88_BACKGROUND,
    defaultText: "专享特惠",
  },
  {
    id: "bonus-points",
    label: "限时积分加赠",
    src: `${BASE_PATH}/images/waist-banners/bonus-points.png`,
    defaultText: "限时积分加赠",
  },
  {
    id: "travel-fund",
    label: "旅行基金",
    src: `${BASE_PATH}/images/waist-banners/travel-fund.png`,
    defaultText: "旅行基金挑战",
  },
  {
    id: "member-price",
    label: "菲住会员买贵赔",
    src: `${BASE_PATH}/images/waist-banners/member-price.png`,
    defaultText: "菲住会员买贵赔",
  },
  {
    id: "government",
    label: "政府部门",
    src: `${BASE_PATH}/images/waist-banners/government.png`,
    defaultText: "杭州轻松游",
  },
  {
    id: "tonight-sale",
    label: "今夜甩卖",
    src: `${BASE_PATH}/images/waist-banners/tonight-sale.png`,
    defaultText: "今夜甩卖",
  },
  {
    id: "new-user",
    label: "新人特惠",
    src: `${BASE_PATH}/images/waist-banners/new-user.png`,
    defaultText: "新人特惠",
  },
  {
    id: "exam",
    label: "考试相关",
    src: `${BASE_PATH}/images/waist-banners/exam.png`,
    defaultText: "国考精选好房",
  },
  {
    id: "launch-opening",
    label: "上新开业",
    src: `${BASE_PATH}/images/waist-banners/launch-opening.png`,
    defaultText: "飞猪上新",
  },
  {
    id: "value-pick",
    label: "性价比之选",
    src: `${BASE_PATH}/images/waist-banners/value-pick.png`,
    defaultText: "性价比之选",
  },
];

export const DEFAULT_WAIST_BACKGROUND = WAIST_BACKGROUND_OPTIONS[0].src;

/**
 * “自动文案”集：如果当前输入框文案为以下任一项，表示是初始默认值
 * 或上一次切换腰封时被自动填充的，可被下一次切换安全覆盖。
 * 不在集合内的文案被视为“用户手动输入”，切换背景时不覆盖。
 */
export const AUTO_FILLED_WAIST_TEXTS: ReadonlySet<string> = new Set([
  "",
  "春节提前订特惠", // MarketingEditor 初始默认
  ...WAIST_BACKGROUND_OPTIONS.map((o) => o.defaultText).filter(
    (t): t is string => typeof t === "string" && t.length > 0,
  ),
]);
