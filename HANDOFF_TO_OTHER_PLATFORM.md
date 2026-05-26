# 交接包

> 最新交接说明请优先查看 `OTHER_PLATFORM_HANDOFF_20260526.md` 和 `ASSET_MANIFEST_20260526.md`。本文件为较早版本记录，仅保留历史上下文。

生成日期：2026-05-14

## 项目现状

- 这是一个淘宝飞猪营销切图生成工具，当前首页已恢复正常可打开。
- 本地地址：`http://localhost:3000`
- 构建状态：`npm run build` 已通过。

## 当前页面结构

- 左侧：模块选择 + 文案/颜色/上传/导出控制
- 右侧：实时预览
- 入口：`app/page.tsx`
- 主控：`components/editor/MarketingEditor.tsx`

## 当前模块

1. 淘主搜常规标
2. 淘旅行Tab
3. 淘 / 支 / 微轻应用
4. 腰封设计

## 重要文件

- `app/layout.tsx`
- `app/globals.css`
- `components/editor/MarketingEditor.tsx`
- `components/editor/ControlPanel.tsx`
- `components/preview/PreviewStage.tsx`
- `components/templates/SmartTextRenderer.tsx`
- `templates/TaoMainSearchTag.tsx`
- `templates/TaoTravelTab.tsx`
- `templates/MiniAppCard.tsx`
- `templates/WaistBanner.tsx`
- `lib/exportPNG.ts`
- `lib/uploadToAliyun.ts`
- `lib/splitFontText.ts`
- `public/fonts/*`
- `public/images/*`

## 最近对话里已经确认过的需求

- 页面从暗色切回浅色，背景为 `#F2F3F5`
- 卡片改成白底、带柔和阴影
- 去掉大段说明文案，只保留工具本体
- 取消模块内文字加粗
- 取消大部分描边、投影、渐变
- 数字/字母和中文使用不同本地字体
- 阿里图片库改成外链按钮
- 腰封背景图使用上传/替换图
- 轻应用右侧营销图标替换为指定切图

## 目前还值得继续看的点

- `templates/MiniAppCard.tsx` 右侧标签左侧文案如果还要继续做“随文案长度自适应”，优先改这里。
- 如果接手平台要继续精修，先从预览模板开始，不要先动全局布局。

## 对话记录摘要

### 起始目标

你希望做一个「淘宝飞猪营销切图生成工具网站」，支持四个模板、字体混排、本地导出 PNG、上传到阿里图片库、可直接部署。

### 中途修正

- 模块 3 的 Figma 节点修正为 `1125-35272`
- 阿里图片库上传改为按钮跳转外链
- 字体规则改过多轮，最后以当前页面效果为准
- 页面从暗色风格调整成浅色工具台风格
- 后续多次去掉了说明文案、渐变、描边、投影，逐步收敛到当前视觉

### 最近一次关键修复

- 页面一度被误切回 AE/Lottie 工具
- 已恢复回营销切图工具入口，并验证页面可打开

## 建议接手方式

1. 先读 `README.md`
2. 再看本文件
3. 打开 `app/page.tsx` 和 `components/editor/MarketingEditor.tsx`
4. 如果要做视觉微调，优先改 `templates/` 里的四个模板
