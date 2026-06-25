import {
  type ConnectionStatus,
  type IncomingMessage,
  type MessageListener,
  type ChannelSubscription,
} from '../types';
import { WS_URL, RECONNECT } from '../constants';

/**
 * WebSocketManager — Singleton that manages the WebSocket connection,
 * subscriptions, message routing, and auto-reconnection.
 *
 * Design:
 * - Reference counting: Multiple hooks subscribing to the same (channel, symbol)
 *   only send one WS subscribe message. Unsubscribe fires when the last listener leaves.
 * - Message routing: Listeners register with a key like "v2/ticker:BTCUSD".
 *   Incoming messages are dispatched to matching listeners.
 * - Auto-reconnect: Exponential backoff with jitter. On reconnect, all active
 *   subscriptions are re-sent automatically.
 */

type StatusListener = (status: ConnectionStatus) => void;

interface ListenerEntry {
  id: number;
  callback: MessageListener;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusListeners = new Set<StatusListener>();

  // Map<"channel:symbol", ListenerEntry[]>
  private listeners = new Map<string, ListenerEntry[]>();

  // Track active subscriptions for reconnect resubscribe
  // Map<channelName, Set<symbol>>
  private activeSubscriptions = new Map<string, Set<string>>();

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay: number = RECONNECT.INITIAL_DELAY;
  private nextListenerId = 0;
  private intentionalClose = false;

  connect(): void {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.intentionalClose = false;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectDelay = RECONNECT.INITIAL_DELAY;
        // Re-subscribe to everything that was active
        this.resubscribeAll();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as IncomingMessage;
          this.routeMessage(data);
        } catch {
          // Silently ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        if (!this.intentionalClose) {
          this.setStatus('reconnecting');
          this.scheduleReconnect();
        } else {
          this.setStatus('disconnected');
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror, which triggers reconnect
      };
    } catch {
      this.setStatus('reconnecting');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
    }
    // Delay actual disconnect by 100ms to allow React Strict Mode remount without closing connection
    this.disconnectTimer = setTimeout(() => {
      this.disconnectTimer = null;
      this.intentionalClose = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.setStatus('disconnected');
    }, 100);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Subscribe a listener to a specific (channel, symbol) pair.
   * Returns an unsubscribe function. When the last listener for a given
   * (channel, symbol) unregisters, the WS unsubscribe message is sent.
   */
  subscribe(channel: string, symbol: string, callback: MessageListener): () => void {
    const key = `${channel}:${symbol}`;
    const id = this.nextListenerId++;
    const entry: ListenerEntry = { id, callback };

    const existing = this.listeners.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      this.listeners.set(key, [entry]);
      // First listener for this (channel, symbol) — send WS subscribe
      this.addSubscription(channel, symbol);
    }

    // Return unsubscribe function
    return () => {
      const entries = this.listeners.get(key);
      if (!entries) return;

      const idx = entries.findIndex((e) => e.id === id);
      if (idx !== -1) entries.splice(idx, 1);

      if (entries.length === 0) {
        this.listeners.delete(key);
        // Last listener gone — send WS unsubscribe
        this.removeSubscription(channel, symbol);
      }
    };
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const jitter = Math.random() * 1000;
    const delay = Math.min(this.reconnectDelay + jitter, RECONNECT.MAX_DELAY as number);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * (RECONNECT.BACKOFF_MULTIPLIER as number),
        RECONNECT.MAX_DELAY as number,
      );
      this.connect();
    }, delay);
  }

  private routeMessage(data: IncomingMessage): void {
    if (data.type === 'subscriptions') {
      // Ack message — ignore
      return;
    }

    // Messages have `type` and `symbol` fields
    const msg = data as { type: string; symbol?: string };
    if (!msg.symbol) return;

    const key = `${msg.type}:${msg.symbol}`;
    const entries = this.listeners.get(key);
    if (entries) {
      for (const entry of entries) {
        entry.callback(data);
      }
    }
  }

  private addSubscription(channel: string, symbol: string): void {
    if (!this.activeSubscriptions.has(channel)) {
      this.activeSubscriptions.set(channel, new Set());
    }
    this.activeSubscriptions.get(channel)!.add(symbol);

    this.sendSubscribe(channel, [symbol]);
  }

  private removeSubscription(channel: string, symbol: string): void {
    const symbols = this.activeSubscriptions.get(channel);
    if (symbols) {
      symbols.delete(symbol);
      if (symbols.size === 0) {
        this.activeSubscriptions.delete(channel);
      }
    }

    this.sendUnsubscribe(channel, [symbol]);
  }

  private resubscribeAll(): void {
    const channels: ChannelSubscription[] = [];
    for (const [name, symbols] of this.activeSubscriptions) {
      channels.push({ name, symbols: [...symbols] });
    }
    if (channels.length > 0) {
      this.send({ type: 'subscribe', payload: { channels } });
    }
  }

  private sendSubscribe(channel: string, symbols: string[]): void {
    this.send({
      type: 'subscribe',
      payload: { channels: [{ name: channel, symbols }] },
    });
  }

  private sendUnsubscribe(channel: string, symbols: string[]): void {
    this.send({
      type: 'unsubscribe',
      payload: { channels: [{ name: channel, symbols }] },
    });
  }

  private send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// Singleton instance with Vite HMR preservation
const globalAny = globalThis as any;
if (!globalAny.__wsManager) {
  globalAny.__wsManager = new WebSocketManager();
}
export const wsManager = globalAny.__wsManager;
