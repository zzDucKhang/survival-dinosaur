import type { StateCreator } from "zustand";
import { ipcSocket } from "../../services/ipcSocket";
import type { GameStore } from "../useGameStore";

export interface UiSlice {
  isSettingsOpen: boolean;
  isMapOpen: boolean;
  isChatVisible: boolean;
  isChatOpen: boolean;
  showHelp: boolean;
  showLeaderboard: boolean;

  setSettingsOpen: (open: boolean) => void;
  setMapOpen: (open: boolean) => void;
  toggleMapOpen: () => void;
  toggleChatVisible: () => void;
  setChatOpen: (open: boolean) => void;
  toggleHelp: () => void;
  setShowLeaderboard: (open: boolean) => void;
}

function syncFocus(next: {
  isSettingsOpen: boolean;
  isMapOpen: boolean;
  isChatOpen: boolean;
}): void {
  ipcSocket.setUiFocus(
    next.isSettingsOpen || next.isMapOpen || next.isChatOpen,
  );
}

export const createUiSlice: StateCreator<GameStore, [], [], UiSlice> = (
  set,
  get,
) => ({
  isSettingsOpen: false,
  isMapOpen: false,
  isChatVisible: true,
  isChatOpen: false,
  showHelp: false,
  showLeaderboard: false,

  setSettingsOpen: (open) => {
    const nextMap = open ? false : get().isMapOpen;
    set({ isSettingsOpen: open, isMapOpen: nextMap });
    syncFocus({
      isSettingsOpen: open,
      isMapOpen: nextMap,
      isChatOpen: get().isChatOpen,
    });
  },

  setMapOpen: (open) => {
    const nextSettings = open ? false : get().isSettingsOpen;
    set({ isMapOpen: open, isSettingsOpen: nextSettings });
    syncFocus({
      isSettingsOpen: nextSettings,
      isMapOpen: open,
      isChatOpen: get().isChatOpen,
    });
  },

  toggleMapOpen: () => {
    const nextMap = !get().isMapOpen;
    const nextSettings = nextMap ? false : get().isSettingsOpen;
    set({ isMapOpen: nextMap, isSettingsOpen: nextSettings });
    syncFocus({
      isSettingsOpen: nextSettings,
      isMapOpen: nextMap,
      isChatOpen: get().isChatOpen,
    });
  },

  toggleChatVisible: () => {
    const nextVisible = !get().isChatVisible;
    const nextOpen = nextVisible ? get().isChatOpen : false;
    set({ isChatVisible: nextVisible, isChatOpen: nextOpen });
    syncFocus({
      isSettingsOpen: get().isSettingsOpen,
      isMapOpen: get().isMapOpen,
      isChatOpen: nextOpen,
    });
  },

  setChatOpen: (open) => {
    set({ isChatOpen: open, isChatVisible: open ? true : get().isChatVisible });
    syncFocus({
      isSettingsOpen: get().isSettingsOpen,
      isMapOpen: get().isMapOpen,
      isChatOpen: open,
    });
  },

  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),

  setShowLeaderboard: (open) => {
    if (get().showLeaderboard !== open) {
      set({ showLeaderboard: open });
    }
  },
});
