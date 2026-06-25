import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import type { CandlestickMessage, Candle, IncomingMessage } from '../types';

const MAX_CANDLES = 60;

/**
 * Generates a realistic historical 30-candle sequence matching the user's reference image
 * (Downtrend -> Hammer Candlestick at bottom -> Bullish Reversal Uptrend)
 * with exactly 5-second intervals between candles.
 */
function generateInitialHistory(liveCandle: Candle): Candle[] {
  const history: Candle[] = [];
  const count = 30;
  const interval = 5; // 5 seconds interval
  const targetOpen = liveCandle.open;

  // Make volatility proportional so candle bodies look BIG and bold on Y-axis
  const vol = targetOpen * 0.0018;

  let currentPrice = targetOpen;

  for (let i = 0; i < count; i++) {
    const time = liveCandle.time - (count - i) * interval;
    let open = currentPrice;
    let close = currentPrice;
    let high = currentPrice;
    let low = currentPrice;

    // Big, dramatic candle bodies
    const body = vol * (1.5 + Math.random() * 2.5);

    if (i < 12) {
      // 1. Downtrend with large red bodies
      close = open - body;
      high = open + vol * (0.2 + Math.random() * 0.5);
      low = close - vol * (0.5 + Math.random() * 1.5);
      currentPrice = close + vol * (Math.random() * 0.8); // slight bounce between opens
    } else if (i === 12) {
      // 2. THE HAMMER CANDLESTICK
      // Distinct body with massive lower wick
      close = open + vol * 1.5;
      high = close + vol * 0.5;
      low = open - vol * 8.0; // Dramatic bottom wick
      currentPrice = close - vol * 0.2;
    } else {
      // 3. Bullish Reversal Uptrend with large green bodies
      close = open + body;
      high = close + vol * (0.5 + Math.random() * 1.5);
      low = open - vol * (0.2 + Math.random() * 0.5);
      currentPrice = close - vol * (Math.random() * 0.8); // slight pullback between opens
    }

    history.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 8000 + 2000),
    });
  }

  // Flawless alignment: shift the entire generated curve so the last candle's close matches live targetOpen exactly!
  const actualLastClose = history[history.length - 1].close;
  const offset = targetOpen - actualLastClose;

  return history.map((c) => ({
    ...c,
    open: c.open + offset,
    high: c.high + offset,
    low: c.low + offset,
    close: c.close + offset,
  }));
}

/**
 * Subscribe to candlestick channel for a single symbol.
 * Groups incoming live data into 5-second candle buckets.
 */
export function useCandlestick(symbol: string, resolution: string = '1m'): Candle[] {
  const { manager } = useWebSocketContext();
  const [candles, setCandles] = useState<Candle[]>([]);

  const latestRef = useRef<CandlestickMessage | null>(null);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channel = `candlestick_${resolution}`;

  const processAndSet = useCallback(() => {
    rafRef.current = null;
    const raw = latestRef.current;
    if (!raw) return;

    // Quantize current time into 5-second buckets
    const bucketTime = Math.floor(Date.now() / 5000) * 5;
    const rawClose = parseFloat(raw.close);
    const rawHigh = parseFloat(raw.high);
    const rawLow = parseFloat(raw.low);
    const rawOpen = parseFloat(raw.open);

    const baseCandle: Candle = {
      time: bucketTime,
      open: rawOpen,
      high: rawHigh,
      low: rawLow,
      close: rawClose,
      volume: raw.volume,
    };

    setCandles((prev) => {
      // 1. Initial load: generate 30 historical candles spaced by 5 seconds
      if (prev.length === 0) {
        const initialHistory = generateInitialHistory(baseCandle);
        return [...initialHistory, baseCandle];
      }

      const lastCandle = prev[prev.length - 1];

      // 2. Same 5-second bucket: update current active candle in place
      if (lastCandle.time === bucketTime) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastCandle,
          high: Math.max(lastCandle.high, rawClose),
          low: Math.min(lastCandle.low, rawClose),
          close: rawClose,
          volume: lastCandle.volume + 100,
        };
        return updated;
      }

      // 3. New 5-second bucket: create brand new candle bar
      const newCandle: Candle = {
        time: bucketTime,
        open: lastCandle.close, // Open at previous close
        high: Math.max(lastCandle.close, rawClose),
        low: Math.min(lastCandle.close, rawClose),
        close: rawClose,
        volume: raw.volume,
      };

      const next = [...prev, newCandle];
      return next.slice(-MAX_CANDLES);
    });
  }, []);

  useEffect(() => {
    setCandles([]); // Reset on symbol change
    const unsub = manager.subscribe(channel, symbol, (data: IncomingMessage) => {
      latestRef.current = data as CandlestickMessage;
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
  }, [manager, channel, symbol, processAndSet]);

  return candles;
}
