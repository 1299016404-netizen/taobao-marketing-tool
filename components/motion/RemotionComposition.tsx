import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const REMOTION_COMPOSITION_ID = "ae-animation-export";

type RemotionAECompositionProps = {
  headline?: string;
  subtitle?: string;
  badge?: string;
};

export function RemotionAEComposition({
  headline = "抽免单",
  subtitle = "订酒店 有机会免单",
  badge = "限时特价",
}: RemotionAECompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({
    fps,
    frame,
    config: {
      damping: 14,
      stiffness: 115,
      mass: 0.7,
    },
  });
  const shine = interpolate(frame, [22, 54], [-120, 650], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "transparent",
        fontFamily:
          "'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          borderRadius: 18,
          background: "linear-gradient(115deg,#7a111d 0%,#ff5a2f 42%,#ffd15c 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 30,
          top: 28,
          width: 176,
          height: 176,
          borderRadius: 34,
          display: "grid",
          placeItems: "center",
          color: "rgba(255,255,255,.92)",
          fontSize: 64,
          transform: `translateX(${(1 - intro) * -34}px) scale(${0.82 + intro * 0.18})`,
          background: "linear-gradient(145deg,rgba(255,255,255,.34),rgba(255,255,255,.05))",
        }}
      >
        免
      </div>
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 42,
          width: 130,
          height: 32,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontSize: 20,
          transform: `translateY(${(1 - intro) * 8}px)`,
        }}
      >
        {badge}
      </div>
      <div
        style={{
          position: "absolute",
          left: 106,
          top: 72,
          width: 336,
          height: 76,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          color: "#fff6df",
          fontSize: 62,
          lineHeight: "76px",
          whiteSpace: "nowrap",
          transform: `translateX(${(1 - intro) * 28}px)`,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          position: "absolute",
          left: 135,
          top: 147,
          width: 278,
          height: 34,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          color: "#7a241a",
          fontSize: 23,
          whiteSpace: "nowrap",
          transform: `translateX(${(1 - intro) * 28}px)`,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: shine,
          width: 88,
          height: "100%",
          transform: "skewX(-18deg)",
          background: "rgba(255,255,255,.28)",
          filter: "blur(4px)",
        }}
      />
    </AbsoluteFill>
  );
}
