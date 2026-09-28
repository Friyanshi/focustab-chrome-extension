export type TimerStatus =
  | 'setup'
  | 'focus_running'
  | 'focus_paused'
  | 'break_running'
  | 'break_paused'
  | 'break_complete';

export type TreeSpecies = 'oak' | 'olive' | 'cypress' | 'maple' | 'birch';

export type TreeGrowthStageId =
  | 'seed_sprout'     // 0 - 20%
  | 'small_plant'     // 20 - 40%
  | 'young_tree'      // 40 - 60%
  | 'larger_tree'     // 60 - 80%
  | 'mature_tree'     // 80 - 99%
  | 'full_grown_tree'; // 100%

export interface TreeGrowthStageInfo {
  id: TreeGrowthStageId;
  label: string;
  rangeLabel: string;
  description: string;
}

export interface FocusTabSettings {
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  soundEnabled: boolean;
  autoStartNextFocus: boolean;
  autoStartBreak: boolean;
  theme: 'light' | 'dark';
}

export interface EventBanner {
  type: 'focus_complete' | 'break_complete';
  title: string;
  subtitle: string;
  timestamp: number;
}

export interface TimerState {
  status: TimerStatus;
  totalDurationMs: number;
  remainingMs: number;
  endTime: number | null;
  startedAt: number | null;
  sessionLabel: string;
  lastEventBanner: EventBanner | null;
}

export interface GardenTree {
  id: string;
  completedAt: number;
  dateKey: string;
  durationMinutes: number;
  species: TreeSpecies;
  label: string;
}

export interface DailyStats {
  focusMinutes: number;
  sessionsCompleted: number;
}

export interface FocusTabStore {
  hasCompletedSetup: boolean;
  settings: FocusTabSettings;
  timer: TimerState;
  statsByDate: Record<string, DailyStats>;
  totalFocusMinutes: number;
  totalSessionsCompleted: number;
  gardenTrees: GardenTree[];
}
