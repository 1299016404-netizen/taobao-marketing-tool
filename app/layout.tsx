import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "切图生成工具",
  description: "淘宝飞猪营销切图生成工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "border border-[rgba(20,22,28,0.14)] bg-white text-[#171920] shadow-[0_18px_44px_rgba(20,22,28,0.12)]",
              description: "text-[#3a3d45]",
              actionButton: "bg-primary text-primary-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
