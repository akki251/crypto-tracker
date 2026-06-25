// ─── Symbol Definitions ─────────────────────────────────────────────────────

export const SYMBOLS = [
  'BTCUSD',
  'ETHUSD',
  'XRPUSD',
  'SOLUSD',
  'PAXGUSD',
  'DOGEUSD',
] as const;

export type SymbolName = (typeof SYMBOLS)[number];

/** Human-readable display names */
export const SYMBOL_NAMES: Record<SymbolName, string> = {
  BTCUSD: 'Bitcoin',
  ETHUSD: 'Ethereum',
  XRPUSD: 'XRP',
  SOLUSD: 'Solana',
  PAXGUSD: 'PAX Gold',
  DOGEUSD: 'Dogecoin',
};

/** Symbol icon mappings (using emoji for simplicity) */
export const SYMBOL_ICONS: Record<SymbolName, string> = {
  BTCUSD: '₿',
  ETHUSD: 'Ξ',
  XRPUSD: '✕',
  SOLUSD: '◎',
  PAXGUSD: '🥇',
  DOGEUSD: '🐕',
};

// ─── WebSocket Configuration ────────────────────────────────────────────────

export const WS_URL = 'ws://localhost:8080';
export const HTTP_API_URL = 'http://localhost:3000';

export const CHANNELS = {
  TICKER: 'v2/ticker',
  ORDERBOOK: 'l2_orderbook',
  TRADES: 'all_trades',
  CANDLESTICK_1M: 'candlestick_1m',
} as const;

// ─── Application Constants ──────────────────────────────────────────────────

export const FAVORITES_STORAGE_KEY = 'crypto-tracker-favorites';
export const THEME_STORAGE_KEY = 'crypto-tracker-theme';

export const MAX_TRADES = 30;
export const ORDERBOOK_LEVELS = 15;

/** Reconnect configuration */
export const RECONNECT = {
  INITIAL_DELAY: 1000,
  MAX_DELAY: 30000,
  BACKOFF_MULTIPLIER: 2,
} as const;

/** Speed presets for stress test mode */
export const SPEED_PRESETS = {
  normal: {
    all_trades: { min: 1000, max: 2000 },
    candlestick: { min: 1000, max: 2000 },
    l2_orderbook: { min: 1000, max: 2000 },
    'v2/ticker': { min: 1000, max: 2000 },
  },
  fast: {
    all_trades: { min: 150, max: 300 },
    candlestick: { min: 150, max: 300 },
    l2_orderbook: { min: 150, max: 300 },
    'v2/ticker': { min: 150, max: 300 },
  },
  extreme: {
    all_trades: { min: 5, max: 15 },
    candlestick: { min: 5, max: 15 },
    l2_orderbook: { min: 5, max: 15 },
    'v2/ticker': { min: 5, max: 15 },
  },
} as const;
