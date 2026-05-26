# 淘宝飞猪营销切图工具交接说明

更新时间：2026-05-26

## 当前可用状态

- 项目类型：Next.js 15 + React 19 + Tailwind CSS。
- 当前本地预览：`http://127.0.0.1:3002/`。
- 主要页面入口：`app/page.tsx`。
- 主工具入口：`components/editor/MarketingEditor.tsx`。
- 左侧配置面板：`components/editor/ControlPanel.tsx`。
- 右侧预览画布：`components/preview/PreviewStage.tsx`。

## 运行方式

```bash
npm install
npm run dev -- -p 3002
```

浏览器打开：

```text
http://127.0.0.1:3002/
```

生产构建：

```bash
npm run build
npm run start
```

## 当前模块

1. 淘主搜常规标
2. 淘旅行标签
3. 淘 / 支 / 微轻应用
4. 腰封设计

## 最新交互和样式要求

- 页面是浅色工具台风格。
- 模块卡片副标题已保留。
- 控制面板底部按钮为“上传阿里图库”。
- 腰封设计使用固定背景列表，不再提供上传背景入口。
- 腰封区标题文案为“⚠️ 腰封严格根据场景使用”。
- 腰封字间距支持最低 `-10%`。
- 腰封输入字数自动调整字间距：
  - 4 字：20%
  - 5 字：12%
  - 6 字：8%
  - 7 字：4%
  - 8 字：0%
  - 9 字：-4%
- 88VIP 腰封位于背景列表第 3 个。
- 88VIP 默认文案为“专享特惠”。
- 88VIP 支持切换：
  - “图形文字”：显示左麦穗、88VIP 字样、输入文案、右麦穗。
  - “只有文字”：隐藏左右麦穗和 88VIP 字样，只保留输入文案。
- 88VIP 元素之间的 CSS gap 为 `0px`，没有额外 margin。
- 左侧麦穗使用 `public/images/waist-assets/left-wheat-custom.png`。
- 右侧麦穗使用 `public/images/waist-assets/right-wheat.png`。
- 88VIP 字样使用 `public/images/waist-assets/88vip-wordmark.png`。

## 关键模板文件

- `templates/TaoMainSearchTag.tsx`
- `templates/TaoTravelTab.tsx`
- `templates/MiniAppCard.tsx`
- `templates/WaistBanner.tsx`
- `components/templates/SmartTextRenderer.tsx`

## 关键配置文件

- `lib/types.ts`
- `lib/waistBackgrounds.ts`
- `lib/exportPNG.ts`
- `lib/uploadToAliyun.ts`
- `app/globals.css`
- `tailwind.config.ts`
- `next.config.ts`

## 字体资源

字体统一放在 `public/fonts/`，由 `scripts/generate-font-css.mjs` 生成 `app/generated-fonts.css`。

主要字体：

- `FliggyFont-Medium.ttf`
- `FliggySans102-Md.ttf`
- `FliggySans102-Rg.ttf`
- `PingFang-SC-Bold.ttf`
- `ZaoZiGongFangYuanHeiTi-2.ttf`

## 图片和素材资源

所有可调用素材都放在 `public/` 下，接手平台可按相对 URL 引用，例如：

```text
/images/waist-banners/vip-88.png
/images/waist-assets/left-wheat-custom.png
/images/waist-assets/right-wheat.png
/fonts/FliggyFont-Medium.ttf
```

完整素材列表见 `ASSET_MANIFEST_20260526.md`。

## 打包说明

交接压缩包会排除以下生成内容：

- `node_modules/`
- `.next/`
- `.next.bak-*`
- `tsconfig.tsbuildinfo`
- `.DS_Store`
- `._*`

接手方解压后执行 `npm install` 即可恢复依赖。
