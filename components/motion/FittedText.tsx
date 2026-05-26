"use client";

import * as React from "react";
import { getFittedTextStyle } from "@/lib/fitText";
import type { EditableTextLayer } from "@/lib/types";

type FittedTextProps = {
  layer: EditableTextLayer;
  className?: string;
};

export function FittedText({ layer, className }: FittedTextProps) {
  const fitStyle = getFittedTextStyle({
    text: layer.value,
    bounds: layer.bounds,
    baseFontSize: layer.fontSize,
  });

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: layer.bounds.x,
        top: layer.bounds.y,
        width: layer.bounds.width,
        height: layer.bounds.height,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        color: layer.color,
        textAlign: layer.align,
        transformOrigin: layer.transformOrigin,
      }}
      data-text-layer={layer.id}
    >
      <span
        className="smart-text"
        style={{
          ...fitStyle,
          display: "inline-block",
          maxWidth: "100%",
          fontWeight: 400,
        }}
      >
        {layer.value}
      </span>
    </div>
  );
}
