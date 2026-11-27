import type { StateCreator } from "zustand";
import type { DinoModelType } from "../../types";
import { syncGuardsMutable } from "../mutableCache";
import type { GameStore } from "../useGameStore";

export interface ConnectionSlice {
  ipcConnected: boolean;
  serverConnected: boolean;
  isJoined: boolean;
  myId: string | null;
  myName: string;
  selectedModel: DinoModelType;
  fps: number;

  setIpcConnected: (connected: boolean) => void;
  setMyId: (id: string) => void;
  setMyName: (name: string) => void;
  setSelectedModel: (model: DinoModelType) => void;
  setJoined: (joined: boolean) => void;
}

export const createConnectionSlice: StateCreator<
  GameStore,
  [],
  [],
  ConnectionSlice
> = (set) => ({
  ipcConnected: false,
  serverConnected: false,
  isJoined: false,
  myId: null,
  myName: "Apex Predator",
  selectedModel: "trex",
  fps: 60,

  setIpcConnected: (connected) =>
    set(
      connected
        ? { ipcConnected: true }
        : { ipcConnected: false, serverConnected: false },
    ),
  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setJoined: (joined) => {
    if (joined) {
      syncGuardsMutable.leaveIgnoreUntil = 0;
      set({ isJoined: true, deathInfo: null });
      return;
    }
    syncGuardsMutable.leaveIgnoreUntil = performance.now() + 450;
    set({
      isJoined: false,
      myId: null,
      respawnSeq: 0,
      health: 100,
      maxHealth: 100,
      kills: 0,
      bleed: 0,
      actionHint: null,
      isResting: false,
      restUnlockLeft: 0,
      combatTimerLeft: 0,
      regenRate: 0,
      isCrouching: false,
      boneBreak: 0,
      specialCd: 0,
      packId: "",
      packInviteFrom: "",
      packInviteName: "",
      deathInfo: null,
      showLeaderboard: false,
      isMapOpen: false,
      isSettingsOpen: false,
      mapWaypoint: null,
    });
  },
});
