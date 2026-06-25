import { memo } from 'react';
import type { TickerMessage } from '../../types';

interface TickerInfoProps {
  ticker: TickerMessage | null;
}

export const TickerInfo = memo(function TickerInfo({ ticker }: TickerInfoProps) {
  if (!ticker) {
    return (
      <div className="ticker-info" id="ticker-info">
        <div className="ticker-loading">Waiting for ticker data…</div>
      </div>
    );
  }

  const change24h = (parseFloat(ticker.ltp_change_24h) - 1) * 100;
  const changeClass = change24h >= 0 ? 'positive' : 'negative';

  return (
    <div className="ticker-info" id="ticker-info">
      <div className="ticker-main">
        <div className="ticker-price-container">
          <span className="ticker-label">Last Price</span>
          <span className="ticker-price">${formatPrice(ticker.close)}</span>
          <span className={`ticker-change ${changeClass}`}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="ticker-grid">
        <TickerItem label="Mark Price" value={`$${formatPrice(parseFloat(ticker.mark_price))}`} />
        <TickerItem label="24h Volume" value={formatVolume(ticker.volume)} />
        <TickerItem label="24h High" value={`$${formatPrice(ticker.high)}`} className="positive" />
        <TickerItem label="24h Low" value={`$${formatPrice(ticker.low)}`} className="negative" />
        <TickerItem label="Funding Rate" value={formatFundingRate(ticker.funding_rate)} />
        <TickerItem label="Open Interest" value={formatOI(ticker.oi_contracts)} />
        <TickerItem label="Best Bid" value={`$${ticker.quotes.best_bid}`} className="positive" />
        <TickerItem label="Best Ask" value={`$${ticker.quotes.best_ask}`} className="negative" />
      </div>
    </div>
  );
});

// ─── Sub-components ─────────────────────────────────────────────────────────

interface TickerItemProps {
  label: string;
  value: string;
  className?: string;
}

const TickerItem = memo(function TickerItem({ label, value, className }: TickerItemProps) {
  return (
    <div className="ticker-item">
      <span className="ticker-item-label">{label}</span>
      <span className={`ticker-item-value ${className ?? ''}`}>{value}</span>
    </div>
  );
});

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
  return v.toFixed(2);
}

function formatFundingRate(rate: string): string {
  const r = parseFloat(rate);
  const percent = (r * 100).toFixed(4);
  return `${r >= 0 ? '+' : ''}${percent}%`;
}

function formatOI(contracts: string): string {
  const n = parseInt(contracts, 10);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
