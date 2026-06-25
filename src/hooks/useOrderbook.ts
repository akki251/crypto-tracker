import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { CHANNELS, ORDERBOOK_LEVELS } from '../constants';
import type { OrderbookMessage, ProcessedOrderbook, IncomingMessage } from '../types';

/**
 * Subscribe to l2_orderbook for a single symbol.
 * Processes raw 500-level data into top N levels with cumulative totals.
 * Uses requestAnimationFrame to prevent layout jank.
 */
export function useOrderbook(symbol: string): ProcessedOrderbook | null {
  const { manager } = useWebSocketContext();
  const [orderbook, setOrderbook] = useState<ProcessedOrderbook | null>(null);

  const latestRef = useRef<OrderbookMessage | null>(null);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processAndSet = useCallback(() => {
    rafRef.current = null;
    const raw = latestRef.current;
    if (!raw) return;

    const bids = raw.bids.slice(0, ORDERBOOK_LEVELS).map(([p, q]) => ({
      price: parseFloat(p),
      quantity: parseFloat(q),
      total: 0,
    }));

    const asks = raw.asks.slice(0, ORDERBOOK_LEVELS).map(([p, q]) => ({
      price: parseFloat(p),
      quantity: parseFloat(q),
      total: 0,
    }));

    // Calculate cumulative totals
    let bidTotal = 0;
    for (const level of bids) {
      bidTotal += level.quantity;
      level.total = bidTotal;
    }

    let askTotal = 0;
    for (const level of asks) {
      askTotal += level.quantity;
      level.total = askTotal;
    }

    const maxTotal = Math.max(bidTotal, askTotal);
    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    const spread = bestAsk - bestBid;
    const mid = (bestAsk + bestBid) / 2;
    const spreadPercent = mid > 0 ? (spread / mid) * 100 : 0;

    setOrderbook({ bids, asks, maxTotal, spread, spreadPercent });
  }, []);

  useEffect(() => {
    const unsub = manager.subscribe(CHANNELS.ORDERBOOK, symbol, (data: IncomingMessage) => {
      latestRef.current = data as OrderbookMessage;
      if (rafRef.current === null) {
        rafRef.current = setTimeout(processAndSet, 16);
      }
    });

    return () => {
      unsub();
      if (rafRef.current !== null) {
        clearTimeout(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [manager, symbol, processAndSet]);

  return orderbook;
}
