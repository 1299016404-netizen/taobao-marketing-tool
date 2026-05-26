import * as React from "react";
import { splitFontText } from "@/lib/splitFontText";
import { cn } from "@/lib/utils";

type ChineseFont = "pingfang" | "fliggy";

type SmartTextRendererProps = {
  text: string;
  chineseFont?: ChineseFont;
  className?: string;
  style?: React.CSSProperties;
  charClassName?: string;
  fontWeight?: React.CSSProperties["fontWeight"];
  trackingEm?: number;
};

const chineseFontFamily: Record<ChineseFont, string> = {
  pingfang: "'PingFang SC', PingFangSCMedium, sans-serif",
  fliggy: "FliggyFontMedium, FliggyFont, sans-serif",
};

const latinFontFamily =
  "'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";

export function SmartTextRenderer({
  text,
  chineseFont = "pingfang",
  className,
  style,
  charClassName,
  fontWeight = 500,
  trackingEm,
}: SmartTextRendererProps) {
  const characters = splitFontText(text);

  return (
    <span className={cn("smart-text inline-block whitespace-nowrap", className)} style={style}>
      {characters.map((item, index) => (
        <span
          key={`${item.index}-${item.value}`}
          className={cn("inline-block", charClassName)}
          style={{
            fontFamily:
              item.kind === "latin"
                ? latinFontFamily
                : chineseFontFamily[chineseFont],
            fontSynthesis: "none",
            fontWeight,
            marginRight:
              trackingEm && index < characters.length - 1
                ? `${trackingEm}em`
                : undefined,
          }}
        >
          {item.value}
        </span>
      ))}
    </span>
  );
}
