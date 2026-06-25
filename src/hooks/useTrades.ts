import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { CHANNELS, MAX_TRADES } from '../constants';
import type { TradeMessage, ProcessedTrade, IncomingMessage } from '../types';

/**
 * Subscribe to all_trades for a single symbol.
 * Maintains a rolling buffer of the last N trades with newest first.
 * Uses requestAnimationFrame batching.
 */
export function useTrades(symbol: string): ProcessedTrade[] {
  const { manager } = useWebSocketContext();
  const [trades, setTrades] = useState<ProcessedTrade[]>([]);

  // Buffer incoming trades between frames
  const bufferRef = useRef<ProcessedTrade[]>([]);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBuffer = useCallback(() => {
    rafRef.current = null;
    const newTrades = bufferRef.current.splice(0);
    if (newTrades.length === 0) return;

    setTrades((prev) => {
      // Mark new trades for highlight animation
      const withHighlight = newTrades.map((t) => ({ ...t, isNew: true }));
      const merged = [...withHighlight, ...prev];
      return merged.slice(0, MAX_TRADES);
    });

    // Clear isNew flag after animation
    setTimeout(() => {
      setTrades((prev) => prev.map((t) => (t.isNew ? { ...t, isNew: false } : t)));
    }, 600);
  }, []);

  useEffect(() => {
    const unsub = manager.subscribe(CHANNELS.TRADES, symbol, (data: IncomingMessage) => {
      const raw = data as TradeMessage;
      const trade: ProcessedTrade = {
        id: `${raw.timestamp}-${raw.price}-${raw.size}-${Math.random()}`,
        price: parseFloat(raw.price),
        size: raw.size,
        side: raw.buyer_role === 'taker' ? 'buy' : 'sell',
        timestamp: raw.timestamp / 1000, // Convert microseconds to milliseconds
      };

      bufferRef.current.push(trade);

      if (rafRef.current === null) {
        rafRef.current = setTimeout(flushBuffer, 16);
      }
    });

    return () => {
      unsub();
      if (rafRef.current !== null) {
        clearTimeout(rafRef.current);
        rafRef.current = null;
      }
      bufferRef.current = [];
    };
  }, [manager, symbol, flushBuffer]);

  return trades;
}
