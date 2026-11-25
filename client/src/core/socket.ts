import { useGameStore } from '../store/useGameStore';

class GameSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private isIntentionalClose: boolean = false;

  constructor() {
    const host =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'localhost';
    const protocol =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${host}:8080/ws`;
  }

  public connect(onConnected?: () => void) {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      if (this.ws.readyState === WebSocket.OPEN && onConnected) {
        onConnected();
      }
      return;
    }

    this.isIntentionalClose = false;
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.warn('[WS] Failed to create WebSocket connection:', e);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      useGameStore.getState().setConnected(true);
      if (onConnected) {
        onConnected();
      }
    };

    this.ws.onmessage = (event) => {
      const raw = typeof event.data === 'string' ? event.data : '';
      const lines = raw.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.type === 'INIT') {
            if (data.id) {
              useGameStore.getState().setMyId(data.id);
            }
            useGameStore.getState().syncFromServer({
              players: data.players,
              foods: data.foods,
              worldTime: data.worldTime,
            });
          } else if (data.type === 'SYNC') {
            useGameStore.getState().syncFromServer({
              players: data.players,
              foods: data.foods,
              events: data.events,
              chats: data.chats,
              worldTime: data.worldTime,
            });
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      }
    };

    this.ws.onerror = (err) => {
      console.warn('[WS] Error:', err);
    };

    this.ws.onclose = () => {
      useGameStore.getState().setConnected(false);
      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  public join(name: string, model: string = 'trex') {
    this.send({
      type: 'JOIN',
      payload: { name, model },
    });
  }

  public sendMove(x: number, y: number, z: number, rotation: number, animState: string) {
    this.send({
      type: 'MOVE',
      payload: {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        z: Math.round(z * 100) / 100,
        rotation: Math.round(rotation * 1000) / 1000,
        animState,
      },
    });
  }

  public sendAttack(attackType: 'bite' | 'tail') {
    this.send({
      type: 'ATTACK',
      payload: { attackType },
    });
  }

  public sendInteract() {
    this.send({
      type: 'INTERACT',
      payload: {},
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'CHAT',
      payload: { text },
    });
  }

  public sendToggleRest() {
    this.send({
      type: 'REST',
      payload: {},
    });
  }

  private send(obj: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useGameStore.getState().setConnected(false);
  }
}

export const socket = new GameSocket();