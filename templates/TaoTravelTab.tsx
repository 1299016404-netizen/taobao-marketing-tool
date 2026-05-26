import * as React from "react";
import { SmartTextRenderer } from "@/components/templates/SmartTextRenderer";
import { safeHex } from "@/lib/utils";

type TaoTravelTabProps = {
  text: string;
  backgroundColor: string;
};

export const TaoTravelTab = React.forwardRef<HTMLDivElement, TaoTravelTabProps>(
  ({ text, backgroundColor }, ref) => {
    const color = safeHex(backgroundColor, "#FF3D00");

    return (
      <div
        ref={ref}
        className="export-canvas inline-flex h-[52px] items-start justify-center pb-[15px] pt-[5px]"
        data-export-template="tao-travel-tab"
      >
        <div
          className="box-border inline-flex h-8 items-end justify-center gap-2.5 overflow-hidden px-3 py-0.5"
          style={{
            backgroundColor: color,
            borderRadius: "16px 19px 19px 2px",
          }}
        >
          <SmartTextRenderer
            text={text}
            chineseFont="pingfang"
            className="h-7 text-center text-[20px] leading-[140%] text-white"
          />
        </div>
      </div>
    );
  },
);
TaoTravelTab.displayName = "TaoTravelTab";
