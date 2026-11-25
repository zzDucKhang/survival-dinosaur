import { create } from 'zustand';
import type {
  ChatMessage,
  CombatEvent,
  DinoModelType,
  FoodItem,
  GraphicsQuality,
  PlayerData,
} from '../types/game';

export const playersMutable: Record<string, PlayerData> = {};
export const foodsMutable: Record<string, FoodItem> = {};
export const localTransformMutable = { x: 0, y: 0, z: 0, rot: 0 };
export const worldTimeMutable = { value: 0.36 };
export const combatEventsQueue: Array<CombatEvent & { createdAt: number }> = [];

const ROTATION_STORAGE_KEY = 'dino_isle_model_rotations_v1';

function loadSavedRotations(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ROTATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export interface DeathInfo {
  killedBy: string;
  diedAt: number;
}

export interface MapWaypoint {
  x: number;
  z: number;
}

interface GameStore {
  myId: string | null;
  myName: string;
  selectedModel: DinoModelType;
  dinoScaleMultiplier: number;
  modelRotationOffsets: Record<string, number>;
  isJoined: boolean;
  isConnected: boolean;
  playerIds: string[];
  foodIds: string[];
  stamina: number;
  health: number;
  maxHealth: number;
  hunger: number;
  thirst: number;
  growth: number;
  bleed: number;
  kills: number;
  isResting: boolean;
  restUnlockLeft: number;
  combatTimerLeft: number;
  regenRate: number;
  isCrouching: boolean;
  respawnSeq: number;
  deathInfo: DeathInfo | null;
  lastDamagedAt: number;
  scentUntil: number;
  actionHint: string | null;

  // HUD, World Map & The Isle extras
  isSettingsOpen: boolean;
  isMapOpen: boolean;
  mapWaypoint: MapWaypoint | null;
  isChatVisible: boolean;
  isChatOpen: boolean;
  showHelp: boolean;
  showLeaderboard: boolean;
  nightVision: boolean;
  brightness: number;
  graphicsQuality: GraphicsQuality;
  soundEnabled: boolean;
  chatMessages: ChatMessage[];

  setMyId: (id: string) => void;
  setMyName: (name: string) => void;
  setSelectedModel: (model: DinoModelType) => void;
  setDinoScaleMultiplier: (val: number) => void;
  rotateCurrentModel90: () => void;
  setJoined: (joined: boolean) => void;
  setConnected: (connected: boolean) => void;
  setStamina: (val: number) => void;
  setActionHint: (hint: string | null) => void;
  setSettingsOpen: (open: boolean) => void;
  setMapOpen: (open: boolean) => void;
  toggleMapOpen: () => void;
  setMapWaypoint: (wp: MapWaypoint | null) => void;
  toggleChatVisible: () => void;
  setChatOpen: (open: boolean) => void;
  toggleHelp: () => void;
  setShowLeaderboard: (open: boolean) => void;
  toggleNightVision: () => void;
  dismissDeathOverlay: () => void;
  setBrightness: (val: number) => void;
  setGraphicsQuality: (q: GraphicsQuality) => void;
  setSoundEnabled: (enabled: boolean) => void;
  triggerScent: () => void;
  syncFromServer: (payload: {
    players?: Record<string, PlayerData>;
    foods?: Record<string, FoodItem>;
    events?: CombatEvent[];
    chats?: ChatMessage[];
    worldTime?: number;
  }) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  myId: null,
  myName: 'Dino Hunter',
  selectedModel: 'trex',
  dinoScaleMultiplier: 1.0,
  modelRotationOffsets: loadSavedRotations(),
  isJoined: false,
  isConnected: false,
  playerIds: [],
  foodIds: [],
  stamina: 100,
  health: 100,
  maxHealth: 100,
  hunger: 90,
  thirst: 90,
  growth: 0.45,
  bleed: 0,
  kills: 0,
  isResting: false,
  restUnlockLeft: 0,
  combatTimerLeft: 0,
  regenRate: 0,
  isCrouching: false,
  respawnSeq: 0,
  deathInfo: null,
  lastDamagedAt: 0,
  scentUntil: 0,
  actionHint: null,

  isSettingsOpen: false,
  isMapOpen: false,
  mapWaypoint: null,
  isChatVisible: true,
  isChatOpen: false,
  showHelp: false,
  showLeaderboard: false,
  nightVision: false,
  brightness: 1.38,
  graphicsQuality: 'medium',
  soundEnabled: true,
  chatMessages: [],

  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setDinoScaleMultiplier: (val) =>
    set({ dinoScaleMultiplier: Math.round(Math.max(0.3, Math.min(2.5, val)) * 10) / 10 }),
  rotateCurrentModel90: () => {
    const modelId = get().selectedModel.toLowerCase();
    const current = get().modelRotationOffsets[modelId] || 0;
    const next = (current + Math.PI / 2) % (Math.PI * 2);
    const updated = { ...get().modelRotationOffsets, [modelId]: next };
    try {
      localStorage.setItem(ROTATION_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
    set({ modelRotationOffsets: updated });
  },
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
            deathInfo: null,
            showLeaderboard: false,
            isMapOpen: false,
            mapWaypoint: null,
          }
    ),
  setConnected: (connected) => set({ isConnected: connected }),
  setStamina: (val) => {
    const rounded = Math.round(val);
    if (Math.round(get().stamina) !== rounded) {
      set({ stamina: rounded });
    }
  },
  setActionHint: (hint) => {
    if (get().actionHint !== hint) set({ actionHint: hint });
  },
  setSettingsOpen: (open) => set({ isSettingsOpen: open, isMapOpen: open ? false : get().isMapOpen }),
  setMapOpen: (open) => set({ isMapOpen: open, isSettingsOpen: open ? false : get().isSettingsOpen }),
  toggleMapOpen: () =>
    set((s) => ({
      isMapOpen: !s.isMapOpen,
      isSettingsOpen: !s.isMapOpen ? false : s.isSettingsOpen,
    })),
  setMapWaypoint: (wp) => set({ mapWaypoint: wp }),
  toggleChatVisible: () =>
    set((s) => ({
      isChatVisible: !s.isChatVisible,
      isChatOpen: s.isChatVisible ? false : s.isChatOpen,
    })),
  setChatOpen: (open) =>
    set((s) => ({
      isChatOpen: open,
      isChatVisible: open ? true : s.isChatVisible,
    })),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
  setShowLeaderboard: (open) => {
    if (get().showLeaderboard !== open) set({ showLeaderboard: open });
  },
  toggleNightVision: () => set((s) => ({ nightVision: !s.nightVision })),
  dismissDeathOverlay: () => set({ deathInfo: null }),
  setBrightness: (val) => set({ brightness: Math.max(0.8, Math.min(2.2, val)) }),
  setGraphicsQuality: (q) => set({ graphicsQuality: q }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  triggerScent: () => set({ scentUntil: performance.now() + 6500 }),

  syncFromServer: ({ players, foods, events, chats, worldTime }) => {
    if (typeof worldTime === 'number') {
      worldTimeMutable.value = worldTime;
    }
    const state = get();
    const patch: Partial<GameStore> = {};

    if (players) {
      const incomingIds = Object.keys(players);
      for (const key of Object.keys(playersMutable)) {
        if (!(key in players)) delete playersMutable[key];
      }
      for (const id of incomingIds) {
        playersMutable[id] = players[id];
      }

      const myId = state.myId;
      if (myId && players[myId]) {
        const me = players[myId];
        const nextHp = typeof me.hp === 'number' ? me.hp : state.health;
        const nextMaxHp = typeof me.maxHp === 'number' ? me.maxHp : state.maxHealth;
        const nextHunger = typeof me.hunger === 'number' ? Math.round(me.hunger) : state.hunger;
        const nextThirst = typeof me.thirst === 'number' ? Math.round(me.thirst) : state.thirst;
        const nextGrowth =
          typeof me.growth === 'number' ? Math.round(me.growth * 100) / 100 : state.growth;
        const nextBleed = typeof me.bleed === 'number' ? Math.ceil(me.bleed) : state.bleed;
        const nextKills = typeof me.kills === 'number' ? me.kills : state.kills;
        const nextResting = Boolean(me.isResting);
        const nextRestUnlock =
          typeof me.restUnlockLeft === 'number'
            ? Math.max(0, Math.round(me.restUnlockLeft * 10) / 10)
            : 0;
        const nextCombatTimer =
          typeof me.combatTimerLeft === 'number' ? Math.max(0, Math.ceil(me.combatTimerLeft)) : 0;
        const nextRegenRate = typeof me.regenRate === 'number' ? me.regenRate : 0;
        const nextCrouching = Boolean(me.isCrouching);
        const nextRespawnSeq = typeof me.respawnSeq === 'number' ? me.respawnSeq : state.respawnSeq;

        if (nextHp !== state.health) patch.health = nextHp;
        if (nextMaxHp !== state.maxHealth) patch.maxHealth = nextMaxHp;
        if (nextHunger !== state.hunger) patch.hunger = nextHunger;
        if (nextThirst !== state.thirst) patch.thirst = nextThirst;
        if (nextGrowth !== state.growth) patch.growth = nextGrowth;
        if (nextBleed !== state.bleed) patch.bleed = nextBleed;
        if (nextKills !== state.kills) patch.kills = nextKills;
        if (nextResting !== state.isResting) patch.isResting = nextResting;
        if (nextRestUnlock !== state.restUnlockLeft) patch.restUnlockLeft = nextRestUnlock;
        if (nextCombatTimer !== state.combatTimerLeft) patch.combatTimerLeft = nextCombatTimer;
        if (nextRegenRate !== state.regenRate) patch.regenRate = nextRegenRate;
        if (nextCrouching !== state.isCrouching) patch.isCrouching = nextCrouching;
        if (nextRespawnSeq > state.respawnSeq) {
          patch.respawnSeq = nextRespawnSeq;
          patch.deathInfo = {
            killedBy: me.lastKilledBy || 'Thiên nhiên khắc nghiệt',
            diedAt: performance.now(),
          };
        }
      }

      let idsChanged = state.playerIds.length !== incomingIds.length;
      if (!idsChanged) {
        for (let i = 0; i < incomingIds.length; i++) {
          if (state.playerIds[i] !== incomingIds[i]) {
            idsChanged = true;
            break;
          }
        }
      }
      if (idsChanged) patch.playerIds = incomingIds;
    }

    if (foods) {
      const incomingFoodIds = Object.keys(foods);
      for (const key of Object.keys(foodsMutable)) {
        if (!(key in foods)) delete foodsMutable[key];
      }
      for (const id of incomingFoodIds) {
        foodsMutable[id] = foods[id];
      }
      let foodChanged = state.foodIds.length !== incomingFoodIds.length;
      if (!foodChanged) {
        for (let i = 0; i < incomingFoodIds.length; i++) {
          if (state.foodIds[i] !== incomingFoodIds[i]) {
            foodChanged = true;
            break;
          }
        }
      }
      if (foodChanged) patch.foodIds = incomingFoodIds;
    }

    if (events && events.length > 0) {
      const now = performance.now();
      for (const evt of events) {
        combatEventsQueue.push({ ...evt, createdAt: now });
        if (
          state.myId &&
          evt.targetId === state.myId &&
          evt.attackType !== 'heal' &&
          evt.attackType !== 'roar'
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
}));