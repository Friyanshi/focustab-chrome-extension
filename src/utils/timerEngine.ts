import { FocusTabStore, GardenTree, TimerState, TreeSpecies } from '../types/focustab';
import { playBreakCompleteSound, playFocusCompleteSound, sendSessionNotification } from './notifications';
import { getTodayDateKey } from './storage';

const SPECIES_CYCLE: TreeSpecies[] = ['oak', 'olive', 'cypress', 'maple', 'birch'];

/**
 * Computes exact remaining milliseconds using timestamp-based math
 * so closing and reopening the Chrome popup never loses time.
 */
export function computeRemainingMs(timer: TimerState, now = Date.now()): number {
  if ((timer.status === 'focus_running' || timer.status === 'break_running') && timer.endTime !== null) {
    return Math.max(0, timer.endTime - now);
  }
  return Math.max(0, timer.remainingMs);
}

/**
 * Returns both continuous (0.0 - 100.0) and integer (0 - 100) completion percentages.
 */
export function computeProgress(timer: TimerState, now = Date.now()): {
  continuousPercent: number;
  displayPercent: number;
} {
  const total = Math.max(1000, timer.totalDurationMs);
  const remaining = computeRemainingMs(timer, now);
  const elapsed = Math.max(0, total - remaining);
  const continuousPercent = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const displayPercent = Math.max(0, Math.min(100, Math.round(continuousPercent)));
  return { continuousPercent, displayPercent };
}

/**
 * Starts a new Focus session using the current settings.
 */
export function startFocusSession(
  store: FocusTabStore,
  customFocusMinutes?: number,
  customBreakMinutes?: number,
  sessionLabel?: string
): FocusTabStore {
  const now = Date.now();
  const focusMins = customFocusMinutes ?? store.settings.focusDurationMinutes;
  const breakMins = customBreakMinutes ?? store.settings.breakDurationMinutes;
  const durationMs = Math.max(1000, Math.round(focusMins * 60 * 1000));

  return {
    ...store,
    hasCompletedSetup: true,
    settings: {
      ...store.settings,
      focusDurationMinutes: focusMins,
      breakDurationMinutes: breakMins,
    },
    timer: {
      status: 'focus_running',
      totalDurationMs: durationMs,
      remainingMs: durationMs,
      endTime: now + durationMs,
      startedAt: now,
      sessionLabel: sessionLabel ?? store.timer.sessionLabel ?? 'Focused Study',
      lastEventBanner: null,
    },
  };
}

/**
 * Pauses the active Focus or Break timer and snapshots exact remaining time.
 */
export function pauseActiveTimer(store: FocusTabStore, now = Date.now()): FocusTabStore {
  const { timer } = store;
  if (timer.status !== 'focus_running' && timer.status !== 'break_running') {
    return store;
  }

  const remainingMs = computeRemainingMs(timer, now);
  return {
    ...store,
    timer: {
      ...timer,
      status: timer.status === 'focus_running' ? 'focus_paused' : 'break_paused',
      remainingMs,
      endTime: null,
    },
  };
}

/**
 * Resumes a paused Focus or Break timer from the exact remaining milliseconds.
 */
export function resumeActiveTimer(store: FocusTabStore, now = Date.now()): FocusTabStore {
  const { timer } = store;
  if (timer.status !== 'focus_paused' && timer.status !== 'break_paused') {
    return store;
  }

  const remainingMs = Math.max(1000, timer.remainingMs);
  return {
    ...store,
    timer: {
      ...timer,
      status: timer.status === 'focus_paused' ? 'focus_running' : 'break_running',
      remainingMs,
      endTime: now + remainingMs,
    },
  };
}

/**
 * Resets the current Focus session back to 100% of its configured duration.
 */
export function resetFocusSession(store: FocusTabStore, now = Date.now()): FocusTabStore {
  const durationMs = Math.max(1000, Math.round(store.settings.focusDurationMinutes * 60 * 1000));
  const wasRunning = store.timer.status === 'focus_running';

  return {
    ...store,
    timer: {
      ...store.timer,
      status: wasRunning ? 'focus_running' : 'focus_paused',
      totalDurationMs: durationMs,
      remainingMs: durationMs,
      endTime: wasRunning ? now + durationMs : null,
      startedAt: now,
      lastEventBanner: null,
    },
  };
}

/**
 * Ends the current session and returns to the setup / welcome screen.
 */
export function endCurrentSession(store: FocusTabStore): FocusTabStore {
  const durationMs = Math.max(1000, Math.round(store.settings.focusDurationMinutes * 60 * 1000));
  return {
    ...store,
    timer: {
      ...store.timer,
      status: 'setup',
      totalDurationMs: durationMs,
      remainingMs: durationMs,
      endTime: null,
      startedAt: null,
      lastEventBanner: null,
    },
  };
}

/**
 * Transitions from Focus Complete (00:00) -> records stats, plants tree, plays sound,
 * shows notification, and switches to Break Mode.
 */
export function handleFocusCompleted(
  store: FocusTabStore,
  options: { triggerSideEffects?: boolean; now?: number } = {}
): FocusTabStore {
  const now = options.now ?? Date.now();
  const triggerSideEffects = options.triggerSideEffects !== false;

  const completedFocusMinutes = Math.max(1, Math.round(store.timer.totalDurationMs / 60000));
  const todayKey = getTodayDateKey();
  const prevDay = store.statsByDate[todayKey] || { focusMinutes: 0, sessionsCompleted: 0 };

  const species = SPECIES_CYCLE[store.gardenTrees.length % SPECIES_CYCLE.length];
  const newTree: GardenTree = {
    id: `tree_${now}`,
    completedAt: now,
    dateKey: todayKey,
    durationMinutes: completedFocusMinutes,
    species,
    label: store.timer.sessionLabel || 'Focused study session',
  };

  const breakDurationMs = Math.max(1000, Math.round(store.settings.breakDurationMinutes * 60 * 1000));
  const autoStartBreak = store.settings.autoStartBreak !== false;

  if (triggerSideEffects) {
    playFocusCompleteSound(store.settings.soundEnabled);
    sendSessionNotification('Focus session complete 🌱', 'You did it. Time for a break.');
  }

  return {
    ...store,
    statsByDate: {
      ...store.statsByDate,
      [todayKey]: {
        focusMinutes: prevDay.focusMinutes + completedFocusMinutes,
        sessionsCompleted: prevDay.sessionsCompleted + 1,
      },
    },
    totalFocusMinutes: store.totalFocusMinutes + completedFocusMinutes,
    totalSessionsCompleted: store.totalSessionsCompleted + 1,
    gardenTrees: [newTree, ...store.gardenTrees],
    timer: {
      ...store.timer,
      status: autoStartBreak ? 'break_running' : 'break_paused',
      totalDurationMs: breakDurationMs,
      remainingMs: breakDurationMs,
      endTime: autoStartBreak ? now + breakDurationMs : null,
      startedAt: now,
      lastEventBanner: {
        type: 'focus_complete',
        title: 'Focus session complete 🌱',
        subtitle: 'You did it. Time for a break.',
        timestamp: now,
      },
    },
  };
}

/**
 * Transitions from Break Complete (00:00) -> plays break chime, shows notification,
 * and shows "Break's over 🌿 / Ready for another focus session?" (or auto-starts next focus).
 */
export function handleBreakCompleted(
  store: FocusTabStore,
  options: { triggerSideEffects?: boolean; now?: number } = {}
): FocusTabStore {
  const now = options.now ?? Date.now();
  const triggerSideEffects = options.triggerSideEffects !== false;
  const focusDurationMs = Math.max(1000, Math.round(store.settings.focusDurationMinutes * 60 * 1000));
  const autoStartFocus = Boolean(store.settings.autoStartNextFocus);

  if (triggerSideEffects) {
    playBreakCompleteSound(store.settings.soundEnabled);
    sendSessionNotification("Break's over 🌿", 'Ready for another focus session?');
  }

  return {
    ...store,
    timer: {
      ...store.timer,
      status: autoStartFocus ? 'focus_running' : 'break_complete',
      totalDurationMs: focusDurationMs,
      remainingMs: focusDurationMs,
      endTime: autoStartFocus ? now + focusDurationMs : null,
      startedAt: autoStartFocus ? now : null,
      lastEventBanner: {
        type: 'break_complete',
        title: "Break's over 🌿",
        subtitle: 'Ready for another focus session?',
        timestamp: now,
      },
    },
  };
}

/**
 * Skips the current break and offers/starts the next focus session.
 */
export function skipBreakToReady(store: FocusTabStore): FocusTabStore {
  const focusDurationMs = Math.max(1000, Math.round(store.settings.focusDurationMinutes * 60 * 1000));
  return {
    ...store,
    timer: {
      ...store.timer,
      status: 'break_complete',
      totalDurationMs: focusDurationMs,
      remainingMs: focusDurationMs,
      endTime: null,
      startedAt: null,
      lastEventBanner: {
        type: 'break_complete',
        title: "Break's over 🌿",
        subtitle: 'Ready for another focus session?',
        timestamp: Date.now(),
      },
    },
  };
}
