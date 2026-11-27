import React, { useEffect, useRef, useState } from "react";
import { WORLD_CONFIG, getTerrainHeight } from "../../config/world";
import { localTransformMutable } from "../../store/mutableCache";
import { useGameStore } from "../../store/useGameStore";
import {
  getOrBuildTerrainCanvas,
  MAP_PX,
  mapToWorld,
  renderWorldMapFrame,
} from "./mapRenderer";

export const CompanionBackdrop: React.FC = () => {
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const setMapWaypoint = useGameStore((s) => s.setMapWaypoint);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coords, setCoords] = useState({ x: 0, z: 0, alt: 1, lakeDist: 59 });
  const [hoverPos, setHoverPos] = useState<{ x: number; z: number } | null>(
    null,
  );

  useEffect(() => {
    const syncStats = () => {
      const x = Math.round(localTransformMutable.x);
      const z = Math.round(localTransformMutable.z);
      const alt = Math.round(getTerrainHeight(x, z));
      const d1 =
        Math.hypot(x - WORLD_CONFIG.oasisX, z - WORLD_CONFIG.oasisZ) -
        WORLD_CONFIG.oasisRadius;
      const d2 =
        Math.hypot(
          x - WORLD_CONFIG.highlandLakeX,
          z - WORLD_CONFIG.highlandLakeZ,
        ) - WORLD_CONFIG.highlandLakeRadius;
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
      if (now - lastDraw >= 100) {
        lastDraw = now;
        draw(now);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isMapOpen]);

  const toWorldCoords = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = MAP_PX / Math.max(1, rect.width);
    const scaleY = MAP_PX / Math.max(1, rect.height);
    return mapToWorld(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "152px",
        paddingTop: "52px",
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
          background: "rgba(11, 18, 32, 0.88)",
          border: "1px solid rgba(52, 211, 153, 0.34)",
          color: "#cbd5e1",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.2px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          maxWidth: "92vw",
          pointerEvents: "auto",
        }}
      >
        <span>
          🗺️ Bản đồ trực tiếp • 3D chạy trên{" "}
          <b style={{ color: "#4ade80" }}>Dino Isle Native</b>
        </span>
        <span style={{ color: "#475569" }}>|</span>
        <span style={{ color: "#fde047", fontVariantNumeric: "tabular-nums" }}>
          {hoverPos
            ? `🎯 Con trỏ: X ${hoverPos.x}, Z ${hoverPos.z}`
            : `📍 X ${coords.x}, Z ${coords.z} (${coords.alt}m)`}
        </span>
        <span style={{ color: "#7dd3fc", fontVariantNumeric: "tabular-nums" }}>
          💧 Cách bờ hồ: {coords.lakeDist}m
        </span>
        {mapWaypoint && (
          <button
            type="button"
            onClick={() => setMapWaypoint(null)}
            style={{
              background: "rgba(239, 68, 68, 0.22)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#fca5a5",
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✕ Bỏ ghim
          </button>
        )}
      </div>

      <div
        style={{
          width: "min(560px, calc(100vh - 300px), 90vw)",
          height: "min(560px, calc(100vh - 300px), 90vw)",
          minWidth: "260px",
          minHeight: "260px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(52, 211, 153, 0.42)",
          boxShadow: "0 20px 56px rgba(0, 0, 0, 0.65)",
          pointerEvents: "auto",
        }}
        title="Click trái để đặt ghim dẫn đường • Click phải để xóa ghim"
      >
        <canvas
          ref={canvasRef}
          width={MAP_PX}
          height={MAP_PX}
          onClick={(e) => {
            const [wx, wz] = toWorldCoords(e);
            setMapWaypoint({ x: wx, z: wz });
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMapWaypoint(null);
          }}
          onMouseMove={(e) => {
            const [wx, wz] = toWorldCoords(e);
            setHoverPos({ x: wx, z: wz });
          }}
          onMouseLeave={() => setHoverPos(null)}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            cursor: "crosshair",
          }}
        />
      </div>
    </div>
  );
};
