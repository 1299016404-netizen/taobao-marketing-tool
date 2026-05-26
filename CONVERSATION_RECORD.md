# 对话记录整理

日期范围：2026-05-10 至 2026-05-14

## 当前项目

项目目标是「淘宝飞猪营销切图生成工具网站」，不是 AE / Lottie 动画编辑器。当前首页入口已恢复为营销切图工具：

- `app/page.tsx` -> `MarketingEditor`
- `components/editor/MarketingEditor.tsx` -> 四个营销模板主控

## 初始需求

用户要求完整开发一个 Next.js 15 + App Router 项目：

- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion
- html-to-image 导出 PNG
- 本地字体加载
- 拖拽上传
- 实时预览
- 3x 高清导出
- Vercel 可部署

参考视觉为 `https://apng-page-flip-tool.vercel.app/`。

## 四个模板

1. 淘主搜常规标
2. 淘旅行Tab
3. 淘 / 支 / 微轻应用
4. 腰封设计

模块 3 的 Figma 节点后来修正为：

```text
1125-35272
```

## 重要需求变化

- 阿里图片库上传改为按钮跳转外链：
  `https://content.alibaba-inc.com/work/internal-media-management/pic/upload?iframe=3`
- 页面 UI 从暗色改为浅色，背景色为 `#F2F3F5`
- 白色面板使用：
  `box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1)`
- 网页普通 UI 字体：中文倾向苹方，数字/字母倾向 SF Pro Text
- 模板内文字不要加粗
- 去掉大部分模板内容里的描边、投影、黑色背景
- 淘 / 支 / 微轻应用保留左侧文案渐变
- 预览中的模板内容显示放大 1 倍，但不影响导出尺寸
- 腰封字间距使用滑杆交互，数值显示百分比
- 腰封背景图使用指定 `腰封设计.png`
- 轻应用右侧图标使用指定 `营销图标.png`

## 文案清理

用户要求去掉页面中多处说明性文案，例如：

- 实时预览
- Figma node
- 配置面板
- Next.js 15
- 3x PNG
- Local Render Export Studio
- 工具描述性副标题

当前页面保留较简洁的操作面板。

## 最近冲突点

用户曾只要求修「淘 / 支 / 微轻应用」右侧马赛克中左侧文案没有根据文字长度自适应的问题，但后续出现了过度修改和页面状态回退，用户要求回到截图那一步。

接手时请注意：如果继续修这个点，应只改 `templates/MiniAppCard.tsx`，避免改全局样式和其他模板。

## 最近修复

页面一度打不开，原因是入口文件被错误切回 AE / Lottie 工具：

- `app/page.tsx` 曾变成 `AEAnimationTool`
- `components/editor/MarketingEditor.tsx` 曾变成 `AEAnimationTool` 包装器
- `app/layout.tsx` metadata 曾变成动画工具文案

已恢复：

- `app/page.tsx` 渲染 `MarketingEditor`
- `MarketingEditor.tsx` 恢复营销切图主控逻辑
- `app/layout.tsx` 标题恢复为「切图生成工具」

## 当前验证

- `npm run build` 已通过
- 当前可本地启动
- 打开地址：`http://localhost:3000`

## 接手建议

先读：

1. `README.md`
2. `HANDOFF_TO_OTHER_PLATFORM.md`
3. 本文件

再看：

1. `components/editor/MarketingEditor.tsx`
2. `components/editor/ControlPanel.tsx`
3. `components/preview/PreviewStage.tsx`
4. `templates/MiniAppCard.tsx`
5. `templates/WaistBanner.tsx`

