import type { StateCreator } from "zustand";
import type { DinoModelType } from "../../types";
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
  setJoined: (joined) =>
    set(
      joined
        ? { isJoined: true, deathInfo: null }
        : {
            isJoined: false,
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
          },
    ),
});
