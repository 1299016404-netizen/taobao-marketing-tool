# 交接包说明

生成日期：2026-05-14

## 项目用途

这是一个基于 Next.js 15 的 ZIP 驱动 Lottie 动画编辑器，自动读取：

- `public/assets/闪购微动画.zip`
- `public/fonts/ZaoZiGongFangYuanHeiTi-2.ttf`

目标是实时预览、替换图片素材、编辑真实文字层、导出 GIF / APNG。

## 当前状态

- 首页入口：`app/page.tsx`
- 主编辑器：`components/editor/AEAnimationTool.tsx`
- 左侧素材面板：`components/editor/ParameterPanel.tsx`
- 导出面板：`components/export/ExportPanel.tsx`
- 预览区域：`components/preview/AnimationPreview.tsx`
- 时间轴：`components/timeline/TimelineScrubber.tsx`
- 状态管理：`lib/animationStore.ts`

## 已实现的关键点

- ZIP 自动解包：`lib/unzipAssets.ts`
- Lottie 解析和 asset 映射：`lib/parseLottie.ts`
- 图片替换：`lib/replaceImage.ts`
- 文本替换：`lib/replaceText.ts`
- 字体加载：`lib/loadFont.ts`
- GIF 导出：`lib/exportGIF.ts`
- APNG 导出：`lib/exportAPNG.ts`

## APNG 导出现状

- 导出文件扩展名使用 `.png`
- 内容仍是 APNG，方便 macOS 识别
- 当前策略是无损差分帧编码
- 现有素材导出后约为 295KB
- 循环次数固定为 3
- 原始素材是 156×84、20fps、100 帧

## 重要约束

- 当前项目没有真实 `ty=5` 文本层，素材不会出现伪文字覆盖
- 1x 导出会保持小体积，但在大屏预览里会显得更糊，这是源分辨率决定的
- 如果要更清晰，只能提高导出倍率，体积会明显增加

## 近期 UI 调整

- 页面背景改为 `#F2F3F5`
- 去掉了素材参数滑杆模块
- 去掉了速度下拉模块
- “导出动图”按钮和进度条已经放进左侧素材列表里
- “准备导出”文案已移除

## 启动方式

```bash
npm install
npm run dev -- -p 3200
```

生产预览：

```bash
npm run build
npm run start -- -H 0.0.0.0 -p 3200
```

## 交接建议

优先检查：

1. `lib/exportAPNG.ts`
2. `lib/captureFrames.ts`
3. `components/export/ExportPanel.tsx`
4. `components/editor/ParameterPanel.tsx`
5. `components/editor/AEAnimationTool.tsx`

如果要继续优化：

- 提高清晰度：考虑增加导出倍率，但会突破 300KB 目标
- 体积优化：继续压缩 APNG 变化区域，但不能破坏无损画质
- 兼容性优化：保留 `.png` 作为 APNG 下载名

