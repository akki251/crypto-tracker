import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SYMBOL_NAMES, SYMBOL_ICONS, SYMBOLS, type SymbolName } from '../../constants';
import { useTicker } from '../../hooks/useTicker';
import { useFavorites } from '../../hooks/useFavorites';
import { TickerInfo } from './TickerInfo';
import { Orderbook } from './Orderbook';
import { RecentTrades } from './RecentTrades';
import { MiniChart } from './MiniChart';
import { StressTestControls } from '../stress-test/StressTestControls';

export function ProductDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Validate symbol
  const validSymbol = symbol && (SYMBOLS as readonly string[]).includes(symbol)
    ? (symbol as SymbolName)
    : null;

  // Stable array ref for useTicker
  const symbolArray = useMemo(
    () => (validSymbol ? [validSymbol] : []),
    [validSymbol],
  );
  const tickerData = useTicker(symbolArray);

  if (!validSymbol) {
    return (
      <div className="detail-container" id="product-detail">
        <div className="detail-error">
          <h2>Symbol not found</h2>
          <p>The symbol "{symbol}" is not available.</p>
          <Link to="/" className="back-link">← Back to Markets</Link>
        </div>
      </div>
    );
  }

  const ticker = tickerData.get(validSymbol) ?? null;
  const favorite = isFavorite(validSymbol);

  return (
    <div className="detail-container" id="product-detail">
      <div className="detail-top-bar">
        <Link to="/" className="back-link" id="back-link">
          ← Back
        </Link>

        <div className="detail-title">
          <span className="detail-icon">{SYMBOL_ICONS[validSymbol]}</span>
          <h2 className="detail-symbol">{validSymbol}</h2>
          <span className="detail-name">{SYMBOL_NAMES[validSymbol]}</span>
        </div>

        <button
          className={`favorite-btn favorite-btn-lg ${favorite ? 'favorite-active' : ''}`}
          onClick={() => toggleFavorite(validSymbol)}
          id={`detail-fav-${validSymbol}`}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorite ? '★' : '☆'}
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          <TickerInfo ticker={ticker} />
          <MiniChart symbol={validSymbol} />
        </div>

        <div className="detail-col-orderbook">
          <Orderbook symbol={validSymbol} />
        </div>

        <div className="detail-col-trades">
          <RecentTrades symbol={validSymbol} />
        </div>
      </div>

      <div className="detail-footer">
        <StressTestControls />
      </div>
    </div>
  );
}
