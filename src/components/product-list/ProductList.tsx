import { memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SYMBOLS, SYMBOL_NAMES, SYMBOL_ICONS, type SymbolName } from '../../constants';
import { useTicker } from '../../hooks/useTicker';
import { useFavorites } from '../../hooks/useFavorites';
import type { TickerMessage } from '../../types';

interface ProductListProps {
  favoritesOnly?: boolean;
}

// Stable reference for all symbols
const ALL_SYMBOLS = [...SYMBOLS] as string[];

export function ProductList({ favoritesOnly = false }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const tickerData = useTicker(ALL_SYMBOLS);
  const { favorites, toggleFavorite } = useFavorites();

  const filteredSymbols = useMemo(() => {
    let syms = [...SYMBOLS] as SymbolName[];

    if (favoritesOnly) {
      syms = syms.filter((s) => favorites.has(s));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      syms = syms.filter(
        (s) =>
          s.toLowerCase().includes(q) ||
          SYMBOL_NAMES[s].toLowerCase().includes(q),
      );
    }

    return syms;
  }, [searchQuery, favoritesOnly, favorites]);

  return (
    <div className="product-list-container" id="product-list">
      <div className="list-header">
        <h2 className="list-title">
          {favoritesOnly ? '★ Favorites' : 'Markets'}
        </h2>
        <div className="search-bar" id="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search symbols…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            id="search-input"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredSymbols.length === 0 ? (
        <div className="empty-state">
          <p>{favoritesOnly ? 'No favorites yet. Star a symbol to add it here.' : 'No symbols match your search.'}</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredSymbols.map((symbol) => (
            <ProductCard
              key={symbol}
              symbol={symbol}
              ticker={tickerData.get(symbol) ?? null}
              isFavorite={favorites.has(symbol)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────

interface ProductCardProps {
  symbol: SymbolName;
  ticker: TickerMessage | null;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
}

const ProductCard = memo(
  function ProductCard({ symbol, ticker, isFavorite, onToggleFavorite }: ProductCardProps) {
    const navigate = useNavigate();

    const lastPrice = ticker?.close ?? null;
    const change24h = ticker?.ltp_change_24h
      ? (parseFloat(ticker.ltp_change_24h) - 1) * 100
      : null;
    const volume = ticker?.volume ?? null;

    const changeClass =
      change24h !== null
        ? change24h >= 0
          ? 'positive'
          : 'negative'
        : '';

    return (
      <div
        className="product-card"
        id={`card-${symbol}`}
        onClick={() => navigate(`/product/${symbol}`)}
      >
        <button
          className={`favorite-btn ${isFavorite ? 'favorite-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(symbol);
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          id={`fav-${symbol}`}
        >
          {isFavorite ? '★' : '☆'}
        </button>

        <div className="card-header">
          <span className="card-icon">{SYMBOL_ICONS[symbol]}</span>
          <div className="card-names">
            <span className="card-symbol">{symbol}</span>
            <span className="card-name">{SYMBOL_NAMES[symbol]}</span>
          </div>
        </div>

        <div className="card-price-row">
          <span className="card-price">
            {lastPrice !== null ? `$${formatNumber(lastPrice)}` : <span className="skeleton-box" />}
          </span>
          <span className={`card-change ${changeClass}`}>
            {change24h !== null
              ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`
              : <span className="skeleton-box skeleton-box-sm" />}
          </span>
        </div>

        <div className="card-volume">
          <span className="card-volume-label">Vol 24h</span>
          <span className="card-volume-value">
            {volume !== null ? formatVolume(volume) : <span className="skeleton-box skeleton-box-sm" />}
          </span>
        </div>

        <div className="card-sparkline-placeholder" />
      </div>
    );
  },
  (prev, next) =>
    prev.symbol === next.symbol &&
    prev.isFavorite === next.isFavorite &&
    prev.ticker?.close === next.ticker?.close &&
    prev.ticker?.ltp_change_24h === next.ticker?.ltp_change_24h,
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
  return v.toFixed(2);
}
