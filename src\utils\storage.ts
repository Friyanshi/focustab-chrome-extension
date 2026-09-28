import { FocusTabStore, TreeGrowthStageInfo } from '../types/focustab';

export const STORAGE_KEY = 'focustab_state_v1';

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_STORE: FocusTabStore = {
  hasCompletedSetup: false,
  settings: {
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    soundEnabled: true,
    autoStartNextFocus: false,
    autoStartBreak: true,
    theme: 'light',
  },
  timer: {
    status: 'setup',
    totalDurationMs: 25 * 60 * 1000,
    remainingMs: 25 * 60 * 1000,
    endTime: null,
    startedAt: null,
    sessionLabel: 'Deep Study Session',
    lastEventBanner: null,
  },
  statsByDate: {},
  totalFocusMinutes: 0,
  totalSessionsCompleted: 0,
  gardenTrees: [],
};

export function isChromeExtensionEnv(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { chrome?: { storage?: { local?: unknown } } }).chrome !== 'undefined' &&
    Boolean((window as unknown as { chrome?: { storage?: { local?: unknown } } }).chrome?.storage?.local)
  );
}

export async function loadFocusTabStore(): Promise<FocusTabStore> {
  if (isChromeExtensionEnv()) {
    const chromeObj = (window as unknown as { chrome: any }).chrome;
    return new Promise((resolve) => {
      chromeObj.storage.local.get([STORAGE_KEY], (result: Record<string, any>) => {
        if (result && result[STORAGE_KEY]) {
          const merged = mergeWithDefault(result[STORAGE_KEY]);
          resolve(merged);
        } else {
          // Check localStorage fallback if migrating
          const localRaw = localStorage.getItem(STORAGE_KEY);
          if (localRaw) {
            try {
              const parsed = mergeWithDefault(JSON.parse(localRaw));
              chromeObj.storage.local.set({ [STORAGE_KEY]: parsed });
              resolve(parsed);
              return;
            } catch {
              // ignore parse error
            }
          }
          resolve(DEFAULT_STORE);
        }
      });
    });
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    return mergeWithDefault(JSON.parse(raw));
  } catch {
    return DEFAULT_STORE;
  }
}

export async function saveFocusTabStore(store: FocusTabStore): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('focustab-local-storage-update', { detail: store }));
  } catch {
    // ignore storage quota errors
  }

  if (isChromeExtensionEnv()) {
    const chromeObj = (window as unknown as { chrome: any }).chrome;
    return new Promise((resolve) => {
      chromeObj.storage.local.set({ [STORAGE_KEY]: store }, () => {
        resolve();
      });
    });
  }
}

export function subscribeToStoreChanges(callback: (newStore: FocusTabStore) => void): () => void {
  const handleCustomUpdate = (e: Event) => {
    const customEvent = e as CustomEvent<FocusTabStore>;
    if (customEvent.detail) {
      callback(mergeWithDefault(customEvent.detail));
    }
  };

  const handleWindowStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        callback(mergeWithDefault(JSON.parse(e.newValue)));
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener('focustab-local-storage-update', handleCustomUpdate);
  window.addEventListener('storage', handleWindowStorage);

  let chromeListener: ((changes: any, areaName: string) => void) | null = null;
  if (isChromeExtensionEnv()) {
    const chromeObj = (window as unknown as { chrome: any }).chrome;
    chromeListener = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes[STORAGE_KEY]?.newValue) {
        callback(mergeWithDefault(changes[STORAGE_KEY].newValue));
      }
    };
    chromeObj.storage.onChanged.addListener(chromeListener);
  }

  return () => {
    window.removeEventListener('focustab-local-storage-update', handleCustomUpdate);
    window.removeEventListener('storage', handleWindowStorage);
    if (chromeListener && isChromeExtensionEnv()) {
      const chromeObj = (window as unknown as { chrome: any }).chrome;
      chromeObj.storage.onChanged.removeListener(chromeListener);
    }
  };
}

function mergeWithDefault(partial: Partial<FocusTabStore>): FocusTabStore {
  return {
    ...DEFAULT_STORE,
    ...partial,
    settings: {
      ...DEFAULT_STORE.settings,
      ...(partial.settings || {}),
    },
    timer: {
      ...DEFAULT_STORE.timer,
      ...(partial.timer || {}),
    },
    statsByDate: partial.statsByDate || {},
    gardenTrees: Array.isArray(partial.gardenTrees) ? partial.gardenTrees : [],
  };
}

/**
 * Formats milliseconds into MM:SS or HH:MM:SS for the countdown display.
 */
export function formatCountdown(ms: number): string {
  const clampedMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(clampedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Formats focus minutes into readable strings like "1h 25m" or "45m" or "0m".
 */
export function formatFocusMinutes(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }
  if (remainder === 0) {
    return `${hours}h 0m`;
  }
  return `${hours}h ${remainder}m`;
}

/**
 * Maps focus percentage (0 - 100) to the 6 botanical tree growth stages.
 */
export function getTreeGrowthStage(progressPercent: number): TreeGrowthStageInfo {
  const p = Math.max(0, Math.min(100, progressPercent));

  if (p >= 100) {
    return {
      id: 'full_grown_tree',
      label: 'Full-Grown Tree',
      rangeLabel: '100%',
      description: 'In full bloom — session complete',
    };
  }
  if (p >= 80) {
    return {
      id: 'mature_tree',
      label: 'Mature Tree',
      rangeLabel: '80–99%',
      description: 'Deep roots and a lush, thriving canopy',
    };
  }
  if (p >= 60) {
    return {
      id: 'larger_tree',
      label: 'Larger Tree',
      rangeLabel: '60–80%',
      description: 'Canopy expanding with layered leaves',
    };
  }
  if (p >= 40) {
    return {
      id: 'young_tree',
      label: 'Young Tree',
      rangeLabel: '40–60%',
      description: 'Woody trunk forming with early branches',
    };
  }
  if (p >= 20) {
    return {
      id: 'small_plant',
      label: 'Small Plant',
      rangeLabel: '20–40%',
      description: 'First true leaves reaching toward light',
    };
  }
  return {
    id: 'seed_sprout',
    label: 'Small Seed & Sprout',
    rangeLabel: '0–20%',
    description: 'Taking root in quiet focus',
  };
}

/**
 * Describes the user's garden status based on completed sessions count.
 */
export function getGardenMilestoneDescription(count: number): string {
  if (count === 0) return 'Complete your first focus session to plant your first seed.';
  if (count === 1) return 'One small plant has taken root in your focus garden.';
  if (count < 5) return `${count} plants growing — your quiet study plot is taking shape.`;
  if (count < 10) return `${count} trees flourishing — a peaceful small garden.`;
  return `${count} trees strong — a thriving botanical focus sanctuary.`;
}
