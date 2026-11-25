export type DinoModelType = string;
export type DietType = 'carnivore' | 'herbivore';
export type AnimState = 'idle' | 'walk' | 'run' | 'bite' | 'roar' | 'tail';
export type GraphicsQuality = 'low' | 'medium' | 'high';

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
  kills?: number;
  isResting?: boolean;
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