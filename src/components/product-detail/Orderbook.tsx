import { memo } from 'react';
import { useOrderbook } from '../../hooks/useOrderbook';

interface OrderbookProps {
  symbol: string;
}

export const Orderbook = memo(function Orderbook({ symbol }: OrderbookProps) {
  const orderbook = useOrderbook(symbol);

  if (!orderbook) {
    return (
      <div className="orderbook" id="orderbook">
        <div className="orderbook-header">
          <h3>Order Book</h3>
          <span className="skeleton-box skeleton-box-sm" style={{ width: '100px' }} />
        </div>
        <div className="orderbook-table-header">
          <span className="ob-col-price">Price</span>
          <span className="ob-col-qty">Quantity</span>
          <span className="ob-col-total">Total</span>
        </div>
        <div className="orderbook-body" style={{ padding: '12px 0' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div className="ob-row" key={i} style={{ justifyContent: 'space-between', padding: '4px 8px' }}>
              <span className="skeleton-box" style={{ width: '70px', height: '16px' }} />
              <span className="skeleton-box" style={{ width: '60px', height: '16px' }} />
              <span className="skeleton-box" style={{ width: '60px', height: '16px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { bids, asks, maxTotal, spread, spreadPercent } = orderbook;

  // Asks are displayed in reverse (lowest ask at bottom, near spread)
  const reversedAsks = [...asks].reverse();

  return (
    <div className="orderbook" id="orderbook">
      <div className="orderbook-header">
        <h3>Order Book</h3>
        <span className="orderbook-spread">
          Spread: {spread.toFixed(4)} ({spreadPercent.toFixed(3)}%)
        </span>
      </div>

      <div className="orderbook-table-header">
        <span className="ob-col-price">Price</span>
        <span className="ob-col-qty">Quantity</span>
        <span className="ob-col-total">Total</span>
      </div>

      <div className="orderbook-body">
        {/* Asks (reversed so lowest ask is at the bottom) */}
        <div className="orderbook-asks">
          {reversedAsks.map((level, i) => {
            const depthPercent = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0;
            return (
              <div className="ob-row ob-row-ask" key={`ask-${i}`}>
                <div
                  className="ob-depth-bar ob-depth-ask"
                  style={{ width: `${depthPercent}%` }}
                />
                <span className="ob-col-price ob-text-ask">{level.price.toFixed(getPrecision(level.price))}</span>
                <span className="ob-col-qty">{level.quantity.toFixed(4)}</span>
                <span className="ob-col-total">{level.total.toFixed(4)}</span>
              </div>
            );
          })}
        </div>

        {/* Spread indicator */}
        <div className="orderbook-spread-row">
          <span className="spread-label">Spread</span>
          <span className="spread-value">{spread.toFixed(4)}</span>
        </div>

        {/* Bids */}
        <div className="orderbook-bids">
          {bids.map((level, i) => {
            const depthPercent = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0;
            return (
              <div className="ob-row ob-row-bid" key={`bid-${i}`}>
                <div
                  className="ob-depth-bar ob-depth-bid"
                  style={{ width: `${depthPercent}%` }}
                />
                <span className="ob-col-price ob-text-bid">{level.price.toFixed(getPrecision(level.price))}</span>
                <span className="ob-col-qty">{level.quantity.toFixed(4)}</span>
                <span className="ob-col-total">{level.total.toFixed(4)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/** Determine display precision based on price magnitude */
function getPrecision(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 1) return 4;
  return 6;
}
