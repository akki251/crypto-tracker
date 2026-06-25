import { useCallback, useSyncExternalStore } from 'react';
import { FAVORITES_STORAGE_KEY } from '../constants';

/**
 * Read the current favorites from localStorage.
 */
function getFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

/**
 * Write favorites to localStorage and dispatch a storage event
 * so other tabs / useSyncExternalStore pick up the change.
 */
function saveFavorites(favorites: Set<string>): void {
  const json = JSON.stringify([...favorites]);
  localStorage.setItem(FAVORITES_STORAGE_KEY, json);
  // Dispatch so same-tab listeners pick up the change
  window.dispatchEvent(new StorageEvent('storage', { key: FAVORITES_STORAGE_KEY }));
}

// Snapshot for useSyncExternalStore
let cachedFavorites = getFavorites();

function subscribe(callback: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY || event.key === null) {
      cachedFavorites = getFavorites();
      callback();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

function getSnapshot(): Set<string> {
  return cachedFavorites;
}

/**
 * Hook for managing favorites with localStorage persistence.
 * Uses useSyncExternalStore for cross-tab sync.
 */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggleFavorite = useCallback((symbol: string) => {
    const current = getFavorites();
    if (current.has(symbol)) {
      current.delete(symbol);
    } else {
      current.add(symbol);
    }
    saveFavorites(current);
  }, []);

  const isFavorite = useCallback(
    (symbol: string) => favorites.has(symbol),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
