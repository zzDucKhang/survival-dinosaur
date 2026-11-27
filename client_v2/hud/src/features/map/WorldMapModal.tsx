import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getTerrainHeight } from "../../config/world";
import { localTransformMutable } from "../../store/mutableCache";
import { useGameStore } from "../../store/useGameStore";
import {
  getOrBuildTerrainCanvas,
  MAP_PX,
  mapToWorld,
  renderWorldMapFrame,
} from "./mapRenderer";

export const WorldMapModal: React.FC = () => {
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const setMapWaypoint = useGameStore((s) => s.setMapWaypoint);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordLabelRef = useRef<HTMLDivElement>(null);
  const [isRound, setIsRound] = useState(false);

  useEffect(() => {
    if (!isMapOpen) return;
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

  if (!isMapOpen || typeof document === "undefined") return null;

  const getCoordsFromMouse = (
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

  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [wx, wz] = getCoordsFromMouse(e);
    setMapWaypoint({ x: wx, z: wz });
  };

  const handleMapContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setMapWaypoint(null);
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!coordLabelRef.current) return;
    const [wx, wz] = getCoordsFromMouse(e);
    const wy = Math.round(getTerrainHeight(wx, wz) * 10) / 10;
    coordLabelRef.current.textContent = `Con trỏ: X ${wx} | Z ${wz} | Cao ${wy}m`;
  };

  const handleMapMouseLeave = () => {
    if (!coordLabelRef.current) return;
    coordLabelRef.current.textContent = `Vị trí bạn: X ${Math.round(localTransformMutable.x)} | Z ${Math.round(localTransformMutable.z)}`;
  };

  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => setMapOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 23, 0.76)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        zIndex: 950,
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-panel-solid)",
          border: "1px solid rgba(52, 211, 153, 0.5)",
          borderRadius: "18px",
          padding: "16px 20px",
          boxShadow: "var(--shadow-modal)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          maxWidth: "94vw",
          maxHeight: "95vh",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "#4ade80",
                letterSpacing: "1px",
              }}
            >
              🗺️ BẢN ĐỒ TOÀN ĐẢO KHỦNG LONG (900m × 900m)
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Click trái để <b>đặt ghim dẫn đường 📍</b> (đồng bộ cột sáng 3D
              trong Bevy) • Click phải xóa ghim
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setIsRound((v) => !v)}
              style={{
                background: "#1e293b",
                border: "1px solid rgba(56, 189, 248, 0.45)",
                color: "#7dd3fc",
                padding: "5px 10px",
                borderRadius: "7px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isRound ? "⬜ Dạng Vuông" : "⭕ Dạng Tròn"}
            </button>
            {mapWaypoint && (
              <button
                onClick={() => setMapWaypoint(null)}
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  color: "#fca5a5",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✕ Xóa ghim
              </button>
            )}
            <button
              onClick={() => setMapOpen(false)}
              style={{
                background: "#dc2626",
                border: "none",
                color: "#fff",
                padding: "5px 12px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Đóng [M / Esc]
            </button>
          </div>
        </div>

        <div
          style={{
            width: "min(600px, 74vmin)",
            height: "min(600px, 74vmin)",
            position: "relative",
            borderRadius: isRound ? "50%" : "12px",
            overflow: "hidden",
            border: "2px solid rgba(52, 211, 153, 0.55)",
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.25)",
            flexShrink: 0,
          }}
        >
          <canvas
            ref={canvasRef}
            width={MAP_PX}
            height={MAP_PX}
            onClick={handleMapClick}
            onContextMenu={handleMapContextMenu}
            onMouseMove={handleMapMouseMove}
            onMouseLeave={handleMapMouseLeave}
            style={{
              width: "100%",
              height: "100%",
              cursor: "crosshair",
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "#cbd5e1",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            🟡 Bạn • 🩵 Bầy đàn • 🔴 Người chơi • 🟢 Ăn cỏ • 🟣 Ăn thịt AI • 🩸
            Vệt máu • ♦️ Thịt
          </div>
          <div ref={coordLabelRef} style={{ color: "#fde047", fontWeight: 700 }}>
            {`Vị trí bạn: X ${Math.round(localTransformMutable.x)} | Z ${Math.round(localTransformMutable.z)}`}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
