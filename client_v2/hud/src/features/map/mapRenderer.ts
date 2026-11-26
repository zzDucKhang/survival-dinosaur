import {
  getTerrainHeight,
  isInsideLake,
  WORLD_CONFIG,
} from "../../config/world";
import {
  bloodTrailsMutable,
  foodsMutable,
  localTransformMutable,
  playersMutable,
} from "../../store/mutableCache";
import type { MapWaypoint } from "../../types";

export const MAP_PX = 600;

let cachedTerrainCanvas: HTMLCanvasElement | null = null;

export function worldToMap(wx: number, wz: number): [number, number] {
  const half = MAP_PX / 2;
  const scale = half / WORLD_CONFIG.islandLimit;
  return [half + wx * scale, half + wz * scale];
}

export function mapToWorld(mx: number, my: number): [number, number] {
  const half = MAP_PX / 2;
  const limit = WORLD_CONFIG.islandLimit;
  const scale = limit / half;
  const wx = Math.max(-limit, Math.min(limit, (mx - half) * scale));
  const wz = Math.max(-limit, Math.min(limit, (my - half) * scale));
  return [Math.round(wx), Math.round(wz)];
}

export function getOrBuildTerrainCanvas(): HTMLCanvasElement {
  if (cachedTerrainCanvas) return cachedTerrainCanvas;

  const offscreen = document.createElement("canvas");
  offscreen.width = MAP_PX;
  offscreen.height = MAP_PX;
  const ctx = offscreen.getContext("2d");
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

  // Lưới tọa độ 6x6
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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

  const drawLakeOutline = (lx: number, lz: number, radius: number) => {
    const [sx, sy] = worldToMap(lx, lz);
    const rPx = (radius / WORLD_CONFIG.islandLimit) * (MAP_PX / 2);
    ctx.fillStyle = "rgba(14, 165, 233, 0.58)";
    ctx.strokeStyle = "rgba(125, 211, 252, 0.92)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, rPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  drawLakeOutline(
    WORLD_CONFIG.oasisX,
    WORLD_CONFIG.oasisZ,
    WORLD_CONFIG.oasisRadius,
  );
  drawLakeOutline(
    WORLD_CONFIG.highlandLakeX,
    WORLD_CONFIG.highlandLakeZ,
    WORLD_CONFIG.highlandLakeRadius,
  );

  const landmarks = [
    {
      label: "💧 Hồ Oasis",
      x: WORLD_CONFIG.oasisX,
      z: WORLD_CONFIG.oasisZ - 36,
      color: "#7dd3fc",
    },
    {
      label: "💧 Hồ Cao Nguyên",
      x: WORLD_CONFIG.highlandLakeX,
      z: WORLD_CONFIG.highlandLakeZ - 44,
      color: "#7dd3fc",
    },
    { label: "🏔️ Núi Đá Đông Nam", x: 210, z: 170, color: "#e2e8f0" },
    { label: "🏔️ Đỉnh Tây Bắc", x: -220, z: -160, color: "#e2e8f0" },
    { label: "🌿 Thung Lũng Trũng", x: -140, z: 20, color: "#bbf7d0" },
    { label: "⭐ Bãi Cỏ Trung Tâm", x: 0, z: 20, color: "#fef08a" },
  ];

  ctx.font = "bold 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const lm of landmarks) {
    const [lx, ly] = worldToMap(lm.x, lm.z);
    ctx.fillStyle = "rgba(2, 6, 23, 0.8)";
    ctx.fillText(lm.label, lx + 1, ly + 1);
    ctx.fillStyle = lm.color;
    ctx.fillText(lm.label, lx, ly);
  }

  cachedTerrainCanvas = offscreen;
  return offscreen;
}

export function renderWorldMapFrame(
  ctx: CanvasRenderingContext2D,
  bgCanvas: HTMLCanvasElement,
  now: number,
  myId: string | null,
  myPackId: string,
  waypoint: MapWaypoint | null,
): void {
  ctx.clearRect(0, 0, MAP_PX, MAP_PX);
  ctx.drawImage(bgCanvas, 0, 0);

  // 1. Vệt máu truy dấu
  for (let i = 0; i < bloodTrailsMutable.length; i++) {
    const bt = bloodTrailsMutable[i];
    const [bx, by] = worldToMap(bt.x, bt.z);
    ctx.fillStyle = "rgba(220, 38, 38, 0.72)";
    ctx.beginPath();
    ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Nguồn thức ăn
  for (const id of Object.keys(foodsMutable)) {
    const f = foodsMutable[id];
    if (!f || f.amount <= 0) continue;
    const [fx, fy] = worldToMap(f.x, f.z);
    ctx.fillStyle = f.type === "meat" ? "#f43f5e" : "#86efac";
    if (f.type === "meat") {
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

  // 3. Các sinh vật khác (ưu tiên đồng đội bầy đàn màu xanh dương)
  for (const id of Object.keys(playersMutable)) {
    if (id === myId) continue;
    const p = playersMutable[id];
    if (!p) continue;
    const [px, py] = worldToMap(p.x, p.z);
    const isPackmate = Boolean(!p.isAi && myPackId && p.packId === myPackId);
    const isHunting = p.aiState === "CHASE" || p.aiState === "ATTACK";

    ctx.fillStyle = isPackmate
      ? "#38bdf8"
      : isHunting
        ? "#f97316"
        : p.diet === "herbivore"
          ? "#34d399"
          : p.isAi
            ? "#a78bfa"
            : "#ef4444";

    const radius = isPackmate
      ? 6.2
      : !p.isAi
        ? 6
        : p.growth && p.growth > 1.1
          ? 5.5
          : 4.2;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isPackmate) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    if (isPackmate || !p.isAi || (p.growth && p.growth >= 1.25)) {
      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
      ctx.fillText(p.name, px + 1, py - 8);
      ctx.fillStyle = isPackmate ? "#7dd3fc" : !p.isAi ? "#fca5a5" : "#e9d5ff";
      ctx.fillText(p.name, px, py - 9);
    }
  }

  const [meX, meY] = worldToMap(
    localTransformMutable.x,
    localTransformMutable.z,
  );

  // 4. Đường dẫn & điểm ghim Waypoint
  if (waypoint) {
    const [wx, wy] = worldToMap(waypoint.x, waypoint.z);
    const distM = Math.round(
      Math.hypot(
        waypoint.x - localTransformMutable.x,
        waypoint.z - localTransformMutable.z,
      ),
    );
    ctx.save();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = "rgba(250, 204, 21, 0.9)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(meX, meY);
    ctx.lineTo(wx, wy);
    ctx.stroke();
    ctx.restore();

    const pulse = 9 + Math.sin(now * 0.008) * 3.5;
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(wx, wy, pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(wx, wy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fef08a";
    ctx.fillText(`📍 ${distM}m`, wx, wy - 14);
  }

  // 5. Người chơi hiện tại
  const rot = localTransformMutable.rot;
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(meX, meY);
  ctx.lineTo(meX + Math.sin(rot) * 20, meY + Math.cos(rot) * 20);
  ctx.stroke();

  ctx.fillStyle = "#fde047";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(meX, meY, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
