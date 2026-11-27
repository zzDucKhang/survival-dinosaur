import React, { useEffect, useRef, useState } from "react";
import { WORLD_CONFIG, getTerrainHeight } from "../../config/world";
import { localTransformMutable } from "../../store/mutableCache";
import { useGameStore } from "../../store/useGameStore";
import {
  getOrBuildTerrainCanvas,
  MAP_PX,
  renderWorldMapFrame,
} from "./mapRenderer";

export const CompanionBackdrop: React.FC = () => {
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coords, setCoords] = useState({ x: 0, z: 0, alt: 1, lakeDist: 85 });

  useEffect(() => {
    const syncStats = () => {
      const x = Math.round(localTransformMutable.x);
      const z = Math.round(localTransformMutable.z);
      const alt = Math.round(getTerrainHeight(x, z));
      const d1 = Math.hypot(x - WORLD_CONFIG.oasisX, z - WORLD_CONFIG.oasisZ);
      const d2 = Math.hypot(
        x - WORLD_CONFIG.highlandLakeX,
        z - WORLD_CONFIG.highlandLakeZ,
      );
      const lakeDist = Math.max(0, Math.round(Math.min(d1, d2)));
      setCoords((prev) =>
        prev.x === x &&
        prev.z === z &&
        prev.alt === alt &&
        prev.lakeDist === lakeDist
          ? prev
          : { x, z, alt, lakeDist },
      );
    };
    syncStats();
    const timer = window.setInterval(syncStats, 350);
    return () => window.clearInterval(timer);
  }, []);

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
        className="hud-glass"
        style={{
          marginBottom: "8px",
          padding: "5px 14px",
          borderRadius: "999px",
          background: "rgba(11, 18, 32, 0.78)",
          border: "1px solid rgba(52, 211, 153, 0.30)",
          color: "#cbd5e1",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.3px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span>
          🗺️ Bản đồ đảo trực tiếp • Đồ họa 3D chạy trên cửa sổ{" "}
          <b style={{ color: "#4ade80" }}>Dino Isle Native</b>
        </span>
        <span style={{ color: "#475569" }}>|</span>
        <span style={{ color: "#fde047", fontVariantNumeric: "tabular-nums" }}>
          📍 X {coords.x}, Z {coords.z} ({coords.alt}m)
        </span>
        <span style={{ color: "#7dd3fc", fontVariantNumeric: "tabular-nums" }}>
          💧 Hồ gần nhất: {coords.lakeDist}m
        </span>
      </div>

      <div
        style={{
          width: "min(440px, 46vh, 80vw)",
          height: "min(440px, 46vh, 80vw)",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(52, 211, 153, 0.38)",
          boxShadow: "0 20px 56px rgba(0, 0, 0, 0.62)",
          opacity: 0.94,
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
