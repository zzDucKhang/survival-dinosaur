import { useGameStore } from '../store/useGameStore';

class GameSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private isIntentionalClose: boolean = false;
  private lastJoinName: string | null = null;
  private lastJoinModel: string = 'trex';

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
      const store = useGameStore.getState();
      store.setConnected(true);
      if (onConnected) {
        onConnected();
      } else if (store.isJoined && this.lastJoinName) {
        this.join(this.lastJoinName, this.lastJoinModel);
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
              bloodTrails: data.bloodTrails,
              worldTime: data.worldTime,
              weather: data.weather,
            });
          } else if (data.type === 'SYNC') {
            useGameStore.getState().syncFromServer({
              players: data.players,
              foods: data.foods,
              bloodTrails: data.bloodTrails,
              events: data.events,
              chats: data.chats,
              worldTime: data.worldTime,
              weather: data.weather,
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
    this.lastJoinName = name;
    this.lastJoinModel = model;
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

  public sendSpecial() {
    this.send({
      type: 'SPECIAL',
      payload: {},
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

  public sendCrouch(crouching: boolean) {
    this.send({
      type: 'CROUCH',
      payload: { crouching },
    });
  }

  public sendRoar(callType: number = 1) {
    this.send({
      type: 'ROAR',
      payload: { callType },
    });
  }

  public sendPackInvite(targetId: string) {
    this.send({
      type: 'PACK_INVITE',
      payload: { targetId },
    });
  }

  public sendPackAccept() {
    this.send({
      type: 'PACK_ACCEPT',
      payload: {},
    });
  }

  public sendPackLeave() {
    this.send({
      type: 'PACK_LEAVE',
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
    this.lastJoinName = null;
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