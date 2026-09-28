import React, { useState } from 'react';
import { Calendar, Clock, Plus, Sprout, Trash2 } from 'lucide-react';
import { FocusTabStore, GardenTree, TreeSpecies } from '../types/focustab';
import {
  formatFocusMinutes,
  getGardenMilestoneDescription,
  getTodayDateKey,
  getTreeGrowthStage,
} from '../utils/storage';
import { BotanicalTree, MiniGardenTree } from './BotanicalTree';

interface CompactPopupGardenProps {
  store: FocusTabStore;
  onOpenFullGarden?: () => void;
}

/**
 * Compact Daily Progress + Focus Garden footer rendered inside the 400x600 Chrome Extension Popup.
 */
export const CompactPopupGarden: React.FC<CompactPopupGardenProps> = ({
  store,
  onOpenFullGarden,
}) => {
  const isDark = store.settings.theme === 'dark';
  const todayKey = getTodayDateKey();
  const todayStats = store.statsByDate[todayKey] || {
    focusMinutes: 0,
    sessionsCompleted: 0,
  };

  const visibleTrees = store.gardenTrees.slice(0, 12);

  return (
    <div
      className={`w-full rounded-2xl p-3.5 transition-colors border ${
        isDark
          ? 'bg-[#1D2620] border-[#2C3930] text-[#E6E2DA]'
          : 'bg-[#F3EFE6] border-[#E5DECFE0] text-[#2B302C]'
      }`}
    >
      {/* Today's Focus Header & Stats */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-tight">Today&apos;s Focus</span>
        {onOpenFullGarden && (
          <button
            type="button"
            onClick={onOpenFullGarden}
            className="text-[11px] underline opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            Expand garden
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs mb-3 pb-2.5 border-b border-current/10">
        <div>
          <span className="opacity-70">Focus time: </span>
          <span className="font-mono-tabular font-semibold">
            {formatFocusMinutes(todayStats.focusMinutes)}
          </span>
        </div>
        <span aria-hidden="true" className="opacity-30">
          ·
        </span>
        <div>
          <span className="opacity-70">Sessions completed: </span>
          <span className="font-mono-tabular font-semibold">
            {todayStats.sessionsCompleted}
          </span>
        </div>
      </div>

      {/* Your focus garden */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium">🌱 Your focus garden</span>
          <span className="text-[11px] font-mono-tabular opacity-65">
            {store.gardenTrees.length}{' '}
            {store.gardenTrees.length === 1 ? 'tree' : 'trees'}
          </span>
        </div>

        {store.gardenTrees.length === 0 ? (
          <div
            className={`rounded-xl py-3 px-3 text-center text-xs ${
              isDark ? 'bg-[#161D18] text-[#9BA89E]' : 'bg-[#FAF7F2] text-[#68706A]'
            }`}
          >
            Complete a focus session to grow your first tree here.
          </div>
        ) : (
          <div
            className={`relative rounded-xl px-3 pt-2 pb-1.5 overflow-hidden ${
              isDark ? 'bg-[#161D18]' : 'bg-[#FAF7F2]'
            }`}
          >
            <div className="flex items-end gap-1 overflow-x-auto py-0.5 no-scrollbar">
              {visibleTrees.map((tree) => (
                <div
                  key={tree.id}
                  className="shrink-0 flex flex-col items-center group"
                  title={`${tree.durationMinutes} min focus (${tree.dateKey})`}
                >
                  <MiniGardenTree
                    species={tree.species}
                    darkMode={isDark}
                    durationMinutes={tree.durationMinutes}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] opacity-65 mt-1 truncate">
              {getGardenMilestoneDescription(store.gardenTrees.length)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface FullGardenDashboardProps {
  store: FocusTabStore;
  onPlantDemoTree: (minutes: number, label: string, species: TreeSpecies) => void;
  onClearGarden?: () => void;
}

/**
 * Full-page Focus Garden & Botanical Growth Inspector for desktop / companion tab view.
 */
export const FullGardenDashboard: React.FC<FullGardenDashboardProps> = ({
  store,
  onPlantDemoTree,
  onClearGarden,
}) => {
  const isDark = store.settings.theme === 'dark';
  const todayKey = getTodayDateKey();
  const todayStats = store.statsByDate[todayKey] || {
    focusMinutes: 0,
    sessionsCompleted: 0,
  };

  const [inspectorProgress, setInspectorProgress] = useState<number>(68);
  const [selectedTree, setSelectedTree] = useState<GardenTree | null>(null);

  const stageInfo = getTreeGrowthStage(inspectorProgress);

  const stagePresets = [
    { label: '0–20% Sprout', value: 12 },
    { label: '20–40% Small Plant', value: 32 },
    { label: '40–60% Young Tree', value: 52 },
    { label: '60–80% Larger Tree', value: 72 },
    { label: '80–99% Mature Tree', value: 90 },
    { label: '100% Full-Grown', value: 100 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Summary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`rounded-2xl p-5 border ${
            isDark
              ? 'bg-[#1B231D] border-[#2C382F]'
              : 'bg-[#FBF9F5] border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-65 mb-1">
            <span>Today&apos;s Focus Time</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="font-display text-2xl font-semibold font-mono-tabular">
            {formatFocusMinutes(todayStats.focusMinutes)}
          </div>
          <p className="text-xs opacity-65 mt-1">
            Sessions completed today:{' '}
            <span className="font-mono-tabular font-semibold">
              {todayStats.sessionsCompleted}
            </span>
          </p>
        </div>

        <div
          className={`rounded-2xl p-5 border ${
            isDark
              ? 'bg-[#1B231D] border-[#2C382F]'
              : 'bg-[#FBF9F5] border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-65 mb-1">
            <span>All-Time Focus Sanctuary</span>
            <Sprout className="w-4 h-4" />
          </div>
          <div className="font-display text-2xl font-semibold font-mono-tabular">
            {store.gardenTrees.length}{' '}
            {store.gardenTrees.length === 1 ? 'Tree' : 'Trees'}
          </div>
          <p className="text-xs opacity-65 mt-1">
            Total focus time:{' '}
            <span className="font-mono-tabular font-semibold">
              {formatFocusMinutes(store.totalFocusMinutes)}
            </span>
          </p>
        </div>

        <div
          className={`rounded-2xl p-5 border ${
            isDark
              ? 'bg-[#1B231D] border-[#2C382F]'
              : 'bg-[#FBF9F5] border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-65 mb-1">
            <span>Garden Tier</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="font-display text-xl font-semibold">
            {store.gardenTrees.length >= 10
              ? 'Botanical Sanctuary (10+)'
              : store.gardenTrees.length >= 5
                ? 'Small Focus Garden (5+)'
                : store.gardenTrees.length >= 2
                  ? 'Growing Plot (2+)'
                  : store.gardenTrees.length === 1
                    ? 'First Seedling (1)'
                    : 'Fresh Soil (0)'}
          </div>
          <p className="text-xs opacity-65 mt-1">
            {getGardenMilestoneDescription(store.gardenTrees.length)}
          </p>
        </div>
      </div>

      {/* Main Garden Plot Visualization */}
      <div
        className={`rounded-3xl p-6 border ${
          isDark
            ? 'bg-[#1B231D] border-[#2C382F]'
            : 'bg-[#FBF9F5] border-[#E5DFD3]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-xl font-semibold">
              🌱 Your Focus Garden
            </h2>
            <p className="text-sm opacity-70 mt-0.5">
              Every completed focus session plants a new tree in your local Chrome storage garden.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const speciesList: TreeSpecies[] = ['oak', 'olive', 'cypress', 'maple', 'birch'];
                const sp = speciesList[store.gardenTrees.length % speciesList.length];
                onPlantDemoTree(store.settings.focusDurationMinutes, 'Completed Study Session', sp);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-[#2A382E] hover:bg-[#344539] text-[#D8E6DC]'
                  : 'bg-[#E9EFEA] hover:bg-[#DCE7DF] text-[#2F4F3A]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Log Completed Session (+{store.settings.focusDurationMinutes}m)
            </button>
            {store.gardenTrees.length > 0 && onClearGarden && (
              <button
                type="button"
                onClick={onClearGarden}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs opacity-65 hover:opacity-100 transition-opacity whitespace-nowrap"
                title="Reset garden stats"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Terrarium / Garden Landscape */}
        {store.gardenTrees.length === 0 ? (
          <div
            className={`rounded-2xl p-10 text-center border border-dashed ${
              isDark
                ? 'bg-[#151C17] border-[#2E3C32] text-[#9BA89E]'
                : 'bg-[#F4F0E6] border-[#D8D0C1] text-[#666E68]'
            }`}
          >
            <p className="font-display text-lg mb-1">Your garden plot is ready for its first seed</p>
            <p className="text-xs max-w-md mx-auto opacity-80">
              Start a focus timer or click &ldquo;Log Completed Session&rdquo; above to see how your garden evolves across 1, 2, 5, and 10+ completed sessions.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl p-6 transition-colors ${
              isDark ? 'bg-[#141B16]' : 'bg-[#F3EFE6]'
            }`}
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4 items-end">
              {store.gardenTrees.map((tree, idx) => {
                const isSelected = selectedTree?.id === tree.id;
                return (
                  <button
                    key={tree.id}
                    type="button"
                    onClick={() => setSelectedTree(isSelected ? null : tree)}
                    className={`group flex flex-col items-center p-2 rounded-xl transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-[#253329] ring-1 ring-[#6C9676]'
                          : 'bg-[#E5ECE6] ring-1 ring-[#4A6B53]'
                        : 'hover:bg-current/5'
                    }`}
                  >
                    <MiniGardenTree
                      species={tree.species}
                      darkMode={isDark}
                      durationMinutes={tree.durationMinutes}
                    />
                    <span className="font-mono-tabular text-[11px] opacity-75 mt-1">
                      {tree.durationMinutes}m
                    </span>
                    <span className="text-[10px] opacity-50">
                      #{store.gardenTrees.length - idx}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedTree && (
              <div
                className={`mt-4 pt-3 border-t border-current/10 flex flex-wrap items-center justify-between gap-2 text-xs`}
              >
                <div>
                  <span className="font-semibold capitalize">{selectedTree.species} tree</span>
                  <span className="mx-2 opacity-40">·</span>
                  <span>{selectedTree.label}</span>
                </div>
                <div className="font-mono-tabular opacity-75">
                  {selectedTree.durationMinutes} min focus · {selectedTree.dateKey} ·{' '}
                  {new Date(selectedTree.completedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Botanical Growth Stage Explorer (0% -> 100%) */}
      <div
        className={`rounded-3xl p-6 border ${
          isDark
            ? 'bg-[#1B231D] border-[#2C382F]'
            : 'bg-[#FBF9F5] border-[#E5DFD3]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0 flex flex-col items-center">
            <BotanicalTree
              progressPercent={inspectorProgress}
              mode="focus"
              darkMode={isDark}
              size="regular"
            />
            <span className="font-mono-tabular text-xs font-medium mt-2">
              {inspectorProgress}% focused · {stageInfo.label}
            </span>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <h3 className="font-display text-lg font-semibold">
                Botanical Growth Cycle Inspector (0% – 100%)
              </h3>
              <p className="text-xs opacity-70 mt-0.5">
                Preview how the tree smoothly evolves across the 6 growth thresholds during a focus session.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  Stage: {stageInfo.label} ({stageInfo.rangeLabel})
                </span>
                <span className="opacity-70">{stageInfo.description}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={inspectorProgress}
                onChange={(e) => setInspectorProgress(Number(e.target.value))}
                aria-label="Inspect tree growth percentage"
                className="w-full accent-[#3F624D] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stagePresets.map((preset) => {
                const active =
                  getTreeGrowthStage(preset.value).id === stageInfo.id;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setInspectorProgress(preset.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors whitespace-nowrap truncate ${
                      active
                        ? isDark
                          ? 'bg-[#4E7559] text-white'
                          : 'bg-[#3F624D] text-[#FBF9F5]'
                        : isDark
                          ? 'bg-[#242F27] text-[#C4CEC6] hover:bg-[#2E3B31]'
                          : 'bg-[#EFECE4] text-[#454B46] hover:bg-[#E5E0D5]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
