import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketManager } from './websocket';
import type { TickerMessage } from '../types';

// Mock global WebSocket to prevent Undici/JSDOM event conflicts and avoid real network connections
class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 1; // OPEN
  send = vi.fn();
  close = vi.fn();

  constructor() {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 10);
  }
}

vi.stubGlobal('WebSocket', FakeWebSocket);

describe('WebSocketManager', () => {
  let manager: WebSocketManager;

  beforeEach(() => {
    manager = new WebSocketManager();
  });

  it('starts with disconnected status', () => {
    expect(manager.getStatus()).toBe('disconnected');
  });

  it('manages status change listeners correctly', () => {
    const listener = vi.fn();
    const unsubscribe = manager.onStatusChange(listener);

    // Trigger status change via connect (moves to connecting)
    manager.connect();
    expect(listener).toHaveBeenCalledWith('connecting');
    expect(manager.getStatus()).toBe('connecting');

    unsubscribe();
  });

  it('correctly handles subscription ref counting and routing', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsub1 = manager.subscribe('v2/ticker', 'BTCUSD', callback1);
    const unsub2 = manager.subscribe('v2/ticker', 'BTCUSD', callback2);

    // Simulate routing an incoming message
    const mockMsg: TickerMessage = {
      type: 'v2/ticker',
      symbol: 'BTCUSD',
      close: 50000,
      open: 49000,
      high: 51000,
      low: 48000,
      mark_price: '50000',
      volume: 100,
      turnover: 5000000,
      turnover_usd: 5000000,
      funding_rate: '0.0001',
      ltp_change_24h: '0.02',
      mark_change_24h: '0.02',
      spot_price: '50000',
      timestamp: Date.now(),
      oi_contracts: '1000',
      oi_value: '50000000',
      oi_value_usd: '50000000',
      description: 'Bitcoin',
      contract_type: 'PERPETUAL',
      product_trading_status: 'TRADING',
      quotes: {
        ask_iv: null,
        ask_size: '1',
        best_ask: '50010',
        best_bid: '49990',
        bid_iv: null,
        bid_size: '1',
        impact_mid_price: null,
        mark_iv: '0.5',
      },
      price_band: { lower_limit: '40000', upper_limit: '60000' },
      time: '2026-06-25T14:00:00Z',
    };

    // Access private routeMessage for testing
    // @ts-expect-error testing private routeMessage
    manager.routeMessage(mockMsg);

    expect(callback1).toHaveBeenCalledWith(mockMsg);
    expect(callback2).toHaveBeenCalledWith(mockMsg);

    // Unsubscribe both
    unsub1();
    unsub2();
  });
});
