import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  foodsMutable,
  localTransformMutable,
  playersMutable,
  useGameStore,
} from '../../../store/useGameStore';
import {
  getTerrainHeight,
  HIGHLAND_LAKE_RADIUS,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  isInsideLake,
  ISLAND_LIMIT,
  OASIS_RADIUS,
  OASIS_X,
  OASIS_Z,
} from '../../../constants/terrain';

const MAP_PX = 600;
let cachedTerrainCanvas: HTMLCanvasElement | null = null;

function worldToMap(wx: number, wz: number): [number, number] {
  const half = MAP_PX / 2;
  const scale = half / ISLAND_LIMIT;
  return [half + wx * scale, half + wz * scale];
}

function mapToWorld(mx: number, my: number): [number, number] {
  const half = MAP_PX / 2;
  const scale = ISLAND_LIMIT / half;
  const wx = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, (mx - half) * scale));
  const wz = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, (my - half) * scale));
  return [Math.round(wx), Math.round(wz)];
}

function getOrBuildTerrainCanvas(): HTMLCanvasElement {
  if (cachedTerrainCanvas) return cachedTerrainCanvas;

  const offscreen = document.createElement('canvas');
  offscreen.width = MAP_PX;
  offscreen.height = MAP_PX;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  const step = 2;
  const img = ctx.createImageData(MAP_PX, MAP_PX);
  const data = img.data;

  for (let py = 0; py < MAP_PX; py += step) {
    for (let px = 0; px < MAP_PX; px += step) {
      const [wx, wz] = mapToWorld(px + 1, py + 1);
      const h = getTerrainHeight(wx, wz);

      let r = 61;
      let g = 107;
      let b = 60;

      if (isInsideLake(wx, wz) && h < -0.25) {
        r = 14;
        g = 140;
        b = 215;
      } else if (h < -0.5) {
        r = 58;
        g = 76;
        b = 46;
      } else if (h < 0.4) {
        r = 128;
        g = 114;
        b = 82;
      } else if (h < 7.5) {
        r = 56;
        g = 100;
        b = 58;
      } else if (h < 16.5) {
        r = 44;
        g = 82;
        b = 50;
      } else if (h < 28.0) {
        r = 88;
        g = 96;
        b = 108;
      } else {
        r = 142;
        g = 152;
        b = 166;
      }

      const mod = ((h % 8) + 8) % 8;
      if (mod < 0.32) {
        r = Math.max(0, r - 18);
        g = Math.max(0, g - 18);
        b = Math.max(0, b - 18);
      }

      for (let dy = 0; dy < step && py + dy < MAP_PX; dy++) {
        for (let dx = 0; dx < step && px + dx < MAP_PX; dx++) {
          const idx = ((py + dy) * MAP_PX + (px + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // Lưới tọa độ
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const gridStep = MAP_PX / 6;
  for (let i = 1; i < 6; i++) {
    const pos = i * gridStep;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, MAP_PX);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(MAP_PX, pos);
    ctx.stroke();
  }

  // Vẽ viền 2 hồ nước
  const drawLakeOutline = (lx: number, lz: number, radius: number) => {
    const [sx, sy] = worldToMap(lx, lz);
    const rPx = (radius / ISLAND_LIMIT) * (MAP_PX / 2);
    ctx.fillStyle = 'rgba(14, 165, 233, 0.58)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.92)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, rPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  drawLakeOutline(OASIS_X, OASIS_Z, OASIS_RADIUS);
  drawLakeOutline(HIGHLAND_LAKE_X, HIGHLAND_LAKE_Z, HIGHLAND_LAKE_RADIUS);

  // Nhãn địa danh
  const landmarks: Array<{ label: string; x: number; z: number; color: string }> = [
    { label: '💧 Hồ Oasis', x: OASIS_X, z: OASIS_Z - 36, color: '#7dd3fc' },
    { label: '💧 Hồ Cao Nguyên', x: HIGHLAND_LAKE_X, z: HIGHLAND_LAKE_Z - 44, color: '#7dd3fc' },
    { label: '🏔️ Núi Đá Đông Nam', x: 210, z: 170, color: '#e2e8f0' },
    { label: '🏔️ Đỉnh Tây Bắc', x: -220, z: -160, color: '#e2e8f0' },
    { label: '🌿 Thung Lũng Trũng', x: -140, z: 20, color: '#bbf7d0' },
    { label: '⭐ Bãi Cỏ Trung Tâm', x: 0, z: 20, color: '#fef08a' },
  ];

  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const lm of landmarks) {
    const [lx, ly] = worldToMap(lm.x, lm.z);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fillText(lm.label, lx + 1, ly + 1);
    ctx.fillStyle = lm.color;
    ctx.fillText(lm.label, lx, ly);
  }

  cachedTerrainCanvas = offscreen;
  return offscreen;
}

export const WorldMapModal: React.FC = () => {
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const myId = useGameStore((s) => s.myId);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const setMapWaypoint = useGameStore((s) => s.setMapWaypoint);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRound, setIsRound] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; z: number; y: number } | null>(null);

  const closeAndRefocus = () => {
    setMapOpen(false);
    const canvas3d = document.querySelector('canvas');
    if (canvas3d instanceof HTMLElement) {
      canvas3d.focus();
    }
  };

  useEffect(() => {
    if (!isMapOpen) return;
    const bgCanvas = getOrBuildTerrainCanvas();
    let animId = 0;
    let lastDraw = 0;

    const drawFrame = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, MAP_PX, MAP_PX);
      ctx.drawImage(bgCanvas, 0, 0);

      // 1. Thức ăn (bụi quả & xác thịt)
      for (const id of Object.keys(foodsMutable)) {
        const f = foodsMutable[id];
        if (!f || f.amount <= 0) continue;
        const [fx, fy] = worldToMap(f.x, f.z);
        ctx.fillStyle = f.type === 'meat' ? '#f43f5e' : '#86efac';
        if (f.type === 'meat') {
          ctx.beginPath();
          ctx.moveTo(fx, fy - 5);
          ctx.lineTo(fx + 5, fy);
          ctx.lineTo(fx, fy + 5);
          ctx.lineTo(fx - 5, fy);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(fx - 3, fy - 3, 6, 6);
        }
      }

      // 2. Các sinh vật khác
      for (const id of Object.keys(playersMutable)) {
        if (id === myId) continue;
        const p = playersMutable[id];
        if (!p) continue;
        const [px, py] = worldToMap(p.x, p.z);
        const isHunting = p.aiState === 'CHASE' || p.aiState === 'ATTACK';
        ctx.fillStyle = isHunting
          ? '#f97316'
          : p.diet === 'herbivore'
          ? '#34d399'
          : p.isAi
          ? '#a78bfa'
          : '#ef4444';
        const radius = !p.isAi ? 6 : p.growth && p.growth > 1.1 ? 5.5 : 4.2;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        if (!p.isAi || (p.growth && p.growth >= 1.25)) {
          ctx.font = 'bold 11px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
          ctx.fillText(p.name, px + 1, py - 8);
          ctx.fillStyle = !p.isAi ? '#fca5a5' : '#e9d5ff';
          ctx.fillText(p.name, px, py - 9);
        }
      }

      const [meX, meY] = worldToMap(localTransformMutable.x, localTransformMutable.z);

      // 3. Điểm ghim Waypoint + đường dẫn
      const wp = useGameStore.getState().mapWaypoint;
      if (wp) {
        const [wx, wy] = worldToMap(wp.x, wp.z);
        const distM = Math.round(
          Math.hypot(wp.x - localTransformMutable.x, wp.z - localTransformMutable.z)
        );

        ctx.save();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(meX, meY);
        ctx.lineTo(wx, wy);
        ctx.stroke();
        ctx.restore();

        const pulse = 9 + Math.sin(now * 0.008) * 3.5;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(wx, wy, pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`📍 ${distM}m`, wx, wy - 14);
      }

      // 4. Vị trí & hướng mặt người chơi
      const rot = localTransformMutable.rot;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(meX, meY);
      ctx.lineTo(meX + Math.sin(rot) * 20, meY + Math.cos(rot) * 20);
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(meX, meY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    // Vẽ ngay lập tức khi vừa mở
    drawFrame(performance.now());

    const loop = (now: number) => {
      if (now - lastDraw >= 50) {
        lastDraw = now;
        drawFrame(now);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [isMapOpen, myId]);

  if (!isMapOpen || typeof document === 'undefined') return null;

  const getCoordsFromMouse = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = MAP_PX / Math.max(1, rect.width);
    const scaleY = MAP_PX / Math.max(1, rect.height);
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    return mapToWorld(mx, my);
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
    const [wx, wz] = getCoordsFromMouse(e);
    const wy = Math.round(getTerrainHeight(wx, wz) * 10) / 10;
    setHoverInfo({ x: wx, z: wz, y: wy });
  };

  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={closeAndRefocus}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.76)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        zIndex: 99999999,
        padding: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fff',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 23, 42, 0.97)',
          border: '1px solid rgba(52, 211, 153, 0.5)',
          borderRadius: '18px',
          padding: '16px 20px',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '94vw',
          maxHeight: '95vh',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#4ade80', letterSpacing: '1px' }}>
              🗺️ BẢN ĐỒ TOÀN ĐẢO KHỦNG LONG (900m × 900m)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Click trái để <b>đặt ghim dẫn đường 📍</b> (hiện cột sáng 3D) • Click phải để xóa ghim
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsRound((v) => !v)}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#7dd3fc',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {isRound ? '⬜ Dạng Vuông' : '⭕ Dạng Tròn'}
            </button>
            {mapWaypoint && (
              <button
                onClick={() => setMapWaypoint(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ✕ Xóa ghim
              </button>
            )}
            <button
              onClick={closeAndRefocus}
              style={{
                background: '#dc2626',
                border: 'none',
                color: '#fff',
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              Đóng [M / Esc]
            </button>
          </div>
        </div>

        {/* Khung vuông lớn cố định kích thước trước màn hình */}
        <div
          style={{
            width: 'min(600px, 74vmin)',
            height: 'min(600px, 74vmin)',
            position: 'relative',
            borderRadius: isRound ? '50%' : '12px',
            overflow: 'hidden',
            border: '2px solid rgba(52, 211, 153, 0.55)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
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
            onMouseLeave={() => setHoverInfo(null)}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'crosshair',
              display: 'block',
            }}
          />
        </div>

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#cbd5e1',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            🟡 Bạn • 🔴 Người chơi • 🟢 Ăn cỏ • 🟣 Ăn thịt AI • 🟠 Đang săn • ♦️ Thịt • 🟩 Quả
          </div>
          <div style={{ color: '#fde047', fontWeight: '700' }}>
            {hoverInfo
              ? `Con trỏ: X ${hoverInfo.x} | Z ${hoverInfo.z} | Cao ${hoverInfo.y}m`
              : `Vị trí bạn: X ${Math.round(localTransformMutable.x)} | Z ${Math.round(localTransformMutable.z)}`}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};