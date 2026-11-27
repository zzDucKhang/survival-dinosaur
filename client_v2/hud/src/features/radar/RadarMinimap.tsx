import React, { useEffect, useRef } from "react";
import { WORLD_CONFIG } from "../../config/world";
import {
  foodsMutable,
  localTransformMutable,
  playersMutable,
} from "../../store/mutableCache";
import { useGameStore } from "../../store/useGameStore";

const RADAR_WORLD_RANGE = 240;
const RADAR_MAX_DIST_SQ = (RADAR_WORLD_RANGE + 18) * (RADAR_WORLD_RANGE + 18);

export const RadarMinimap: React.FC = () => {
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = radarCanvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!canvas || !ctx) return;

    let animId = 0;
    let lastDraw = 0;

    const renderRadar = (now: number) => {
      if (now - lastDraw >= 50) {
        lastDraw = now;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w * 0.5;
        const cy = h * 0.5;
        const radarRadius = w * 0.48;
        const mapScale = radarRadius / RADAR_WORLD_RANGE;
        const meX = localTransformMutable.x;
        const meZ = localTransformMutable.z;
        const st = useGameStore.getState();
        const myId = st.myId;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
        ctx.clip();

        ctx.strokeStyle = "rgba(52, 211, 153, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.24, 0, Math.PI * 2);
        ctx.stroke();

        const drawLake = (lx: number, lz: number, r: number) => {
          const sx = cx + (lx - meX) * mapScale;
          const sz = cy + (lz - meZ) * mapScale;
          ctx.fillStyle = "rgba(14, 165, 233, 0.55)";
          ctx.beginPath();
          ctx.arc(sx, sz, Math.max(4, r * mapScale), 0, Math.PI * 2);
          ctx.fill();
        };
        drawLake(
          WORLD_CONFIG.oasisX,
          WORLD_CONFIG.oasisZ,
          WORLD_CONFIG.oasisRadius,
        );
        drawLake(
          WORLD_CONFIG.highlandLakeX,
          WORLD_CONFIG.highlandLakeZ,
          WORLD_CONFIG.highlandLakeRadius,
        );

        for (const id in foodsMutable) {
          const f = foodsMutable[id];
          if (!f || f.amount <= 0) continue;
          const dx = f.x - meX;
          const dz = f.z - meZ;
          if (dx * dx + dz * dz > RADAR_MAX_DIST_SQ) continue;
          ctx.fillStyle = f.type === "meat" ? "#f43f5e" : "#86efac";
          ctx.fillRect(cx + dx * mapScale - 2, cy + dz * mapScale - 2, 4, 4);
        }

        for (const id in playersMutable) {
          if (id === myId) continue;
          const p = playersMutable[id];
          if (!p) continue;
          const dx = p.x - meX;
          const dz = p.z - meZ;
          if (dx * dx + dz * dz > RADAR_MAX_DIST_SQ) continue;
          const px = cx + dx * mapScale;
          const pz = cy + dz * mapScale;
          const isPackmate = Boolean(
            !p.isAi && st.packId && p.packId === st.packId,
          );
          const isHunting = p.aiState === "CHASE" || p.aiState === "ATTACK";

          ctx.fillStyle = isPackmate
            ? "#38bdf8"
            : isHunting
              ? "#f97316"
              : p.diet === "herbivore"
                ? "#34d399"
                : p.isAi
                  ? "#818cf8"
                  : "#ef4444";

          const dotSize = isPackmate
            ? 4.6
            : p.growth && p.growth > 1.1
              ? 4.8
              : p.growth && p.growth < 0.55
                ? 2.6
                : 3.6;

          ctx.beginPath();
          ctx.arc(px, pz, dotSize, 0, Math.PI * 2);
          ctx.fill();
          if (isPackmate) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        const wp = st.mapWaypoint;
        if (wp) {
          let dx = (wp.x - meX) * mapScale;
          let dz = (wp.z - meZ) * mapScale;
          const d = Math.hypot(dx, dz);
          if (d > radarRadius - 6) {
            dx = (dx / d) * (radarRadius - 6);
            dz = (dz / d) * (radarRadius - 6);
          }
          const wx = cx + dx;
          const wz = cy + dz;
          ctx.fillStyle = "#facc15";
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(wx, wz - 5);
          ctx.lineTo(wx + 5, wz);
          ctx.lineTo(wx, wz + 5);
          ctx.lineTo(wx - 5, wz);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.sin(localTransformMutable.rot) * 12,
          cy + Math.cos(localTransformMutable.rot) * 12,
        );
        ctx.stroke();

        ctx.font = "bold 9px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
        ctx.textAlign = "center";
        ctx.fillText("N", cx, 11);
        ctx.restore();
      }
      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        setMapOpen(true);
      }}
      title="Bấm để mở Bản Đồ Toàn Đảo (Phím M)"
      style={{
        position: "absolute",
        bottom: "22px",
        right: "20px",
        background: "var(--bg-panel)",
        border: mapWaypoint
          ? "1px solid rgba(250, 204, 21, 0.55)"
          : "1px solid rgba(52, 211, 153, 0.35)",
        borderRadius: "12px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        pointerEvents: "auto",
        cursor: "pointer",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: "#34d399",
          letterSpacing: "0.8px",
        }}
      >
        🗺️ BẤM MỞ BẢN ĐỒ [M]
      </div>
      <div style={{ width: "136px", height: "136px", flexShrink: 0 }}>
        <canvas
          ref={radarCanvasRef}
          width={136}
          height={136}
          style={{
            width: "136px",
            height: "136px",
            borderRadius: "50%",
            background: "#090d16",
          }}
        />
      </div>
      <div
        style={{ fontSize: "9px", color: mapWaypoint ? "#fde047" : "#94a3b8" }}
      >
        {mapWaypoint
          ? `📍 Đang ghim (${Math.round(mapWaypoint.x)}, ${Math.round(mapWaypoint.z)})`
          : "🟡 Bạn • 🩵 Bầy • 🟢 Cỏ • 🟣 Thịt"}
      </div>
    </div>
  );
};
