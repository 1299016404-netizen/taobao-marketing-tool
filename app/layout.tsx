import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "切图生成工具",
  description: "淘宝飞猪营销切图生成工具。",
};

// 字体 CSS 异步加载脚本：首屏 × 字体下载解耦。
// 原理：media="print" 使浏览器不阻塞渲染，onload 后改为 media="all" 让样式生效。
// GitHub Pages 限速、字体 10MB 下载 30s+ 场景下，页面立即可见，字体下载完后无感知生效。
const FONT_LAZY_LOADER = `
(function(){
  try {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/taobao-marketing-tool/fonts.css';
    l.media = 'print';
    l.onload = function(){ this.media = 'all'; };
    document.head.appendChild(l);
  } catch(e) { console.warn('[fonts] lazy load failed', e); }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        {/* Toaster 已移除：上传结果通过按钮上方的链接 + 复制按钮直接展示，不再弹 toast */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: FONT_LAZY_LOADER }} />
      </body>
    </html>
  );
}
