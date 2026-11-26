export type DinoModelType = string;
export type DietType = "carnivore" | "herbivore";
export type AnimState =
  | "idle"
  | "walk"
  | "run"
  | "bite"
  | "roar"
  | "tail"
  | "rest";

export interface SpecialSkillSpec {
  name: string;
  desc: string;
  cooldown: number;
  damage: number;
  rangeBonus: number;
  is360: boolean;
  bleedSec: number;
  boneBreakSec: number;
  knockback: number;
  dashDist: number;
  anim: string;
}

export interface DinoSpec {
  id: DinoModelType;
  name: string;
  species: string;
  diet: DietType;
  fileName: string;
  badge: string;
  icon: string;
  description: string;
  baseMaxHp: number;
  biteDamage: number;
  bleedSec: number;
  special: SpecialSkillSpec;
}

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
