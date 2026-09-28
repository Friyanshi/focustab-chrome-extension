import React, { useState } from 'react';
import {
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FocusTabSettings, FocusTabStore } from '../types/focustab';
import {
  formatCountdown,
  getTreeGrowthStage,
} from '../utils/storage';
import { BotanicalTree } from './BotanicalTree';
import { CompactPopupGarden } from './FocusGardenView';
import { SettingsDrawer } from './SettingsDrawer';

interface ExtensionPopupProps {
  store: FocusTabStore;
  remainingMs: number;
  continuousPercent: number;
  displayPercent: number;
  onStartFocus: (focusMins: number, breakMins: number) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onEndSession: () => void;
  onSkipBreak: () => void;
  onStartNextFocus: () => void;
  onUpdateSettings: (settings: FocusTabSettings) => void;
  onFastCompleteStep?: () => void;
  onOpenFullGarden?: () => void;
  isStandalonePopupFrame?: boolean;
}

const FOCUS_PRESETS = [25, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({
  store,
  remainingMs,
  continuousPercent,
  displayPercent,
  onStartFocus,
  onPause,
  onResume,
  onReset,
  onEndSession,
  onSkipBreak,
  onStartNextFocus,
  onUpdateSettings,
  onFastCompleteStep,
  onOpenFullGarden,
  isStandalonePopupFrame = false,
}) => {
  const { settings, timer } = store;
  const isDark = settings.theme === 'dark';

  // Local state for setup screen custom inputs
  const [selectedFocus, setSelectedFocus] = useState<number>(settings.focusDurationMinutes);
  const [selectedBreak, setSelectedBreak] = useState<number>(settings.breakDurationMinutes);
  const [showCustomFocusInput, setShowCustomFocusInput] = useState<boolean>(
    !FOCUS_PRESETS.includes(settings.focusDurationMinutes)
  );
  const [showCustomBreakInput, setShowCustomBreakInput] = useState<boolean>(
    !BREAK_PRESETS.includes(settings.breakDurationMinutes)
  );
  const [customFocusStr, setCustomFocusStr] = useState<string>(
    String(settings.focusDurationMinutes)
  );
  const [customBreakStr, setCustomBreakStr] = useState<string>(
    String(settings.breakDurationMinutes)
  );

  // Confirmation modal for "End Session"
  const [confirmEndOpen, setConfirmEndOpen] = useState<boolean>(false);
  // Settings drawer
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const stageInfo = getTreeGrowthStage(continuousPercent);

  const handleSelectFocusPreset = (mins: number) => {
    setSelectedFocus(mins);
    setCustomFocusStr(String(mins));
    setShowCustomFocusInput(false);
    onUpdateSettings({ ...settings, focusDurationMinutes: mins });
  };

  const handleSelectBreakPreset = (mins: number) => {
    setSelectedBreak(mins);
    setCustomBreakStr(String(mins));
    setShowCustomBreakInput(false);
    onUpdateSettings({ ...settings, breakDurationMinutes: mins });
  };

  const handleCustomFocusInput = (val: string) => {
    setCustomFocusStr(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num) && num > 0 && num <= 240) {
      setSelectedFocus(num);
      onUpdateSettings({ ...settings, focusDurationMinutes: num });
    }
  };

  const handleCustomBreakInput = (val: string) => {
    setCustomBreakStr(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num) && num > 0 && num <= 120) {
      setSelectedBreak(num);
      onUpdateSettings({ ...settings, breakDurationMinutes: num });
    }
  };

  const handleBeginFocus = () => {
    const fMins = selectedFocus > 0 ? selectedFocus : settings.focusDurationMinutes;
    const bMins = selectedBreak > 0 ? selectedBreak : settings.breakDurationMinutes;
    onStartFocus(fMins, bMins);
  };

  const isFocusMode =
    timer.status === 'focus_running' || timer.status === 'focus_paused';
  const isBreakMode =
    timer.status === 'break_running' || timer.status === 'break_paused';
  const isBreakComplete = timer.status === 'break_complete';
  const isSetup = timer.status === 'setup';

  return (
    <div
      className={`relative flex flex-col justify-between overflow-y-auto overflow-x-hidden transition-colors duration-200 ${
        isStandalonePopupFrame
          ? 'w-[400px] min-h-[600px] max-h-[640px] rounded-[28px] shadow-xl border'
          : 'w-full min-h-[600px]'
      } ${
        isDark
          ? 'bg-[#161D18] text-[#EAE6DF] border-[#28352C]'
          : 'bg-[#FBF9F5] text-[#262A27] border-[#E4DECFE8]'
      }`}
    >
      {/* Popup Header Bar */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isFocusMode
                ? 'bg-[#4A7859]'
                : isBreakMode
                  ? 'bg-[#B5895A]'
                  : 'bg-[#8FA696]'
            }`}
          />
          <span className="font-display font-semibold text-base tracking-tight">
            FocusTab
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
            }
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl opacity-70 hover:opacity-100 hover:bg-current/5 transition-all"
            title={settings.soundEnabled ? 'Sound On (Click to mute)' : 'Sound Off (Click to unmute)'}
            aria-label={settings.soundEnabled ? 'Mute alarm sound' : 'Unmute alarm sound'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-60" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl opacity-75 hover:opacity-100 hover:bg-current/5 transition-all"
            title="Settings"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col justify-between px-5 pb-4 pt-1 gap-3">
        {/* ============================================================
            1. FIRST SCREEN / SETUP
        ============================================================ */}
        {isSetup && (
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="space-y-4">
              <div className="text-center pt-1">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  Ready to focus?
                </h1>
                <p className="text-xs opacity-70 mt-1">
                  Customize your study rhythm. Your tree grows while you focus.
                </p>
              </div>

              {/* Question 1: How long do you want to focus? */}
              <div
                className={`rounded-2xl p-3.5 border ${
                  isDark
                    ? 'bg-[#1D2620] border-[#2C3930]'
                    : 'bg-[#F4F0E8] border-[#E6DFD1]'
                }`}
              >
                <label className="block text-xs font-medium mb-2.5">
                  How long do you want to focus?
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {FOCUS_PRESETS.map((mins) => {
                    const active =
                      !showCustomFocusInput && settings.focusDurationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSelectFocusPreset(mins)}
                        className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                          active
                            ? isDark
                              ? 'bg-[#4E7559] text-white shadow-xs'
                              : 'bg-[#3F624D] text-[#FBF9F5] shadow-xs'
                            : isDark
                              ? 'bg-[#151C17] text-[#C8C3B8] hover:bg-[#242F27]'
                              : 'bg-[#FBF9F5] text-[#454A46] hover:bg-[#EAE4D7]'
                        }`}
                      >
                        {mins} min
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomFocusInput(true)}
                    className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      showCustomFocusInput
                        ? isDark
                          ? 'bg-[#4E7559] text-white shadow-xs'
                          : 'bg-[#3F624D] text-[#FBF9F5] shadow-xs'
                        : isDark
                          ? 'bg-[#151C17] text-[#C8C3B8] hover:bg-[#242F27]'
                          : 'bg-[#FBF9F5] text-[#454A46] hover:bg-[#EAE4D7]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    Custom
                  </button>
                </div>

                {showCustomFocusInput && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-current/10">
                    <span className="text-xs opacity-75">Custom focus (minutes):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={240}
                        value={customFocusStr}
                        onChange={(e) => handleCustomFocusInput(e.target.value)}
                        className={`w-20 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-mono-tabular text-center border focus:outline-none ${
                          isDark
                            ? 'bg-[#141A16] border-[#35463A] text-white'
                            : 'bg-white border-[#D6CFC2] text-[#262A27]'
                        }`}
                      />
                      <span className="text-xs opacity-65">min</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Question 2: How long should your break be? */}
              <div
                className={`rounded-2xl p-3.5 border ${
                  isDark
                    ? 'bg-[#1D2620] border-[#2C3930]'
                    : 'bg-[#F4F0E8] border-[#E6DFD1]'
                }`}
              >
                <label className="block text-xs font-medium mb-2.5">
                  How long should your break be?
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BREAK_PRESETS.map((mins) => {
                    const active =
                      !showCustomBreakInput && settings.breakDurationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSelectBreakPreset(mins)}
                        className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                          active
                            ? isDark
                              ? 'bg-[#4E7559] text-white shadow-xs'
                              : 'bg-[#3F624D] text-[#FBF9F5] shadow-xs'
                            : isDark
                              ? 'bg-[#151C17] text-[#C8C3B8] hover:bg-[#242F27]'
                              : 'bg-[#FBF9F5] text-[#454A46] hover:bg-[#EAE4D7]'
                        }`}
                      >
                        {mins} min
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomBreakInput(true)}
                    className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      showCustomBreakInput
                        ? isDark
                          ? 'bg-[#4E7559] text-white shadow-xs'
                          : 'bg-[#3F624D] text-[#FBF9F5] shadow-xs'
                        : isDark
                          ? 'bg-[#151C17] text-[#C8C3B8] hover:bg-[#242F27]'
                          : 'bg-[#FBF9F5] text-[#454A46] hover:bg-[#EAE4D7]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    Custom
                  </button>
                </div>

                {showCustomBreakInput && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-current/10">
                    <span className="text-xs opacity-75">Custom break (minutes):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={customBreakStr}
                        onChange={(e) => handleCustomBreakInput(e.target.value)}
                        className={`w-20 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-mono-tabular text-center border focus:outline-none ${
                          isDark
                            ? 'bg-[#141A16] border-[#35463A] text-white'
                            : 'bg-white border-[#D6CFC2] text-[#262A27]'
                        }`}
                      />
                      <span className="text-xs opacity-65">min</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary CTA: Start Focus */}
              <button
                type="button"
                onClick={handleBeginFocus}
                className={`w-full min-h-[48px] py-3 px-5 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] whitespace-nowrap ${
                  isDark
                    ? 'bg-[#4E7559] hover:bg-[#5A8566] text-white'
                    : 'bg-[#3F624D] hover:bg-[#345240] text-[#FBF9F5]'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Focus
              </button>
            </div>

            {/* Daily Progress & Focus Garden */}
            <div className="mt-3">
              <CompactPopupGarden store={store} onOpenFullGarden={onOpenFullGarden} />
            </div>
          </div>
        )}

        {/* ============================================================
            2. MAIN FOCUS SCREEN
        ============================================================ */}
        {isFocusMode && (
          <div className="flex-1 flex flex-col justify-between items-center text-center">
            {/* Top Mode Label & Timer */}
            <div className="w-full pt-0.5">
              <div className="text-[11px] font-semibold tracking-[0.14em] opacity-65 mb-0.5">
                FOCUS MODE
              </div>
              <div
                className="font-mono-tabular text-5xl font-semibold tracking-tight leading-none my-1"
                aria-live="polite"
              >
                {formatCountdown(remainingMs)}
              </div>
              <p className="text-xs opacity-75">
                {timer.status === 'focus_paused'
                  ? 'Session paused. Resume when you are ready.'
                  : 'Stay focused. Your tree is growing.'}
              </p>
            </div>

            {/* Center Growing Botanical Tree + Progress Indicator */}
            <div className="flex flex-col items-center my-0.5">
              <BotanicalTree
                progressPercent={continuousPercent}
                mode="focus"
                isPaused={timer.status === 'focus_paused'}
                darkMode={isDark}
                size="compact"
              />
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="font-mono-tabular font-semibold">
                  {displayPercent}% focused
                </span>
                <span aria-hidden="true" className="opacity-35">
                  ·
                </span>
                <span className="opacity-70">{stageInfo.label}</span>
              </div>
            </div>

            {/* Timer Controls: Pause, Resume, Reset, End Session */}
            <div className="w-full space-y-2">
              {!confirmEndOpen ? (
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={onPause}
                    disabled={timer.status === 'focus_paused'}
                    className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                      timer.status === 'focus_running'
                        ? isDark
                          ? 'bg-[#4E7559] text-white hover:bg-[#5A8566]'
                          : 'bg-[#3F624D] text-[#FBF9F5] hover:bg-[#345240]'
                        : 'opacity-40 cursor-not-allowed bg-current/5'
                    }`}
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </button>

                  <button
                    type="button"
                    onClick={onResume}
                    disabled={timer.status === 'focus_running'}
                    className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                      timer.status === 'focus_paused'
                        ? isDark
                          ? 'bg-[#4E7559] text-white hover:bg-[#5A8566]'
                          : 'bg-[#3F624D] text-[#FBF9F5] hover:bg-[#345240]'
                        : 'opacity-40 cursor-not-allowed bg-current/5'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>

                  <button
                    type="button"
                    onClick={onReset}
                    className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                      isDark
                        ? 'bg-[#232E26] hover:bg-[#2C3A30] text-[#D5DDD7]'
                        : 'bg-[#EFECE4] hover:bg-[#E4DFD3] text-[#3B403C]'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmEndOpen(true)}
                    className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                      isDark
                        ? 'bg-[#2C2422] hover:bg-[#3B2E2B] text-[#E6B8B0]'
                        : 'bg-[#F4EAE6] hover:bg-[#EADBD5] text-[#7D453B]'
                    }`}
                  >
                    <Square className="w-3 h-3" />
                    End Session
                  </button>
                </div>
              ) : (
                /* Confirmation prompt for End Session */
                <div
                  className={`rounded-2xl p-3 border text-left ${
                    isDark
                      ? 'bg-[#251E1D] border-[#42312E] text-[#F2DFDC]'
                      : 'bg-[#FAF0ED] border-[#E6CFC9] text-[#5E3129]'
                  }`}
                >
                  <p className="text-xs font-medium mb-2">
                    End current focus session? Your growing tree will be reset.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmEndOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-current/10 hover:bg-current/15 whitespace-nowrap"
                    >
                      Keep Focusing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmEndOpen(false);
                        onEndSession();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#9E473B] text-white hover:bg-[#873B30] whitespace-nowrap"
                    >
                      End Session
                    </button>
                  </div>
                </div>
              )}

              {onFastCompleteStep && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={onFastCompleteStep}
                    className="text-[11px] opacity-55 hover:opacity-95 underline transition-opacity whitespace-nowrap"
                    title="Simulate countdown reaching 00:00 for instant testing"
                  >
                    Simulate 00:00 completion
                  </button>
                </div>
              )}
            </div>

            {/* Compact Daily Progress & Focus Garden */}
            <div className="w-full mt-1">
              <CompactPopupGarden store={store} onOpenFullGarden={onOpenFullGarden} />
            </div>
          </div>
        )}

        {/* ============================================================
            4 & 5. FOCUS COMPLETION BANNER + BREAK MODE
        ============================================================ */}
        {isBreakMode && (
          <div className="flex-1 flex flex-col justify-between items-center text-center">
            {/* Focus Session Complete Notification Banner */}
            {timer.lastEventBanner?.type === 'focus_complete' && (
              <div
                className={`w-full rounded-2xl px-3.5 py-2.5 border text-left flex items-center justify-between ${
                  isDark
                    ? 'bg-[#213026] border-[#344D3C] text-[#DCEADF]'
                    : 'bg-[#EBF2EC] border-[#CFE0D2] text-[#24402D]'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">
                    {timer.lastEventBanner.title}
                  </div>
                  <div className="text-[11px] opacity-85">
                    {timer.lastEventBanner.subtitle}
                  </div>
                </div>
                <Sparkles className="w-4 h-4 shrink-0 opacity-75" />
              </div>
            )}

            {/* BREAK TIME Header & Countdown */}
            <div className="w-full pt-1">
              <div className="text-[11px] font-semibold tracking-[0.12em] opacity-75 mb-0.5">
                BREAK TIME ☕
              </div>
              <div
                className="font-mono-tabular text-5xl font-semibold tracking-tight leading-none my-1"
                aria-live="polite"
              >
                {formatCountdown(remainingMs)}
              </div>
              <p className="text-xs opacity-75">
                Take a break. You earned it.
              </p>
            </div>

            {/* Relaxed version of the tree/plant */}
            <div className="my-0.5">
              <BotanicalTree
                progressPercent={100}
                mode="break"
                isPaused={timer.status === 'break_paused'}
                darkMode={isDark}
                size="compact"
              />
            </div>

            {/* Break Controls: Pause, Resume, Skip Break */}
            <div className="w-full space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={onPause}
                  disabled={timer.status === 'break_paused'}
                  className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                    timer.status === 'break_running'
                      ? isDark
                        ? 'bg-[#8C6D4F] text-white hover:bg-[#9C7B5B]'
                        : 'bg-[#7C5E46] text-[#FBF9F5] hover:bg-[#694E39]'
                      : 'opacity-40 cursor-not-allowed bg-current/5'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>

                <button
                  type="button"
                  onClick={onResume}
                  disabled={timer.status === 'break_running'}
                  className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                    timer.status === 'break_paused'
                      ? isDark
                        ? 'bg-[#8C6D4F] text-white hover:bg-[#9C7B5B]'
                        : 'bg-[#7C5E46] text-[#FBF9F5] hover:bg-[#694E39]'
                      : 'opacity-40 cursor-not-allowed bg-current/5'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>

                <button
                  type="button"
                  onClick={onSkipBreak}
                  className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    isDark
                      ? 'bg-[#253028] hover:bg-[#2F3D33] text-[#D8E2DA]'
                      : 'bg-[#EFECE4] hover:bg-[#E4DFD3] text-[#353B37]'
                  }`}
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Skip Break
                </button>
              </div>

              {onFastCompleteStep && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={onFastCompleteStep}
                    className="text-[11px] opacity-55 hover:opacity-95 underline transition-opacity whitespace-nowrap"
                  >
                    Simulate break 00:00 completion
                  </button>
                </div>
              )}
            </div>

            {/* Compact Daily Progress & Focus Garden */}
            <div className="w-full mt-1">
              <CompactPopupGarden store={store} onOpenFullGarden={onOpenFullGarden} />
            </div>
          </div>
        )}

        {/* ============================================================
            6. BREAK COMPLETION SCREEN
        ============================================================ */}
        {isBreakComplete && (
          <div className="flex-1 flex flex-col justify-between items-center text-center py-2">
            <div className="w-full space-y-1.5 pt-2">
              <div className="inline-block text-xs font-medium opacity-70">
                SESSION CYCLE READY
              </div>
              <h2 className="font-display text-2xl font-semibold">
                Break&apos;s over 🌿
              </h2>
              <p className="text-sm opacity-80">
                Ready for another focus session?
              </p>
            </div>

            <div className="my-1">
              <BotanicalTree
                progressPercent={100}
                mode="break_complete"
                darkMode={isDark}
                size="compact"
              />
              <p className="text-xs opacity-65 mt-1 font-mono-tabular">
                Next session: {settings.focusDurationMinutes} min focus ·{' '}
                {settings.breakDurationMinutes} min break
              </p>
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={onStartNextFocus}
                className={`w-full min-h-[48px] py-3 px-5 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] whitespace-nowrap ${
                  isDark
                    ? 'bg-[#4E7559] hover:bg-[#5A8566] text-white'
                    : 'bg-[#3F624D] hover:bg-[#345240] text-[#FBF9F5]'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Next Focus
              </button>

              <button
                type="button"
                onClick={onEndSession}
                className="w-full py-1.5 text-xs opacity-65 hover:opacity-100 underline transition-opacity whitespace-nowrap"
              >
                Change focus or break duration
              </button>
            </div>

            <div className="w-full mt-2">
              <CompactPopupGarden store={store} onOpenFullGarden={onOpenFullGarden} />
            </div>
          </div>
        )}
      </main>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onReopenSetupScreen={onEndSession}
      />
    </div>
  );
};
