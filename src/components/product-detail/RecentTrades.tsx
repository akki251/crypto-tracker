import { memo } from 'react';
import { useTrades } from '../../hooks/useTrades';
import type { ProcessedTrade } from '../../types';

interface RecentTradesProps {
  symbol: string;
}

export const RecentTrades = memo(function RecentTrades({ symbol }: RecentTradesProps) {
  const trades = useTrades(symbol);

  return (
    <div className="recent-trades" id="recent-trades">
      <div className="trades-header">
        <h3>Recent Trades</h3>
        <span className="trades-count">{trades.length} trades</span>
      </div>

      <div className="trades-table-header">
        <span className="trade-col-price">Price</span>
        <span className="trade-col-size">Size</span>
        <span className="trade-col-side">Side</span>
        <span className="trade-col-time">Time</span>
      </div>

      <div className="trades-body">
        {trades.length === 0 ? (
          <div style={{ padding: '12px 0' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div className="trade-row" key={i} style={{ padding: '4px 8px' }}>
                <span className="trade-col-price"><span className="skeleton-box" style={{ width: '65px', height: '16px' }} /></span>
                <span className="trade-col-size"><span className="skeleton-box" style={{ width: '50px', height: '16px' }} /></span>
                <span className="trade-col-side"><span className="skeleton-box skeleton-box-sm" style={{ width: '35px', height: '16px' }} /></span>
                <span className="trade-col-time"><span className="skeleton-box" style={{ width: '60px', height: '16px' }} /></span>
              </div>
            ))}
          </div>
        ) : (
          trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))
        )}
      </div>
    </div>
  );
});

// ─── Trade Row ──────────────────────────────────────────────────────────────

interface TradeRowProps {
  trade: ProcessedTrade;
}

const TradeRow = memo(function TradeRow({ trade }: TradeRowProps) {
  const sideClass = trade.side === 'buy' ? 'trade-buy' : 'trade-sell';
  const highlightClass = trade.isNew ? 'trade-new' : '';

  return (
    <div className={`trade-row ${highlightClass}`}>
      <span className={`trade-col-price ${sideClass}`}>
        {formatTradePrice(trade.price)}
      </span>
      <span className="trade-col-size">{trade.size}</span>
      <span className={`trade-col-side ${sideClass}`}>
        {trade.side.toUpperCase()}
      </span>
      <span className="trade-col-time">
        {formatTime(trade.timestamp)}
      </span>
    </div>
  );
});

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatTradePrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
