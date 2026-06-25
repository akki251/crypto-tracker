// ─── WebSocket Message Types ─────────────────────────────────────────────────

export interface TickerMessage {
  type: 'v2/ticker';
  symbol: string;
  close: number;
  open: number;
  high: number;
  low: number;
  mark_price: string;
  volume: number;
  turnover: number;
  turnover_usd: number;
  funding_rate: string;
  ltp_change_24h: string;
  mark_change_24h: string;
  spot_price: string;
  timestamp: number;
  oi_contracts: string;
  oi_value: string;
  oi_value_usd: string;
  description: string;
  contract_type: string;
  product_trading_status: string;
  quotes: {
    ask_iv: string | null;
    ask_size: string;
    best_ask: string;
    best_bid: string;
    bid_iv: string | null;
    bid_size: string;
    impact_mid_price: string | null;
    mark_iv: string;
  };
  price_band: {
    lower_limit: string;
    upper_limit: string;
  };
  time: string;
}

export interface OrderbookMessage {
  type: 'l2_orderbook';
  symbol: string;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
  timestamp: number;
}

export interface TradeMessage {
  type: 'all_trades';
  symbol: string;
  price: string;
  size: number;
  buyer_role: 'maker' | 'taker';
  seller_role: 'maker' | 'taker';
  timestamp: number;
  product_id: number;
}

export interface CandlestickMessage {
  type: string; // candlestick_<resolution>
  symbol: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: number;
  resolution: string;
  candle_start_time: number;
  timestamp: number;
  sUID: string;
}

// ─── WebSocket Protocol Types ────────────────────────────────────────────────

export interface ChannelSubscription {
  name: string;
  symbols: string[];
}

export interface SubscribeMessage {
  type: 'subscribe';
  payload: {
    channels: ChannelSubscription[];
  };
}

export interface UnsubscribeMessage {
  type: 'unsubscribe';
  payload: {
    channels: ChannelSubscription[];
  };
}

export interface SubscriptionsAck {
  type: 'subscriptions';
  payload: {
    channels: ChannelSubscription[];
  };
}

export type IncomingMessage =
  | TickerMessage
  | OrderbookMessage
  | TradeMessage
  | CandlestickMessage
  | SubscriptionsAck;

// ─── Application State Types ────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface OrderbookLevel {
  price: number;
  quantity: number;
  total: number; // cumulative quantity
}

export interface ProcessedOrderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  maxTotal: number;
  spread: number;
  spreadPercent: number;
}

export interface ProcessedTrade {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
  isNew?: boolean;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type MessageListener = (data: IncomingMessage) => void;

export interface StreamIntervals {
  all_trades: { min: number; max: number };
  candlestick: { min: number; max: number };
  l2_orderbook: { min: number; max: number };
  'v2/ticker': { min: number; max: number };
}

export type SpeedPreset = 'normal' | 'fast' | 'extreme';
