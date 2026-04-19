import { AppState, Plant, Task, AppSettings } from '../types';
import LZString from 'lz-string';

const STORAGE_KEY = 'prune_app_data';

const DEFAULT_STATE: AppState = {
  plants: [],
  tasks: [],
  settings: {}
};

let inMemoryState: AppState | null = null;
let debounceTimer: any = null;

// Save on exit to avoid data loss from debounce delay
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (debounceTimer && inMemoryState) {
      clearTimeout(debounceTimer);
      const stringified = JSON.stringify(inMemoryState);
      const compressed = LZString.compressToUTF16(stringified);
      localStorage.setItem(STORAGE_KEY, compressed);
    }
  });
}

export const storage = {
  get: (): AppState => {
    if (inMemoryState) return inMemoryState;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        inMemoryState = DEFAULT_STATE;
        return DEFAULT_STATE;
      }
      
      let parsed;

      // 1. Try to parse as plain JSON first (backward compatibility)
      try {
        const plain = JSON.parse(data);
        if (plain && typeof plain === 'object') {
          parsed = plain;
        }
      } catch (e) {
        // Not plain JSON, ignore
      }

      // 2. If not plain JSON, try to decompress
      if (!parsed) {
        try {
          const decompressed = LZString.decompressFromUTF16(data);
          if (decompressed) {
            parsed = JSON.parse(decompressed);
          }
        } catch (e) {
          console.error('Failed to decompress or parse state', e);
        }
      }

      if (!parsed) {
        inMemoryState = DEFAULT_STATE;
        return DEFAULT_STATE;
      }

      inMemoryState = {
        plants: Array.isArray(parsed.plants) ? parsed.plants : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        settings: parsed.settings || {}
      };

      return inMemoryState;
    } catch (e) {
      console.error('Failed to load state', e);
      inMemoryState = DEFAULT_STATE;
      return DEFAULT_STATE;
    }
  },

  set: (state: AppState): boolean => {
    try {
      inMemoryState = state; // Update memory instantly

      // Dispatch instantly for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('prune-storage-update'));
      }

      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        try {
          const stringified = JSON.stringify(state);
          const compressed = LZString.compressToUTF16(stringified);
          localStorage.setItem(STORAGE_KEY, compressed);
        } catch (e) {
          console.error('Failed to save state to localStorage', e);
        }
      }, 200);

      return true;
    } catch (e) {
      console.error('Failed to save state to memory', e);
      return false;
    }
  },

  // Atomic updates
  updateSettings: (settings: Partial<AppSettings>): boolean => {
    const state = storage.get();
    const newState = { ...state, settings: { ...state.settings, ...settings } };
    return storage.set(newState);
  },

  addPlant: (plant: Plant): boolean => {
    const state = storage.get();
    const newState = { ...state, plants: [...state.plants, plant] };
    return storage.set(newState);
  },

  updatePlant: (plant: Plant) => {
    const state = storage.get();
    const newState = {
      ...state,
      plants: state.plants.map(p => p.id === plant.id ? plant : p)
    };
    storage.set(newState);
    return newState;
  },

  deletePlant: (plantId: string) => {
    const state = storage.get();
    // Atomic deletion: remove plant AND its tasks
    const newState = {
      ...state,
      plants: state.plants.filter(p => p.id !== plantId),
      tasks: state.tasks.filter(t => t.plantId !== plantId)
    };
    storage.set(newState);
    return newState;
  },

  toggleTask: (plantId: string, month: number, year: number, taskName?: string) => {
    const state = storage.get();
    
    const plant = state.plants.find(p => p.id === plantId);
    // Find matching grouped task if it exists
    const taskDef = plant?.pruningTasks?.find(t => t.name === taskName);
    const isOnce = taskDef?.type === 'once';

    // Target range of months to toggle
    const targetMonths = isOnce ? taskDef.months : [month];

    const isCurrentlyCompleted = state.tasks.some(
      t => t.plantId === plantId && t.month === month && t.taskName === taskName && t.year === year && t.completed
    );

    let newTasks = [...state.tasks];

    // Remove existing records for the target months for this task to toggle safely
    newTasks = newTasks.filter(
      t => !(t.plantId === plantId && targetMonths.includes(t.month) && t.taskName === taskName && t.year === year)
    );

    if (!isCurrentlyCompleted) {
      // Add completion for all target months
      targetMonths.forEach(m => {
        newTasks.push({
          id: crypto.randomUUID(),
          plantId,
          month: m,
          year,
          completed: true,
          taskName
        });
      });
    }

    const newState = { ...state, tasks: newTasks };
    storage.set(newState);
    return newState;
  },

  importData: (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      // Basic validation
      if (Array.isArray(data.plants) && Array.isArray(data.tasks)) {
        // Ensure all plants have pruningTasks if they have pruningMonths
        const upgradedPlants = data.plants.map((p: any) => {
          if ((!p.pruningTasks || p.pruningTasks.length === 0) && p.pruningMonths && p.pruningMonths.length > 0) {
            return {
              ...p,
              pruningTasks: [{ name: 'Pruning', type: 'recurring', months: p.pruningMonths }]
            };
          }
          return p;
        });
        return storage.set({ ...data, plants: upgradedPlants });
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  // Test helper to clear memory cache
  __resetCache: () => {
    inMemoryState = null;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }
};
