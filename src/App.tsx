/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Download, Moon, Sun } from 'lucide-react';
import { ExtensionGuideView } from './components/ExtensionGuideView';
import { ExtensionPopup } from './components/ExtensionPopup';
import { FullGardenDashboard } from './components/FocusGardenView';
import { MiniGardenTree } from './components/BotanicalTree';
import {
  FocusTabSettings,
  FocusTabStore,
  GardenTree,
  TreeSpecies,
} from './types/focustab';
import {
  DEFAULT_STORE,
  formatFocusMinutes,
  getGardenMilestoneDescription,
  getTodayDateKey,
  getTreeGrowthStage,
  isChromeExtensionEnv,
  loadFocusTabStore,
  saveFocusTabStore,
  subscribeToStoreChanges,
} from './utils/storage';
import {
  computeProgress,
  computeRemainingMs,
  endCurrentSession,
  handleBreakCompleted,
  handleFocusCompleted,
  pauseActiveTimer,
  resetFocusSession,
  resumeActiveTimer,
  skipBreakToReady,
  startFocusSession,
} from './utils/timerEngine';

type DesktopNavTab = 'workspace' | 'garden' | 'extension';

export default function App() {
  const [store, setStore] = useState<FocusTabStore>(DEFAULT_STORE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [activeTab, setActiveTab] = useState<DesktopNavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'garden') return 'garden';
      if (view === 'extension') return 'extension';
    }
    return 'workspace';
  });

  // Detect if running inside a compact Chrome Extension popup window (<= 440px wide or extension default popup)
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasViewParam = new URLSearchParams(window.location.search).has('view');
    if (isChromeExtensionEnv() && !hasViewParam && window.innerWidth <= 800) {
      return true;
    }
    return window.innerWidth <= 440;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsCompactViewport(window.innerWidth <= 440);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load initial state from chrome.storage.local (or localStorage fallback)
  useEffect(() => {
    let mounted = true;
    loadFocusTabStore().then((loaded) => {
      if (!mounted) return;
      // Check if an active timer expired while the popup was closed
      const currentNow = Date.now();
      let reconciled = loaded;

      if (
        reconciled.timer.status === 'focus_running' &&
        reconciled.timer.endTime !== null &&
        currentNow >= reconciled.timer.endTime
      ) {
        reconciled = handleFocusCompleted(reconciled, {
          triggerSideEffects: true,
          now: currentNow,
        });
        saveFocusTabStore(reconciled);
      } else if (
        reconciled.timer.status === 'break_running' &&
        reconciled.timer.endTime !== null &&
        currentNow >= reconciled.timer.endTime
      ) {
        reconciled = handleBreakCompleted(reconciled, {
          triggerSideEffects: true,
          now: currentNow,
        });
        saveFocusTabStore(reconciled);
      }

      setStore(reconciled);
      setIsLoaded(true);
    });

    const unsubscribe = subscribeToStoreChanges((updatedStore) => {
      if (mounted) {
        setStore(updatedStore);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Timestamp-based ticker (updates every 200ms for smooth countdown & tree growth)
  useEffect(() => {
    if (!isLoaded) return;

    const interval = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      setStore((prev) => {
        if (
          prev.timer.status === 'focus_running' &&
          prev.timer.endTime !== null &&
          currentNow >= prev.timer.endTime
        ) {
          const next = handleFocusCompleted(prev, {
            triggerSideEffects: true,
            now: currentNow,
          });
          saveFocusTabStore(next);
          return next;
        }

        if (
          prev.timer.status === 'break_running' &&
          prev.timer.endTime !== null &&
          currentNow >= prev.timer.endTime
        ) {
          const next = handleBreakCompleted(prev, {
            triggerSideEffects: true,
            now: currentNow,
          });
          saveFocusTabStore(next);
          return next;
        }

        return prev;
      });
    }, 200);

    return () => window.clearInterval(interval);
  }, [isLoaded]);

  const updateAndPersist = (nextStore: FocusTabStore) => {
    setStore(nextStore);
    setNow(Date.now());
    saveFocusTabStore(nextStore);
  };

  const handleStartFocus = (focusMins: number, breakMins: number) => {
    updateAndPersist(startFocusSession(store, focusMins, breakMins));
  };

  const handlePause = () => {
    updateAndPersist(pauseActiveTimer(store));
  };

  const handleResume = () => {
    updateAndPersist(resumeActiveTimer(store));
  };

  const handleReset = () => {
    updateAndPersist(resetFocusSession(store));
  };

  const handleEndSession = () => {
    updateAndPersist(endCurrentSession(store));
  };

  const handleSkipBreak = () => {
    updateAndPersist(skipBreakToReady(store));
  };

  const handleStartNextFocus = () => {
    updateAndPersist(
      startFocusSession(
        store,
        store.settings.focusDurationMinutes,
        store.settings.breakDurationMinutes
      )
    );
  };

  const handleUpdateSettings = (newSettings: FocusTabSettings) => {
    const isSetup = store.timer.status === 'setup';
    const nextFocusMs = Math.max(1000, Math.round(newSettings.focusDurationMinutes * 60 * 1000));
    updateAndPersist({
      ...store,
      settings: newSettings,
      timer: isSetup
        ? {
            ...store.timer,
            totalDurationMs: nextFocusMs,
            remainingMs: nextFocusMs,
          }
        : store.timer,
    });
  };

  const handleFastCompleteStep = () => {
    if (
      store.timer.status === 'focus_running' ||
      store.timer.status === 'focus_paused'
    ) {
      updateAndPersist(handleFocusCompleted(store, { triggerSideEffects: true }));
    } else if (
      store.timer.status === 'break_running' ||
      store.timer.status === 'break_paused'
    ) {
      updateAndPersist(handleBreakCompleted(store, { triggerSideEffects: true }));
    }
  };

  const handlePlantDemoTree = (
    minutes: number,
    label: string,
    species: TreeSpecies
  ) => {
    const currentNow = Date.now();
    const todayKey = getTodayDateKey();
    const prevDay = store.statsByDate[todayKey] || {
      focusMinutes: 0,
      sessionsCompleted: 0,
    };
    const newTree: GardenTree = {
      id: `tree_${currentNow}`,
      completedAt: currentNow,
      dateKey: todayKey,
      durationMinutes: minutes,
      species,
      label,
    };

    updateAndPersist({
      ...store,
      statsByDate: {
        ...store.statsByDate,
        [todayKey]: {
          focusMinutes: prevDay.focusMinutes + minutes,
          sessionsCompleted: prevDay.sessionsCompleted + 1,
        },
      },
      totalFocusMinutes: store.totalFocusMinutes + minutes,
      totalSessionsCompleted: store.totalSessionsCompleted + 1,
      gardenTrees: [newTree, ...store.gardenTrees],
    });
  };

  const handleClearGarden = () => {
    updateAndPersist({
      ...store,
      statsByDate: {},
      totalFocusMinutes: 0,
      totalSessionsCompleted: 0,
      gardenTrees: [],
    });
  };

  const handleOpenFullGardenFromPopup = () => {
    if (isCompactViewport && isChromeExtensionEnv()) {
      const chromeObj = (window as unknown as { chrome: any }).chrome;
      if (chromeObj?.tabs?.create) {
        chromeObj.tabs.create({ url: 'index.html?view=garden' });
        return;
      }
    }
    setActiveTab('garden');
  };

  const remainingMs = computeRemainingMs(store.timer, now);
  const { continuousPercent, displayPercent } = computeProgress(store.timer, now);
  const isDark = store.settings.theme === 'dark';
  const todayKey = getTodayDateKey();
  const todayStats = store.statsByDate[todayKey] || {
    focusMinutes: 0,
    sessionsCompleted: 0,
  };
  const currentStage = getTreeGrowthStage(continuousPercent);

  // If opened directly inside the 400x600 Chrome Extension Popup window:
  if (isCompactViewport) {
    return (
      <div className="w-[400px] max-w-full min-h-[600px] mx-auto flex justify-center bg-[#FBF9F5] dark:bg-[#161D18]">
        <ExtensionPopup
          store={store}
          remainingMs={remainingMs}
          continuousPercent={continuousPercent}
          displayPercent={displayPercent}
          onStartFocus={handleStartFocus}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
          onEndSession={handleEndSession}
          onSkipBreak={handleSkipBreak}
          onStartNextFocus={handleStartNextFocus}
          onUpdateSettings={handleUpdateSettings}
          onFastCompleteStep={handleFastCompleteStep}
          onOpenFullGarden={handleOpenFullGardenFromPopup}
          isStandalonePopupFrame={false}
        />
      </div>
    );
  }

  const growthStagesList = [
    { range: '0–20%', name: 'Small seed / sprout', id: 'seed_sprout' },
    { range: '20–40%', name: 'Small plant', id: 'small_plant' },
    { range: '40–60%', name: 'Young tree', id: 'young_tree' },
    { range: '60–80%', name: 'Larger tree with more leaves', id: 'larger_tree' },
    { range: '80–99%', name: 'Mature tree', id: 'mature_tree' },
    { range: '100%', name: 'Beautiful full-grown tree', id: 'full_grown_tree' },
  ];

  // Full Desktop / Companion Workspace View
  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark
          ? 'bg-[#121814] text-[#EAE6DF]'
          : 'bg-[#F5F1E8] text-[#252926]'
      }`}
    >
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Nav Links) — Zone 3 (Primary Actions) */}
      <header
        className={`border-b transition-colors ${
          isDark
            ? 'bg-[#151C17]/90 border-[#263229]'
            : 'bg-[#FBF9F5]/90 border-[#E5DFD2]'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('workspace');
            }}
            className="font-display text-xl font-semibold tracking-tight"
          >
            FocusTab
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav className="flex items-center gap-7 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('workspace')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'workspace'
                  ? 'underline underline-offset-8 decoration-2'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              Focus Timer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('garden')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'garden'
                  ? 'underline underline-offset-8 decoration-2'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              Focus Garden ({store.gardenTrees.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('extension')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'extension'
                  ? 'underline underline-offset-8 decoration-2'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              Chrome Extension Setup
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <a
              href="/focustab-extension.zip"
              download="focustab-chrome-extension.zip"
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-[#4E7559] hover:bg-[#5B8667] text-white'
                  : 'bg-[#3F624D] hover:bg-[#33513F] text-[#FBF9F5]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Download Extension (.zip)
            </a>

            <button
              type="button"
              onClick={() =>
                handleUpdateSettings({
                  ...store.settings,
                  theme: isDark ? 'light' : 'dark',
                })
              }
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-[#1D2620] border-[#2E3C32] text-[#E4E0D8] hover:bg-[#26322A]'
                  : 'bg-[#F3EFE6] border-[#DFD8C8] text-[#2E332F] hover:bg-[#EAE4D7]'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Authentic 400px x 600px Chrome Extension Popup Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-[400px] max-w-full flex items-center justify-between text-xs opacity-65 mb-2.5 px-1">
                <span>Chrome Extension Popup (400 × 600)</span>
                <span className="font-mono-tabular">Manifest V3</span>
              </div>

              <ExtensionPopup
                store={store}
                remainingMs={remainingMs}
                continuousPercent={continuousPercent}
                displayPercent={displayPercent}
                onStartFocus={handleStartFocus}
                onPause={handlePause}
                onResume={handleResume}
                onReset={handleReset}
                onEndSession={handleEndSession}
                onSkipBreak={handleSkipBreak}
                onStartNextFocus={handleStartNextFocus}
                onUpdateSettings={handleUpdateSettings}
                onFastCompleteStep={handleFastCompleteStep}
                onOpenFullGarden={() => setActiveTab('garden')}
                isStandalonePopupFrame={true}
              />
            </div>

            {/* Right Column: Live Companion Sanctuary, Daily Stats & Growth Stages */}
            <div className="lg:col-span-7 space-y-6 lg:pt-6">
              {/* Intro & Quick Demo Bar */}
              <div
                className={`rounded-3xl p-6 border ${
                  isDark
                    ? 'bg-[#18201B] border-[#28352C]'
                    : 'bg-[#FBF9F5] border-[#E6DFD2]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-lg">
                    <h2 className="font-display text-2xl font-semibold tracking-tight">
                      Calm, distraction-free study sessions.
                    </h2>
                    <p className="text-sm opacity-75 mt-1 leading-relaxed">
                      Every minute you stay focused nurtures your tree from a tiny seed into a mature canopy. Your progress is persisted with timestamp accuracy in <code className="font-mono-tabular text-xs">chrome.storage.local</code>.
                    </p>
                  </div>

                  {/* Quick 10-second demo session button for testing full growth + alarm */}
                  <button
                    type="button"
                    onClick={() => handleStartFocus(0.15, 0.1)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                      isDark
                        ? 'bg-[#26332A] hover:bg-[#314236] text-[#CFE0D4]'
                        : 'bg-[#EBF1EC] hover:bg-[#DDE8DF] text-[#2F4F3A]'
                    }`}
                    title="Starts a 9-second focus timer followed by a 6-second break so you can watch the full tree growth and alarm cycle"
                  >
                    Run 9s Demo Cycle
                  </button>
                </div>

                {/* Today's Focus Live Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-current/10">
                  <div>
                    <div className="text-xs opacity-65">Today&apos;s Focus Time</div>
                    <div className="font-display text-2xl font-semibold font-mono-tabular mt-0.5">
                      {formatFocusMinutes(todayStats.focusMinutes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-65">Sessions Completed Today</div>
                    <div className="font-display text-2xl font-semibold font-mono-tabular mt-0.5">
                      {todayStats.sessionsCompleted}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-65">Saved Rhythm</div>
                    <div className="font-display text-2xl font-semibold font-mono-tabular mt-0.5">
                      {store.settings.focusDurationMinutes}m / {store.settings.breakDurationMinutes}m
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Focus Garden Sanctuary Card */}
              <div
                className={`rounded-3xl p-6 border ${
                  isDark
                    ? 'bg-[#18201B] border-[#28352C]'
                    : 'bg-[#FBF9F5] border-[#E6DFD2]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      🌱 Your Focus Garden
                    </h3>
                    <p className="text-xs opacity-70">
                      {getGardenMilestoneDescription(store.gardenTrees.length)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('garden')}
                    className="text-xs font-medium underline opacity-75 hover:opacity-100 whitespace-nowrap"
                  >
                    Open Full Garden →
                  </button>
                </div>

                {store.gardenTrees.length === 0 ? (
                  <div
                    className={`rounded-2xl p-6 text-center text-xs ${
                      isDark
                        ? 'bg-[#131915] text-[#94A398]'
                        : 'bg-[#F3EFE6] text-[#606862]'
                    }`}
                  >
                    Complete your first focus session (or click &ldquo;Run 9s Demo Cycle&rdquo; above) to plant your first tree.
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl p-4 ${
                      isDark ? 'bg-[#131915]' : 'bg-[#F3EFE6]'
                    }`}
                  >
                    <div className="flex items-end gap-3 flex-wrap">
                      {store.gardenTrees.slice(0, 14).map((tree) => (
                        <div
                          key={tree.id}
                          className="flex flex-col items-center"
                          title={`${tree.durationMinutes}m focus (${tree.dateKey})`}
                        >
                          <MiniGardenTree
                            species={tree.species}
                            darkMode={isDark}
                            durationMinutes={tree.durationMinutes}
                          />
                          <span className="font-mono-tabular text-[10px] opacity-65">
                            {tree.durationMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 6-Stage Botanical Growth Progression Table */}
              <div
                className={`rounded-3xl p-6 border ${
                  isDark
                    ? 'bg-[#18201B] border-[#28352C]'
                    : 'bg-[#FBF9F5] border-[#E6DFD2]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base font-semibold">
                    Botanical Growth Progression
                  </h3>
                  <span className="font-mono-tabular text-xs opacity-70">
                    Current: {displayPercent}% focused
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {growthStagesList.map((st) => {
                    const isCurrent =
                      (store.timer.status === 'focus_running' ||
                        store.timer.status === 'focus_paused') &&
                      currentStage.id === st.id;
                    return (
                      <div
                        key={st.id}
                        className={`rounded-xl p-3 border text-xs transition-colors ${
                          isCurrent
                            ? isDark
                              ? 'bg-[#233227] border-[#527C5E] text-white'
                              : 'bg-[#E9F1EB] border-[#4A6B53] text-[#1F3626]'
                            : isDark
                              ? 'bg-[#141A16] border-[#242F27] opacity-75'
                              : 'bg-[#F4F0E8] border-[#E6DFD1] opacity-80'
                        }`}
                      >
                        <div className="font-mono-tabular font-semibold mb-0.5">
                          {st.range}
                        </div>
                        <div className="opacity-85">{st.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'garden' && (
          <FullGardenDashboard
            store={store}
            onPlantDemoTree={handlePlantDemoTree}
            onClearGarden={handleClearGarden}
          />
        )}

        {activeTab === 'extension' && <ExtensionGuideView store={store} />}
      </div>
    </div>
  );
}
