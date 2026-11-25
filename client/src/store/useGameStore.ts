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
  lastDamagedAt: number;
  scentUntil: number;
  actionHint: string | null;

  // Roblox-style HUD & Settings states
  isSettingsOpen: boolean;
  isChatVisible: boolean;
  isChatOpen: boolean;
  showHelp: boolean;
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
  toggleChatVisible: () => void;
  setChatOpen: (open: boolean) => void;
  toggleHelp: () => void;
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
  lastDamagedAt: 0,
  scentUntil: 0,
  actionHint: null,

  isSettingsOpen: false,
  isChatVisible: true,
  isChatOpen: false,
  showHelp: false,
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

  setJoined: (joined) => set({ isJoined: joined }),
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
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
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

        if (nextHp !== state.health) patch.health = nextHp;
        if (nextMaxHp !== state.maxHealth) patch.maxHealth = nextMaxHp;
        if (nextHunger !== state.hunger) patch.hunger = nextHunger;
        if (nextThirst !== state.thirst) patch.thirst = nextThirst;
        if (nextGrowth !== state.growth) patch.growth = nextGrowth;
        if (nextBleed !== state.bleed) patch.bleed = nextBleed;
        if (nextKills !== state.kills) patch.kills = nextKills;
        if (nextResting !== state.isResting) patch.isResting = nextResting;
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
        if (state.myId && evt.targetId === state.myId) {
          patch.lastDamagedAt = now;
        }
      }
      if (combatEventsQueue.length > 40) {
        combatEventsQueue.splice(0, combatEventsQueue.length - 40);
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