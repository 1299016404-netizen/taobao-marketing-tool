# 淘宝飞猪营销切图生成工具

一个基于 Next.js 15 + App Router 的本地营销切图生成工具，当前已恢复到「淘宝飞猪营销切图生成」页面。

## 运行

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 当前模块

- 淘主搜常规标
- 淘旅行Tab
- 淘 / 支 / 微轻应用
- 腰封设计

## 关键文件

- `app/page.tsx`
- `components/editor/MarketingEditor.tsx`
- `components/editor/ControlPanel.tsx`
- `components/preview/PreviewStage.tsx`
- `templates/`
- `lib/exportPNG.ts`
- `lib/uploadToAliyun.ts`
- `lib/splitFontText.ts`

## 字体

本地字体位于 `public/fonts/`，通过生成的 `@font-face` 方案加载，不依赖系统字体。

## 交接说明

请优先查看 [OTHER_PLATFORM_HANDOFF_20260526.md](./OTHER_PLATFORM_HANDOFF_20260526.md) 和 [ASSET_MANIFEST_20260526.md](./ASSET_MANIFEST_20260526.md)。
