import type { PlayerData } from "./entity";
import type {
  BloodTrail,
  ChatMessage,
  CombatEvent,
  FoodItem,
  GraphicsQuality,
  WeatherType,
} from "./world";

export interface ServerInboundMsg {
  type: "INIT" | "SYNC";
  id?: string;
  players?: Record<string, PlayerData>;
  foods?: Record<string, FoodItem>;
  bloodTrails?: BloodTrail[];
  events?: CombatEvent[];
  chats?: ChatMessage[];
  worldTime?: number;
  weather?: WeatherType;
}

export interface LocalTelemetryMsg {
  type: "LOCAL_TELEMETRY";
  serverConnected: boolean;
  isJoined: boolean;
  myId: string | null;
  myName: string;
  myModel: string;
  x: number;
  y: number;
  z: number;
  rot: number;
  stamina: number;
  fps: number;
  nightVision: boolean;
  scentRemaining: number;
  quality: GraphicsQuality;
  brightness: number;
  dinoScale: number;
  actionHint: string | null;
  waypoint: [number, number] | null;
}

export type IpcInboundMessage = ServerInboundMsg | LocalTelemetryMsg;
