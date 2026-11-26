import type { BloodTrail, CombatEvent, FoodItem, PlayerData } from "../types";

export const playersMutable: Record<string, PlayerData> = {};
export const foodsMutable: Record<string, FoodItem> = {};
export const bloodTrailsMutable: BloodTrail[] = [];
export const localTransformMutable = { x: 0, y: 0, z: 0, rot: 0 };
export const worldTimeMutable = { value: 0.36 };
export const combatEventsQueue: Array<CombatEvent & { createdAt: number }> = [];
