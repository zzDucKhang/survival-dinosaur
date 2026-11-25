import React, { useEffect, useRef } from 'react';
import {
  useGameStore,
  playersMutable,
  foodsMutable,
  localTransformMutable,
} from '../../../store/useGameStore';
import {
  HIGHLAND_LAKE_RADIUS,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  OASIS_RADIUS,
  OASIS_X,
  OASIS_Z,
} from '../../../constants/terrain';

export const RadarMinimap: React.FC = () => {
  const myId = useGameStore((s) => s.myId);
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    let lastDraw = 0;

    const renderRadar = (now: number) => {
      if (now - lastDraw >= 50) {
        lastDraw = now;
        const canvas = radarCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const radarRadius = w * 0.48;
            const mapScale = radarRadius / 240;
            const meX = localTransformMutable.x;
            const meZ = localTransformMutable.z;

            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
            ctx.clip();

            ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, w * 0.24, 0, Math.PI * 2);
            ctx.stroke();

            const drawLake = (lx: number, lz: number, r: number) => {
              const sx = cx + (lx - meX) * mapScale;
              const sz = cy + (lz - meZ) * mapScale;
              ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
              ctx.beginPath();
              ctx.arc(sx, sz, Math.max(4, r * mapScale), 0, Math.PI * 2);
              ctx.fill();
            };
            drawLake(OASIS_X, OASIS_Z, OASIS_RADIUS);
            drawLake(HIGHLAND_LAKE_X, HIGHLAND_LAKE_Z, HIGHLAND_LAKE_RADIUS);

            for (const id of Object.keys(foodsMutable)) {
              const f = foodsMutable[id];
              if (!f || f.amount <= 0) continue;
              const fx = cx + (f.x - meX) * mapScale;
              const fz = cy + (f.z - meZ) * mapScale;
              ctx.fillStyle = f.type === 'meat' ? '#f43f5e' : '#86efac';
              ctx.fillRect(fx - 2, fz - 2, 4, 4);
            }

            for (const id of Object.keys(playersMutable)) {
              if (id === myId) continue;
              const p = playersMutable[id];
              if (!p) continue;
              const px = cx + (p.x - meX) * mapScale;
              const pz = cy + (p.z - meZ) * mapScale;
              const isHunting = p.aiState === 'CHASE' || p.aiState === 'ATTACK';
              ctx.fillStyle = isHunting
                ? '#f97316'
                : p.diet === 'herbivore'
                ? '#34d399'
                : p.isAi
                ? '#818cf8'
                : '#ef4444';
              const dotSize =
                p.growth && p.growth > 1.1 ? 4.8 : p.growth && p.growth < 0.55 ? 2.6 : 3.6;
              ctx.beginPath();
              ctx.arc(px, pz, dotSize, 0, Math.PI * 2);
              ctx.fill();
            }

            const wp = useGameStore.getState().mapWaypoint;
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
              ctx.fillStyle = '#facc15';
              ctx.strokeStyle = '#0f172a';
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

            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
              cx + Math.sin(localTransformMutable.rot) * 12,
              cy + Math.cos(localTransformMutable.rot) * 12
            );
            ctx.stroke();

            ctx.restore();
          }
        }
      }
      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [myId]);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        setMapOpen(true);
      }}
      title="Bấm để mở Bản Đồ Toàn Đảo (Phím M)"
      style={{
        position: 'absolute',
        bottom: '22px',
        right: '20px',
        background: 'rgba(15, 23, 42, 0.88)',
        border: mapWaypoint
          ? '1px solid rgba(250, 204, 21, 0.55)'
          : '1px solid rgba(52, 211, 153, 0.35)',
        borderRadius: '12px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        pointerEvents: 'auto',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#34d399', letterSpacing: '0.8px' }}>
        🗺️ BẤM MỞ BẢN ĐỒ [M]
      </div>
      <div style={{ width: '136px', height: '136px', flexShrink: 0 }}>
        <canvas
          ref={radarCanvasRef}
          width={136}
          height={136}
          style={{
            width: '136px',
            height: '136px',
            borderRadius: '50%',
            background: '#090d16',
          }}
        />
      </div>
      <div style={{ fontSize: '9px', color: mapWaypoint ? '#fde047' : '#94a3b8' }}>
        {mapWaypoint
          ? `📍 Đang ghim (${mapWaypoint.x}, ${mapWaypoint.z})`
          : '🟡 Bạn • 🟢 Ăn cỏ • 🟣 Ăn thịt • 🔵 Hồ'}
      </div>
    </div>
  );
};