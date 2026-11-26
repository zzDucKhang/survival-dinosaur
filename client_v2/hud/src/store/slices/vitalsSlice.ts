import type { StateCreator } from "zustand";
import type { DeathInfo } from "../../types";
import type { GameStore } from "../useGameStore";

export interface VitalsSlice {
  stamina: number;
  health: number;
  maxHealth: number;
  hunger: number;
  thirst: number;
  growth: number;
  bleed: number;
  boneBreak: number;
  specialCd: number;
  kills: number;
  isResting: boolean;
  restUnlockLeft: number;
  combatTimerLeft: number;
  regenRate: number;
  isCrouching: boolean;
  packId: string;
  packInviteFrom: string;
  packInviteName: string;
  respawnSeq: number;
  deathInfo: DeathInfo | null;
  lastDamagedAt: number;
  actionHint: string | null;

  dismissDeathOverlay: () => void;
}

export const createVitalsSlice: StateCreator<GameStore, [], [], VitalsSlice> = (
  set,
) => ({
  stamina: 100,
  health: 100,
  maxHealth: 100,
  hunger: 90,
  thirst: 90,
  growth: 0.45,
  bleed: 0,
  boneBreak: 0,
  specialCd: 0,
  kills: 0,
  isResting: false,
  restUnlockLeft: 0,
  combatTimerLeft: 0,
  regenRate: 0,
  isCrouching: false,
  packId: "",
  packInviteFrom: "",
  packInviteName: "",
  respawnSeq: 0,
  deathInfo: null,
  lastDamagedAt: 0,
  actionHint: null,

  dismissDeathOverlay: () => set({ deathInfo: null }),
});
