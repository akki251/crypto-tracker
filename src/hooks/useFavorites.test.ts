import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from './useFavorites';
import { FAVORITES_STORAGE_KEY } from '../constants';

// Mock localStorage for JSDOM
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('useFavorites', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Dispatch storage event to reset cached snapshot in hook
    window.dispatchEvent(new StorageEvent('storage', { key: FAVORITES_STORAGE_KEY }));
  });

  it('starts with an empty favorites set', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites.size).toBe(0);
    expect(result.current.isFavorite('BTCUSD')).toBe(false);
  });

  it('allows toggling a favorite symbol and persists to localStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite('BTCUSD');
    });

    expect(result.current.isFavorite('BTCUSD')).toBe(true);
    expect(localStorageMock.getItem(FAVORITES_STORAGE_KEY)).toBe(JSON.stringify(['BTCUSD']));

    act(() => {
      result.current.toggleFavorite('BTCUSD');
    });

    expect(result.current.isFavorite('BTCUSD')).toBe(false);
    expect(localStorageMock.getItem(FAVORITES_STORAGE_KEY)).toBe(JSON.stringify([]));
  });
});
