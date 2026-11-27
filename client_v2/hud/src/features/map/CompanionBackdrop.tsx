import React, { useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";
import {
  getOrBuildTerrainCanvas,
  MAP_PX,
  renderWorldMapFrame,
} from "./mapRenderer";

export const CompanionBackdrop: React.FC = () => {
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isMapOpen) return;
    const bgCanvas = getOrBuildTerrainCanvas();
    const ctx = canvasRef.current?.getContext("2d") ?? null;
    if (!ctx) return;

    let animId = 0;
    let lastDraw = 0;

    const draw = (now: number) => {
      const st = useGameStore.getState();
      renderWorldMapFrame(
        ctx,
        bgCanvas,
        now,
        st.myId,
        st.packId,
        st.mapWaypoint,
      );
    };

    draw(performance.now());
    const loop = (now: number) => {
      if (now - lastDraw >= 50) {
        lastDraw = now;
        draw(now);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isMapOpen]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "78px",
        paddingTop: "32px",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <div
        style={{
          marginBottom: "8px",
          padding: "4px 12px",
          borderRadius: "999px",
          background: "rgba(15, 23, 42, 0.78)",
          border: "1px solid rgba(52, 211, 153, 0.28)",
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.3px",
        }}
      >
        🗺️ Bản đồ đảo trực tiếp • Đồ họa 3D chạy trên cửa sổ{" "}
        <b style={{ color: "#4ade80" }}>Dino Isle Native</b> • Dùng{" "}
        <code style={{ color: "#7dd3fc" }}>?overlay=1</code> để nền trong suốt
      </div>

      <div
        style={{
          width: "min(440px, 46vh, 80vw)",
          height: "min(440px, 46vh, 80vw)",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(52, 211, 153, 0.32)",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.55)",
          opacity: 0.92,
        }}
      >
        <canvas
          ref={canvasRef}
          width={MAP_PX}
          height={MAP_PX}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
