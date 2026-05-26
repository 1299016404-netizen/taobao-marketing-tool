/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { SmartTextRenderer } from "@/components/templates/SmartTextRenderer";
import { hexToRgba, safeHex } from "@/lib/utils";

type MiniAppCardProps = {
  text: string;
  backgroundColor: string;
  iconDataUrl: string | null;
};

export const MiniAppCard = React.forwardRef<HTMLDivElement, MiniAppCardProps>(
  ({ text, backgroundColor, iconDataUrl }, ref) => {
    const color = safeHex(backgroundColor, "#FFE5E5");

    return (
      <div
        ref={ref}
        className="export-canvas inline-flex h-[58px] flex-row items-center justify-center pb-3.5"
        data-export-template="mini-app-card"
      >
        <div
          className="box-border inline-flex h-8 flex-row items-center justify-center py-0.5 pl-10 pr-1"
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(
              color,
              0,
            )} 0%, ${color} 13.51%)`,
          }}
        >
          <SmartTextRenderer
            text={text}
            chineseFont="pingfang"
            className="h-7 whitespace-nowrap text-center text-[20px] leading-[140%] text-[#FF3333]"
            style={{
              letterSpacing: "0.015em",
            }}
          />
        </div>

        <div className="relative isolate flex h-11 w-11 shrink-0 flex-row items-center">
          <div
            className="absolute left-0 top-1.5 z-0 h-8 w-[22px]"
            style={{ background: color }}
          />
          {iconDataUrl ? (
            <img
              src={iconDataUrl}
              alt=""
              className="relative z-10 h-[39px] w-[39px] object-cover"
              draggable={false}
            />
          ) : (
            <div className="relative z-10 grid h-[39px] w-[39px] place-items-center rounded-[12px] bg-[#FF3333] text-[14px] font-black leading-none text-white">
              营
            </div>
          )}
        </div>
      </div>
    );
  },
);
MiniAppCard.displayName = "MiniAppCard";
