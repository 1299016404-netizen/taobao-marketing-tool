const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export type WaistBackgroundOption = {
  id: string;
  label: string;
  src: string;
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
  },
  {
    id: "limited-subsidy",
    label: "限时补贴",
    src: `${BASE_PATH}/images/waist-banners/limited-subsidy.png`,
  },
  {
    id: "vip-88",
    label: "88VIP",
    src: VIP_88_BACKGROUND,
  },
  {
    id: "bonus-points",
    label: "限时积分加赠",
    src: `${BASE_PATH}/images/waist-banners/bonus-points.png`,
  },
  {
    id: "travel-fund",
    label: "旅行基金",
    src: `${BASE_PATH}/images/waist-banners/travel-fund.png`,
  },
  {
    id: "member-price",
    label: "菲住会员买贵赔",
    src: `${BASE_PATH}/images/waist-banners/member-price.png`,
  },
  {
    id: "government",
    label: "政府部门",
    src: `${BASE_PATH}/images/waist-banners/government.png`,
  },
  {
    id: "tonight-sale",
    label: "今夜甩卖",
    src: `${BASE_PATH}/images/waist-banners/tonight-sale.png`,
  },
  {
    id: "new-user",
    label: "新人特惠",
    src: `${BASE_PATH}/images/waist-banners/new-user.png`,
  },
  {
    id: "exam",
    label: "考试相关",
    src: `${BASE_PATH}/images/waist-banners/exam.png`,
  },
  {
    id: "launch-opening",
    label: "上新开业",
    src: `${BASE_PATH}/images/waist-banners/launch-opening.png`,
  },
  {
    id: "value-pick",
    label: "性价比之选",
    src: `${BASE_PATH}/images/waist-banners/value-pick.png`,
  },
];

export const DEFAULT_WAIST_BACKGROUND = WAIST_BACKGROUND_OPTIONS[0].src;
