import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from '../storage';
import LZString from 'lz-string';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock dispatchEvent to avoid errors
window.dispatchEvent = vi.fn();

describe('storage.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    if ((storage as any).__resetCache) {
      (storage as any).__resetCache();
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('get()', () => {
    it('returns default state when empty', () => {
      const state = storage.get();
      expect(state.plants).toEqual([]);
      expect(state.tasks).toEqual([]);
      expect(state.settings).toEqual({});
    });

    it('parses compressed data correctly', () => {
      const sampleState = { plants: [{ id: '1', name: 'Fern' }], tasks: [], settings: {} };
      const compressed = LZString.compressToUTF16(JSON.stringify(sampleState));
      localStorage.setItem('prune_app_data', compressed);

      const state = storage.get();
      expect(state.plants).toHaveLength(1);
      expect(state.plants[0].name).toBe('Fern');
    });

    it('falls back to default on parse error', () => {
        localStorage.setItem('prune_app_data', 'invalid-data');
        const state = storage.get();
        expect(state.plants).toEqual([]);
    });
  });

  describe('set()', () => {
    it('saves compressed data', () => {
      const sampleState = { plants: [{ id: '1', name: 'Fern' }], tasks: [], settings: {} };
      storage.set(sampleState as any);

      vi.advanceTimersByTime(250); // Trigger debounce

      const saved = localStorage.getItem('prune_app_data');
      expect(saved).not.toBeNull();
      
      const decompressed = LZString.decompressFromUTF16(saved!);
      const parsed = JSON.parse(decompressed!);
      expect(parsed.plants[0].name).toBe('Fern');
    });
  });

  describe('addPlant()', () => {
    it('adds plant to state', () => {
      const plant = { id: '1', name: 'Fern' };
      storage.addPlant(plant as any);

      const state = storage.get();
      expect(state.plants).toHaveLength(1);
      expect(state.plants[0].name).toBe('Fern');
    });
  });

  describe('deletePlant()', () => {
    it('removes plant and its tasks', () => {
      const plantId = 'Fern';
      const sampleState = {
         plants: [{ id: plantId, name: 'Fern' }],
         tasks: [{ id: 'task1', plantId: plantId, month: 3, year: 2025, completed: false }, { id: 'task2', plantId: 'Other', month: 3, year: 2025, completed: false }],
         settings: {}
      };
      
      const compressed = LZString.compressToUTF16(JSON.stringify(sampleState));
      localStorage.setItem('prune_app_data', compressed);

      storage.deletePlant(plantId);

      const state = storage.get();
      expect(state.plants).toHaveLength(0);
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].plantId).toBe('Other');
    });
  });
});
