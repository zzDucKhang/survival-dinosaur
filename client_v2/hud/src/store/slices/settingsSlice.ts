import type { StateCreator } from "zustand";
import type { GraphicsQuality } from "../../types";
import { ipcSocket } from "../../services/ipcSocket";
import { soundEngine } from "../../services/soundEngine";
import { syncGuardsMutable } from "../mutableCache";
import type { GameStore } from "../useGameStore";

export interface SettingsSlice {
  nightVision: boolean;
  brightness: number;
  graphicsQuality: GraphicsQuality;
  dinoScaleMultiplier: number;
  soundEnabled: boolean;

  toggleNightVision: () => void;
  setBrightness: (val: number) => void;
  setGraphicsQuality: (q: GraphicsQuality) => void;
  setDinoScaleMultiplier: (val: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  rotateModel90: () => void;
}

export const createSettingsSlice: StateCreator<
  GameStore,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  nightVision: false,
  brightness: 1.25,
  graphicsQuality: "medium",
  dinoScaleMultiplier: 1.0,
  soundEnabled: true,

  toggleNightVision: () => {
    syncGuardsMutable.settingsIgnoreUntil = performance.now() + 400;
    set({ nightVision: !get().nightVision });
    ipcSocket.toggleNightVision();
  },

  setBrightness: (val) => {
    syncGuardsMutable.settingsIgnoreUntil = performance.now() + 400;
    const clamped = Math.round(Math.max(0.8, Math.min(2.2, val)) * 100) / 100;
    set({ brightness: clamped });
    ipcSocket.setBrightness(clamped);
  },

  setGraphicsQuality: (q) => {
    syncGuardsMutable.settingsIgnoreUntil = performance.now() + 400;
    set({ graphicsQuality: q });
    ipcSocket.setQuality(q);
  },

  setDinoScaleMultiplier: (val) => {
    syncGuardsMutable.settingsIgnoreUntil = performance.now() + 400;
    const clamped = Math.round(Math.max(0.3, Math.min(2.5, val)) * 10) / 10;
    set({ dinoScaleMultiplier: clamped });
    ipcSocket.setDinoScale(clamped);
  },

  setSoundEnabled: (enabled) => {
    soundEngine.setEnabled(enabled);
    set({ soundEnabled: enabled });
  },

  rotateModel90: () => {
    ipcSocket.rotateModel90();
  },
});
