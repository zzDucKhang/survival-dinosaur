import type { GraphicsQuality, IpcInboundMessage } from "../types";
import { localTransformMutable } from "../store/mutableCache";
import { useGameStore } from "../store/useGameStore";
import { soundEngine } from "./soundEngine";

let smoothedFps = 60;
let lastFpsCommitAt = 0;

class NativeIpcSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;
  private intentionalClose = false;
  private lastLocalSpecialAt = 0;

  constructor() {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    this.url = params?.get("ipc") || "ws://127.0.0.1:9001";
  }

  public getUrl(): string {
    return this.url;
  }

  public markLocalSpecialAudio(): void {
    this.lastLocalSpecialAt = performance.now();
  }

  public reconnectNow(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
    this.connect();
  }

  public connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.intentionalClose = false;
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch (err) {
      console.error("[IPC] Cannot create WebSocket:", err);
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.reconnectAttempt = 0;
      lastFpsCommitAt = 0;
      console.log("[IPC] Connected to", this.url);
      useGameStore.getState().setIpcConnected(true);
      this.setUiFocus(false);
    };

    ws.onmessage = (event) => {
      if (this.ws !== ws) return;
      const raw = typeof event.data === "string" ? event.data : "";
      if (!raw) return;

      if (!raw.includes("\n")) {
        try {
          const msg = JSON.parse(raw) as IpcInboundMessage;
          this.handleMessage(msg);
        } catch {
          // Bỏ qua gói tin hỏng
        }
        return;
      }

      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed) as IpcInboundMessage;
          this.handleMessage(msg);
        } catch {
          // Bỏ qua gói tin hỏng
        }
      }
    };

    ws.onerror = (err) => {
      if (this.ws !== ws) return;
      console.warn("[IPC] WebSocket error:", err);
    };

    ws.onclose = (ev) => {
      if (this.ws !== ws) return;
      console.warn("[IPC] Disconnected:", ev.code, ev.reason);
      useGameStore.getState().setIpcConnected(false);
      this.ws = null;
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(msg: IpcInboundMessage): void {
    const store = useGameStore.getState();

    if (msg.type === "LOCAL_TELEMETRY") {
      const rawFps = Number(msg.fps) || 0;
      let nextFps = store.fps;
      if (rawFps > 0) {
        if (lastFpsCommitAt === 0) {
          smoothedFps = rawFps;
        } else {
          smoothedFps = smoothedFps * 0.85 + rawFps * 0.15;
        }
      }
      const now = performance.now();
      if (lastFpsCommitAt === 0 || now - lastFpsCommitAt >= 500) {
        lastFpsCommitAt = now;
        nextFps = Math.round(smoothedFps);
      }
      store.applyLocalTelemetry({ ...msg, fps: nextFps });
      return;
    }

    if (msg.type === "INIT") {
      if (msg.id) {
        store.setMyId(msg.id);
      }
      store.syncFromServer({
        players: msg.players,
        foods: msg.foods,
        bloodTrails: msg.bloodTrails,
        worldTime: msg.worldTime,
        weather: msg.weather,
      });
      return;
    }

    if (msg.type === "SYNC") {
      if (msg.events && msg.events.length > 0) {
        let playedBite = false;
        let playedSpecial = false;
        const now = performance.now();

        for (const ev of msg.events) {
          if (ev.attackType === "roar") {
            const dist = Math.hypot(
              ev.x - localTransformMutable.x,
              ev.z - localTransformMutable.z,
            );
            if (dist <= 220) {
              const vol =
                dist <= 25 ? 1.0 : Math.max(0.12, 1.0 - (dist - 25) / 195);
              soundEngine.playRoar(ev.damage, store.growth, vol);
            }
          } else if (ev.attackerId === store.myId) {
            if (
              !playedSpecial &&
              (ev.attackType === "special" || ev.attackType === "bonebreak")
            ) {
              playedSpecial = true;
              if (now - this.lastLocalSpecialAt > 250) {
                soundEngine.playSpecial();
              }
            } else if (
              !playedBite &&
              (ev.attackType === "bite" || ev.attackType === "tail")
            ) {
              playedBite = true;
              soundEngine.playBite();
            }
          }
        }
      }

      store.syncFromServer({
        players: msg.players,
        foods: msg.foods,
        bloodTrails: msg.bloodTrails,
        events: msg.events,
        chats: msg.chats,
        worldTime: msg.worldTime,
        weather: msg.weather,
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    const delays = [500, 1000, 1500];
    const delay = delays[Math.min(this.reconnectAttempt, delays.length - 1)];
    this.reconnectAttempt++;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private sendUnit(type: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type }));
    }
  }

  private sendWithPayload(
    type: string,
    payload: Record<string, unknown>,
  ): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  public join(name: string, model: string): void {
    this.sendWithPayload("JOIN", { name, model });
  }

  public leave(): void {
    this.sendUnit("LEAVE");
  }

  public sendChat(text: string): void {
    this.sendWithPayload("CHAT", { text });
  }

  public sendToggleRest(): void {
    this.sendUnit("REST");
  }

  public sendSpecial(): void {
    this.sendUnit("SPECIAL");
  }

  public sendPackInvite(targetId: string): void {
    this.sendWithPayload("PACK_INVITE", { targetId });
  }

  public sendPackAccept(): void {
    this.sendUnit("PACK_ACCEPT");
  }

  public sendPackLeave(): void {
    this.sendUnit("PACK_LEAVE");
  }

  public setQuality(quality: GraphicsQuality): void {
    this.sendWithPayload("SET_QUALITY", { quality });
  }

  public setBrightness(value: number): void {
    this.sendWithPayload("SET_BRIGHTNESS", { value });
  }

  public setDinoScale(value: number): void {
    this.sendWithPayload("SET_DINO_SCALE", { value });
  }

  public rotateModel90(): void {
    this.sendUnit("ROTATE_MODEL_90");
  }

  public toggleNightVision(): void {
    this.sendUnit("TOGGLE_NIGHT_VISION");
  }

  public triggerScent(): void {
    this.sendUnit("TRIGGER_SCENT");
    soundEngine.playScent();
  }

  public setWaypoint(x: number, z: number): void {
    this.sendWithPayload("SET_WAYPOINT", { x, z });
  }

  public clearWaypoint(): void {
    this.sendUnit("CLEAR_WAYPOINT");
  }

  public setUiFocus(blocked: boolean): void {
    this.sendWithPayload("SET_UI_FOCUS", { blocked });
  }

  public disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      const old = this.ws;
      this.ws = null;
      old.onopen = null;
      old.onmessage = null;
      old.onerror = null;
      old.onclose = null;
      if (
        old.readyState === WebSocket.OPEN ||
        old.readyState === WebSocket.CONNECTING
      ) {
        old.close();
      }
    }
  }
}

export const ipcSocket = new NativeIpcSocket();
