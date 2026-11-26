export type DinoModelType = string;
export type DietType = 'carnivore' | 'herbivore';
export type AnimState = 'idle' | 'walk' | 'run' | 'bite' | 'roar' | 'tail' | 'rest';
export type GraphicsQuality = 'low' | 'medium' | 'high';
export type WeatherType = 'clear' | 'fog' | 'rain' | 'storm';

export interface PlayerData {
  id: string;
  name: string;
  model?: DinoModelType;
  diet?: DietType;
  x: number;
  y?: number;
  z: number;
  rot: number;
  anim: string;
  hp?: number;
  maxHp?: number;
  hunger?: number;
  thirst?: number;
  growth?: number;
  bleed?: number;
  boneBreak?: number;
  specialCd?: number;
  kills?: number;
  isResting?: boolean;
  restUnlockLeft?: number;
  combatTimerLeft?: number;
  regenRate?: number;
  isCrouching?: boolean;
  packId?: string;
  packInviteFrom?: string;
  packInviteName?: string;
  respawnSeq?: number;
  lastKilledBy?: string;
  isAi?: boolean;
  aiState?: string;
}

export interface FoodItem {
  id: string;
  type: 'meat' | 'plant';
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