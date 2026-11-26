import rawWorld from "../../../shared/world_config.json";
import type { WorldConfig } from "../types";

export const WORLD_CONFIG: WorldConfig = rawWorld as WorldConfig;

function clamp(v: number, minV: number, maxV: number): number {
  return v < minV ? minV : v > maxV ? maxV : v;
}

export function getTerrainHeight(x: number, z: number): number {
  const cfg = WORLD_CONFIG;
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

  const dOasis = Math.hypot(x - cfg.oasisX, z - cfg.oasisZ);
  if (dOasis < cfg.oasisRadius + 18) {
    let t = clamp((dOasis - cfg.oasisRadius) / 18, 0, 1);
    t = t * t * (3 - 2 * t);
    h = -2.2 * (1 - t) + h * t;
  }

  const dLake2 = Math.hypot(x - cfg.highlandLakeX, z - cfg.highlandLakeZ);
  if (dLake2 < cfg.highlandLakeRadius + 22) {
    let t = clamp((dLake2 - cfg.highlandLakeRadius) / 22, 0, 1);
    t = t * t * (3 - 2 * t);
    h = -2.2 * (1 - t) + h * t;
  }

  if (distOrigin > 370) {
    const angle = Math.atan2(z, x);
    const edgeT = (distOrigin - 370) / 140;
    const ridge =
      0.72 + 0.28 * Math.sin(angle * 7) + 0.14 * Math.cos(angle * 13);
    h += edgeT * edgeT * 62 * ridge;
  }

  return h;
}

export function isInsideLake(x: number, z: number): boolean {
  const cfg = WORLD_CONFIG;
  return (
    Math.hypot(x - cfg.oasisX, z - cfg.oasisZ) <= cfg.oasisRadius + 4 ||
    Math.hypot(x - cfg.highlandLakeX, z - cfg.highlandLakeZ) <=
      cfg.highlandLakeRadius + 5
  );
}
