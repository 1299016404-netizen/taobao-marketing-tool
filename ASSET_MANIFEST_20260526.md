# 素材清单

更新时间：2026-05-26

## 字体

- `public/fonts/FliggyFont-Medium.ttf`
- `public/fonts/FliggySans102-Md.ttf`
- `public/fonts/FliggySans102-Rg.ttf`
- `public/fonts/PingFang-SC-Bold.ttf`
- `public/fonts/ZaoZiGongFangYuanHeiTi-2.ttf`

## 腰封背景

- `public/images/waist-banners/general-waist.png`：通用腰封
- `public/images/waist-banners/limited-subsidy.png`：限时补贴
- `public/images/waist-banners/vip-88.png`：88VIP
- `public/images/waist-banners/bonus-points.png`：限时积分加赠
- `public/images/waist-banners/travel-fund.png`：旅行基金
- `public/images/waist-banners/member-price.png`：菲住会员买贵赔
- `public/images/waist-banners/government.png`：政府部门
- `public/images/waist-banners/tonight-sale.png`：今夜甩卖
- `public/images/waist-banners/new-user.png`：新人特惠
- `public/images/waist-banners/exam.png`：考试相关
- `public/images/waist-banners/launch-opening.png`：上新开业
- `public/images/waist-banners/value-pick.png`：性价比之选

## 88VIP 固定图形

- `public/images/waist-assets/left-wheat-custom.png`：当前使用的左侧麦穗
- `public/images/waist-assets/left-wheat.png`：历史左侧麦穗备份
- `public/images/waist-assets/right-wheat.png`：右侧麦穗
- `public/images/waist-assets/88vip-wordmark.png`：88VIP 字样

## 其他图片

- `public/images/mini-app-marketing-icon.png`：轻应用右侧营销图标
- `public/images/waist-banner-bg.png`：历史腰封背景

## 动效和导出依赖素材

- `public/assets/抽免单.aep`
- `public/assets/闪购微动画.zip`
- `public/ffmpeg/ffmpeg-core.js`
- `public/ffmpeg/ffmpeg-core.wasm`
- `public/gif.worker.js`

## 源码调用入口

- 腰封背景配置：`lib/waistBackgrounds.ts`
- 腰封渲染模板：`templates/WaistBanner.tsx`
- 左侧控制面板：`components/editor/ControlPanel.tsx`
- 导出逻辑：`lib/exportPNG.ts`
