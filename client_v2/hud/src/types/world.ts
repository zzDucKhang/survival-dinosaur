export type GraphicsQuality = "low" | "medium" | "high";
export type WeatherType = "clear" | "fog" | "rain" | "storm";

export interface WorldConfig {
  oasisX: number;
  oasisZ: number;
  oasisRadius: number;
  highlandLakeX: number;
  highlandLakeZ: number;
  highlandLakeRadius: number;
  islandLimit: number;
  waterLevel: number;
  terrainSize: number;
  terrainSegments: number;
  rockCount: number;
  initialPlantCount: number;
}

export interface FoodItem {
  id: string;
  type: "meat" | "plant";
  x: number;
  z: number;
  amount: number;
  maxAmount: number;
}

export interface BloodTrail {
  id: string;
  x: number;
  z: number;
}

export interface CombatEvent {
  id: string;
  attackerId: string;
  targetId: string;
  damage: number;
  targetHp: number;
  isKill: boolean;
  attackType: string;
  x: number;
  y: number;
  z: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  ts: number;
  isSystem?: boolean;
}

export interface MapWaypoint {
  x: number;
  z: number;
}

export interface DeathInfo {
  killedBy: string;
  diedAt: number;
}
