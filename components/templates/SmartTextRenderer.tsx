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

// 数字 + 拉丁字母统一使用 Fliggy Sans 102 Medium（按用户要求：腰封/淘搜/淘旅行/小程序卡片所有数字字体）
const latinFontFamily =
  "FliggySans102Medium, 'Fliggy Sans 102', 'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";

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
      {characters.map((item, index) => {
        const isNumber = item.kind === "number";
        const prev = characters[index - 1];
        const next = characters[index + 1];
        // 数字字符与非数字相邻边界处加 0.04em（letter-spacing 4%）
        const numberSpaceLeft = isNumber && prev && prev.kind !== "number" ? 0.04 : 0;
        const numberSpaceRight =
          isNumber && next && next.kind !== "number" && index < characters.length - 1 ? 0.04 : 0;
        const trackingMr =
          trackingEm && index < characters.length - 1 ? trackingEm : 0;
        const marginRightTotal = trackingMr + numberSpaceRight;
        const fontFamily =
          item.kind === "text" ? chineseFontFamily[chineseFont] : latinFontFamily;

        return (
          <span
            key={`${item.index}-${item.value}`}
            className={cn("inline-block", charClassName)}
            style={{
              fontFamily,
              fontSynthesis: "none",
              fontWeight,
              marginLeft: numberSpaceLeft > 0 ? `${numberSpaceLeft}em` : undefined,
              marginRight: marginRightTotal > 0 ? `${marginRightTotal}em` : undefined,
            }}
          >
            {item.value}
          </span>
        );
      })}
    </span>
  );
}
