export const OASIS_X = 60;
export const OASIS_Z = -60;
export const OASIS_RADIUS = 26;
export const HIGHLAND_LAKE_X = -160;
export const HIGHLAND_LAKE_Z = 140;
export const HIGHLAND_LAKE_RADIUS = 32;
export const ISLAND_LIMIT = 450;
export const WATER_LEVEL = -0.35;

export const TERRAIN_SIZE = 1200;
export const TERRAIN_SEGMENTS = 128;

export interface WorldRock {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: number;
  radius: number;
}

function clamp(v: number, minV: number, maxV: number): number {
  return v < minV ? minV : v > maxV ? maxV : v;
}

// Công thức giải tích khớp 100% với server/internal/world/obstacles.go -> GetTerrainHeight
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

// Nội suy chính xác độ cao trên đúng mặt tam giác của PlaneGeometry(1200, 1200, 128, 128)
// Fix triệt để lỗi chân khủng long lơ lửng hoặc chìm ở vùng trũng / sườn dốc
export function getMeshTerrainHeight(x: number, z: number): number {
  const half = TERRAIN_SIZE / 2;
  const cellSize = TERRAIN_SIZE / TERRAIN_SEGMENTS;
  const gx = clamp((x + half) / cellSize, 0, TERRAIN_SEGMENTS - 0.0001);
  const gz = clamp((z + half) / cellSize, 0, TERRAIN_SEGMENTS - 0.0001);
  const ix = Math.floor(gx);
  const iz = Math.floor(gz);
  const u = gx - ix;
  const v = gz - iz;

  const x0 = ix * cellSize - half;
  const x1 = x0 + cellSize;
  const z0 = iz * cellSize - half;
  const z1 = z0 + cellSize;

  const hD = getTerrainHeight(x1, z0);
  const hB = getTerrainHeight(x0, z1);

  if (u + v <= 1) {
    const hA = getTerrainHeight(x0, z0);
    return hA + u * (hD - hA) + v * (hB - hA);
  }
  const hC = getTerrainHeight(x1, z1);
  return hC + (1 - u) * (hB - hC) + (1 - v) * (hD - hC);
}

export function isInsideLake(x: number, z: number): boolean {
  return (
    Math.hypot(x - OASIS_X, z - OASIS_Z) <= OASIS_RADIUS + 4 ||
    Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z) <= HIGHLAND_LAKE_RADIUS + 5
  );
}

export function isNearWater(x: number, z: number): boolean {
  return (
    Math.hypot(x - OASIS_X, z - OASIS_Z) <= OASIS_RADIUS + 6 ||
    Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z) <= HIGHLAND_LAKE_RADIUS + 6
  );
}

// Độ cao mặt đất cho sinh vật: trên thung lũng khô bám sát mặt đất (kể cả Y < 0),
// chỉ giữ mực lội nước khi thực sự đi vào lòng 2 hồ nước
export function getEntityGroundHeight(x: number, z: number): number {
  const groundY = getMeshTerrainHeight(x, z);
  if (isInsideLake(x, z)) {
    return Math.max(WATER_LEVEL - 0.85, groundY);
  }
  return groundY;
}

// Tính góc nghiêng pitch/roll theo độ dốc địa hình để thân thú áp sát lòng chảo & sườn đồi
export function getTerrainSlope(
  x: number,
  z: number,
  yaw: number,
  sampleDist = 1.6
): { pitch: number; roll: number } {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);

  const hFront = getEntityGroundHeight(x + fx * sampleDist, z + fz * sampleDist);
  const hBack = getEntityGroundHeight(x - fx * sampleDist, z - fz * sampleDist);
  const hRight = getEntityGroundHeight(x + rx * sampleDist, z + rz * sampleDist);
  const hLeft = getEntityGroundHeight(x - rx * sampleDist, z - rz * sampleDist);

  const pitch = clamp(-Math.atan2(hFront - hBack, sampleDist * 2), -0.38, 0.38);
  const roll = clamp(Math.atan2(hRight - hLeft, sampleDist * 2), -0.32, 0.32);
  return { pitch, roll };
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
    const y = getMeshTerrainHeight(x, z);
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