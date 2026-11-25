export const OASIS_X = 60;
export const OASIS_Z = -60;
export const OASIS_RADIUS = 26;

export const HIGHLAND_LAKE_X = -160;
export const HIGHLAND_LAKE_Z = 140;
export const HIGHLAND_LAKE_RADIUS = 32;

export const ISLAND_LIMIT = 450;
export const WATER_LEVEL = -0.35;

export interface WorldRock {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: number;
  radius: number;
}

function clamp(v: number, minV: number, maxV: number): number {
  return v < minV ? minV : v > maxV ? maxV : v;
}

// Khớp 100% với server/internal/world/obstacles.go -> GetTerrainHeight
export function getTerrainHeight(x: number, z: number): number {
  const distOrigin = Math.hypot(x, z);

  let hills =
    Math.sin(x * 0.011) * Math.cos(z * 0.011) * 11.0 +
    Math.sin(x * 0.024 + z * 0.017) * 4.5 +
    Math.cos(x * 0.0055 - z * 0.0065) * 9.0;

  const dPeak1 = Math.hypot(x - 210, z - 170);
  if (dPeak1 < 120) {
    const t = 1 - dPeak1 / 120;
    hills += t * t * 34;
  }
  const dPeak2 = Math.hypot(x + 220, z + 160);
  if (dPeak2 < 130) {
    const t = 1 - dPeak2 / 130;
    hills += t * t * 38;
  }

  const dValley = Math.hypot(x + 140, z - 20);
  if (dValley < 110) {
    const t = 1 - dValley / 110;
    hills -= t * t * 8;
  }

  const spawnWeight = clamp((distOrigin - 32) / 55, 0, 1);
  let h = 0.8 + hills * spawnWeight;

  const dOasis = Math.hypot(x - OASIS_X, z - OASIS_Z);
  if (dOasis < OASIS_RADIUS + 18) {
    let t = clamp((dOasis - OASIS_RADIUS) / 18, 0, 1);
    t = t * t * (3 - 2 * t);
    h = -2.2 * (1 - t) + h * t;
  }

  const dLake2 = Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z);
  if (dLake2 < HIGHLAND_LAKE_RADIUS + 22) {
    let t = clamp((dLake2 - HIGHLAND_LAKE_RADIUS) / 22, 0, 1);
    t = t * t * (3 - 2 * t);
    h = -2.2 * (1 - t) + h * t;
  }

  if (distOrigin > 370) {
    const angle = Math.atan2(z, x);
    const edgeT = (distOrigin - 370) / 140;
    const ridge = 0.72 + 0.28 * Math.sin(angle * 7) + 0.14 * Math.cos(angle * 13);
    h += edgeT * edgeT * 62 * ridge;
  }

  return h;
}

export function isNearWater(x: number, z: number): boolean {
  return (
    Math.hypot(x - OASIS_X, z - OASIS_Z) <= OASIS_RADIUS + 6 ||
    Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z) <= HIGHLAND_LAKE_RADIUS + 6
  );
}

// Công thức phóng to rõ rệt theo độ tuổi: Baby (0.35 -> 0.57x) | Adult (1.0 -> 1.32x) | Apex (1.25 -> 1.61x)
export function calcGrowthVisualScale(growth: number): number {
  const g = clamp(growth, 0.3, 1.35);
  return 0.17 + 1.15 * g;
}

export const WORLD_ROCKS: WorldRock[] = (() => {
  const list: WorldRock[] = [];
  for (let i = 0; i < 140; i++) {
    const angle = i * 2.3999632 + (i % 5) * 0.11;
    const dist = 30 + ((i * 19.37) % 360);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (Math.hypot(x - OASIS_X, z - OASIS_Z) < OASIS_RADIUS + 10) continue;
    if (Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z) < HIGHLAND_LAKE_RADIUS + 10) continue;

    const y = getTerrainHeight(x, z);
    if (y > 24) continue;

    const sy = 1.6 + (i % 5) * 1.15;
    const sx = 1.6 + (i % 4) * 1.35;
    const sz = 1.6 + (i % 3) * 1.45;
    list.push({
      pos: [x, y + sy * 0.25, z],
      scale: [sx, sy, sz],
      rot: i * 0.9,
      radius: Math.max(sx, sz) * 1.15,
    });
  }
  return list;
})();