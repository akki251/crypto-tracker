import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { CHANNELS } from '../constants';
import type { TickerMessage, IncomingMessage } from '../types';

/**
 * Subscribe to v2/ticker for one or many symbols.
 * Uses requestAnimationFrame batching to cap re-renders at ~60fps.
 */
export function useTicker(symbols: string[]): Map<string, TickerMessage> {
  const { manager } = useWebSocketContext();
  const [tickerData, setTickerData] = useState<Map<string, TickerMessage>>(new Map());

  // Buffer updates between frames
  const bufferRef = useRef<Map<string, TickerMessage>>(new Map());
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBuffer = useCallback(() => {
    rafRef.current = null;
    setTickerData((prev) => {
      const next = new Map(prev);
      for (const [key, val] of bufferRef.current) {
        next.set(key, val);
      }
      bufferRef.current.clear();
      return next;
    });
  }, []);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    for (const symbol of symbols) {
      const unsub = manager.subscribe(CHANNELS.TICKER, symbol, (data: IncomingMessage) => {
        const ticker = data as TickerMessage;
        bufferRef.current.set(ticker.symbol, ticker);

        if (rafRef.current === null) {
          rafRef.current = setTimeout(flushBuffer, 16);
        }
      });
      unsubscribes.push(unsub);
    }

    return () => {
      unsubscribes.forEach((u) => u());
      if (rafRef.current !== null) {
        clearTimeout(rafRef.current);
        rafRef.current = null;
      }
      bufferRef.current.clear();
    };
  }, [manager, symbols, flushBuffer]);

  return tickerData;
}
