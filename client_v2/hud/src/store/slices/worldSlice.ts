import type { StateCreator } from "zustand";
import type { ChatMessage, MapWaypoint, WeatherType } from "../../types";
import { ipcSocket } from "../../services/ipcSocket";
import { syncGuardsMutable } from "../mutableCache";
import type { GameStore } from "../useGameStore";

export interface WorldSlice {
  playerIds: string[];
  foodIds: string[];
  bloodTrailsVersion: number;
  weather: WeatherType;
  scentRemaining: number;
  mapWaypoint: MapWaypoint | null;
  chatMessages: ChatMessage[];

  setMapWaypoint: (wp: MapWaypoint | null) => void;
}

export const createWorldSlice: StateCreator<GameStore, [], [], WorldSlice> = (
  set,
) => ({
  playerIds: [],
  foodIds: [],
  bloodTrailsVersion: 0,
  weather: "clear",
  scentRemaining: 0,
  mapWaypoint: null,
  chatMessages: [],

  setMapWaypoint: (wp) => {
    syncGuardsMutable.waypointIgnoreUntil = performance.now() + 400;
    set({ mapWaypoint: wp });
    if (wp) {
      ipcSocket.setWaypoint(wp.x, wp.z);
    } else {
      ipcSocket.clearWaypoint();
    }
  },
});
