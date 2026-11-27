import { create } from "zustand";
import { scheduleTerrainPrewarm } from "../features/map/mapRenderer";
import type {
  BloodTrail,
  ChatMessage,
  CombatEvent,
  FoodItem,
  LocalTelemetryMsg,
  PlayerData,
  WeatherType,
} from "../types";
import {
  bloodTrailsMutable,
  combatEventsQueue,
  foodsMutable,
  localTransformMutable,
  playersMutable,
  syncGuardsMutable,
  worldTimeMutable,
} from "./mutableCache";
import {
  createConnectionSlice,
  type ConnectionSlice,
} from "./slices/connectionSlice";
import { createVitalsSlice, type VitalsSlice } from "./slices/vitalsSlice";
import { createWorldSlice, type WorldSlice } from "./slices/worldSlice";
import { createUiSlice, type UiSlice } from "./slices/uiSlice";
import {
  createSettingsSlice,
  type SettingsSlice,
} from "./slices/settingsSlice";

interface SyncActions {
  applyLocalTelemetry: (msg: LocalTelemetryMsg) => void;
  syncFromServer: (payload: {
    players?: Record<string, PlayerData>;
    foods?: Record<string, FoodItem>;
    bloodTrails?: BloodTrail[];
    events?: CombatEvent[];
    chats?: ChatMessage[];
    worldTime?: number;
    weather?: WeatherType;
  }) => void;
}

export type GameStore = ConnectionSlice &
  VitalsSlice &
  WorldSlice &
  UiSlice &
  SettingsSlice &
  SyncActions;

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const useGameStore = create<GameStore>()((...a) => {
  const [set, get] = a;
  return {
    ...createConnectionSlice(...a),
    ...createVitalsSlice(...a),
    ...createWorldSlice(...a),
    ...createUiSlice(...a),
    ...createSettingsSlice(...a),

    applyLocalTelemetry: (msg) => {
      localTransformMutable.x = msg.x;
      localTransformMutable.y = msg.y;
      localTransformMutable.z = msg.z;
      localTransformMutable.rot = msg.rot;

      const now = performance.now();
      const s = get();
      const patch: Partial<GameStore> = {};

      if (msg.serverConnected !== s.serverConnected)
        patch.serverConnected = msg.serverConnected;

      if (now >= syncGuardsMutable.leaveIgnoreUntil) {
        if (msg.isJoined !== s.isJoined) {
          patch.isJoined = msg.isJoined;
          if (msg.isJoined) {
            scheduleTerrainPrewarm();
          }
        }
        if (msg.myId && msg.myId !== s.myId) {
          patch.myId = msg.myId;
        } else if (!msg.isJoined && msg.myId === null && s.myId !== null) {
          patch.myId = null;
        }
      }

      if (msg.myName && msg.myName !== s.myName) patch.myName = msg.myName;
      if (msg.myModel && msg.myModel !== s.selectedModel)
        patch.selectedModel = msg.myModel;
      if (Math.round(msg.stamina) !== s.stamina)
        patch.stamina = Math.round(msg.stamina);
      if (msg.fps !== s.fps) patch.fps = msg.fps;
      if (msg.actionHint !== s.actionHint) patch.actionHint = msg.actionHint;

      if (now >= syncGuardsMutable.settingsIgnoreUntil) {
        if (msg.nightVision !== s.nightVision)
          patch.nightVision = msg.nightVision;
        if (msg.quality !== s.graphicsQuality)
          patch.graphicsQuality = msg.quality;
        if (Math.abs(msg.brightness - s.brightness) > 0.01)
          patch.brightness = msg.brightness;
        if (Math.abs(msg.dinoScale - s.dinoScaleMultiplier) > 0.01) {
          patch.dinoScaleMultiplier = msg.dinoScale;
        }
      }

      if (msg.scentRemaining !== s.scentRemaining)
        patch.scentRemaining = msg.scentRemaining;

      if (now >= syncGuardsMutable.waypointIgnoreUntil) {
        const wp = msg.waypoint
          ? { x: msg.waypoint[0], z: msg.waypoint[1] }
          : null;
        if (
          (wp === null && s.mapWaypoint !== null) ||
          (wp !== null &&
            (s.mapWaypoint?.x !== wp.x || s.mapWaypoint?.z !== wp.z))
        ) {
          patch.mapWaypoint = wp;
        }
      }

      if (Object.keys(patch).length > 0) {
        set(patch);
      }
    },

    syncFromServer: ({
      players,
      foods,
      bloodTrails,
      events,
      chats,
      worldTime,
      weather,
    }) => {
      if (typeof worldTime === "number") {
        worldTimeMutable.value = worldTime;
      }

      const state = get();
      const patch: Partial<GameStore> = {};

      if (weather && weather !== state.weather) {
        patch.weather = weather;
      }

      if (players) {
        for (const key in playersMutable) {
          if (!(key in players)) delete playersMutable[key];
        }
        const incomingIds: string[] = [];
        for (const id in players) {
          playersMutable[id] = players[id];
          incomingIds.push(id);
        }

        const myId = state.myId;
        if (myId && players[myId]) {
          const me = players[myId];
          const nextHp = typeof me.hp === "number" ? me.hp : state.health;
          const nextMaxHp =
            typeof me.maxHp === "number" ? me.maxHp : state.maxHealth;
          const nextHunger =
            typeof me.hunger === "number"
              ? Math.round(me.hunger)
              : state.hunger;
          const nextThirst =
            typeof me.thirst === "number"
              ? Math.round(me.thirst)
              : state.thirst;
          const nextGrowth =
            typeof me.growth === "number"
              ? Math.round(me.growth * 100) / 100
              : state.growth;
          const nextBleed =
            typeof me.bleed === "number" ? Math.ceil(me.bleed) : state.bleed;
          const nextBoneBreak =
            typeof me.boneBreak === "number"
              ? Math.ceil(me.boneBreak)
              : state.boneBreak;
          const nextSpecialCd =
            typeof me.specialCd === "number"
              ? Math.max(0, Math.round(me.specialCd * 10) / 10)
              : 0;
          const nextKills =
            typeof me.kills === "number" ? me.kills : state.kills;
          const nextResting = Boolean(me.isResting);
          const nextRestUnlock =
            typeof me.restUnlockLeft === "number"
              ? Math.max(0, Math.round(me.restUnlockLeft * 10) / 10)
              : 0;
          const nextCombatTimer =
            typeof me.combatTimerLeft === "number"
              ? Math.max(0, Math.ceil(me.combatTimerLeft))
              : 0;
          const nextRegenRate =
            typeof me.regenRate === "number" ? me.regenRate : 0;
          const nextCrouching = Boolean(me.isCrouching);
          const nextPackId = me.packId || "";
          const nextInviteFrom = me.packInviteFrom || "";
          const nextInviteName = me.packInviteName || "";
          const nextRespawnSeq =
            typeof me.respawnSeq === "number"
              ? me.respawnSeq
              : state.respawnSeq;

          if (nextHp !== state.health) patch.health = nextHp;
          if (nextMaxHp !== state.maxHealth) patch.maxHealth = nextMaxHp;
          if (nextHunger !== state.hunger) patch.hunger = nextHunger;
          if (nextThirst !== state.thirst) patch.thirst = nextThirst;
          if (nextGrowth !== state.growth) patch.growth = nextGrowth;
          if (nextBleed !== state.bleed) patch.bleed = nextBleed;
          if (nextBoneBreak !== state.boneBreak)
            patch.boneBreak = nextBoneBreak;
          if (nextSpecialCd !== state.specialCd)
            patch.specialCd = nextSpecialCd;
          if (nextKills !== state.kills) patch.kills = nextKills;
          if (nextResting !== state.isResting) patch.isResting = nextResting;
          if (nextRestUnlock !== state.restUnlockLeft)
            patch.restUnlockLeft = nextRestUnlock;
          if (nextCombatTimer !== state.combatTimerLeft)
            patch.combatTimerLeft = nextCombatTimer;
          if (nextRegenRate !== state.regenRate)
            patch.regenRate = nextRegenRate;
          if (nextCrouching !== state.isCrouching)
            patch.isCrouching = nextCrouching;
          if (nextPackId !== state.packId) patch.packId = nextPackId;
          if (nextInviteFrom !== state.packInviteFrom)
            patch.packInviteFrom = nextInviteFrom;
          if (nextInviteName !== state.packInviteName)
            patch.packInviteName = nextInviteName;
          if (nextRespawnSeq > state.respawnSeq) {
            patch.respawnSeq = nextRespawnSeq;
            patch.deathInfo = {
              killedBy: me.lastKilledBy || "Thiên nhiên khắc nghiệt",
              diedAt: performance.now(),
            };
          }
        }

        if (!arraysEqual(state.playerIds, incomingIds)) {
          patch.playerIds = incomingIds;
        }
      }

      if (foods) {
        for (const key in foodsMutable) {
          if (!(key in foods)) delete foodsMutable[key];
        }
        const incomingFoodIds: string[] = [];
        for (const id in foods) {
          foodsMutable[id] = foods[id];
          incomingFoodIds.push(id);
        }
        if (!arraysEqual(state.foodIds, incomingFoodIds)) {
          patch.foodIds = incomingFoodIds;
        }
      }

      if (bloodTrails) {
        bloodTrailsMutable.length = 0;
        for (let i = 0; i < bloodTrails.length; i++) {
          bloodTrailsMutable.push(bloodTrails[i]);
        }
        patch.bloodTrailsVersion = state.bloodTrailsVersion + 1;
      }

      if (events && events.length > 0) {
        const now = performance.now();
        for (const evt of events) {
          combatEventsQueue.push({ ...evt, createdAt: now });
          if (
            state.myId &&
            evt.targetId === state.myId &&
            evt.attackType !== "heal" &&
            evt.attackType !== "roar"
          ) {
            patch.lastDamagedAt = now;
          }
        }
        if (combatEventsQueue.length > 45) {
          combatEventsQueue.splice(0, combatEventsQueue.length - 45);
        }
      }

      if (chats && chats.length > 0) {
        patch.chatMessages = [...state.chatMessages, ...chats].slice(-30);
      }

      if (Object.keys(patch).length > 0) {
        set(patch);
      }
    },
  };
});
