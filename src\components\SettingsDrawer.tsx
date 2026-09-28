import React, { useState } from 'react';
import { Bell, Check, Moon, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { FocusTabSettings } from '../types/focustab';
import {
  playBreakCompleteSound,
  playFocusCompleteSound,
  requestNotificationPermission,
} from '../utils/notifications';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FocusTabSettings;
  onUpdateSettings: (newSettings: FocusTabSettings) => void;
  onReopenSetupScreen: () => void;
}

const FOCUS_PRESETS = [25, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReopenSetupScreen,
}) => {
  const [customFocus, setCustomFocus] = useState<string>(String(settings.focusDurationMinutes));
  const [customBreak, setCustomBreak] = useState<string>(String(settings.breakDurationMinutes));
  const [notifStatus, setNotifStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';

  const handleFocusPreset = (mins: number) => {
    setCustomFocus(String(mins));
    onUpdateSettings({ ...settings, focusDurationMinutes: mins });
  };

  const handleBreakPreset = (mins: number) => {
    setCustomBreak(String(mins));
    onUpdateSettings({ ...settings, breakDurationMinutes: mins });
  };

  const handleCustomFocusChange = (val: string) => {
    setCustomFocus(val);
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 240) {
      onUpdateSettings({ ...settings, focusDurationMinutes: parsed });
    }
  };

  const handleCustomBreakChange = (val: string) => {
    setCustomBreak(val);
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 120) {
      onUpdateSettings({ ...settings, breakDurationMinutes: parsed });
    }
  };

  const handleRequestNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifStatus(res);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-[2px] transition-opacity duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="FocusTab Settings"
    >
      <div
        className={`w-full max-h-[92%] overflow-y-auto rounded-t-3xl p-5 transition-colors duration-150 ${
          isDark
            ? 'bg-[#1C241E] text-[#EAE6DF] border-t border-[#2E3B31]'
            : 'bg-[#FBF9F5] text-[#262A27] border-t border-[#E6E0D5]'
        }`}
      >
        {/* Top bar with grab handle and close */}
        <div className="w-10 h-1 rounded-full mx-auto mb-3 opacity-30 bg-current" />
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/10">
          <div>
            <h2 className="font-display text-lg font-semibold">Settings</h2>
            <p className="text-xs opacity-65">Saved automatically to Chrome storage</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-current/10 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Focus Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Focus duration</label>
              <span className="font-mono-tabular text-xs opacity-70">
                {settings.focusDurationMinutes} min
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {FOCUS_PRESETS.map((mins) => {
                const active = settings.focusDurationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleFocusPreset(mins)}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? isDark
                          ? 'bg-[#4E7559] text-white'
                          : 'bg-[#3F624D] text-[#FBF9F5]'
                        : isDark
                          ? 'bg-[#263028] text-[#C8C3B8] hover:bg-[#2F3B32]'
                          : 'bg-[#EFECE4] text-[#4A4F4B] hover:bg-[#E5E0D5]'
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customFocus}
                  onChange={(e) => handleCustomFocusChange(e.target.value)}
                  aria-label="Custom focus minutes"
                  className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-mono-tabular text-center border focus:outline-none ${
                    isDark
                      ? 'bg-[#151C17] border-[#344438] text-[#EAE6DF] focus:border-[#6C9676]'
                      : 'bg-white border-[#DCD5C7] text-[#262A27] focus:border-[#3F624D]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Break duration</label>
              <span className="font-mono-tabular text-xs opacity-70">
                {settings.breakDurationMinutes} min
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {BREAK_PRESETS.map((mins) => {
                const active = settings.breakDurationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleBreakPreset(mins)}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? isDark
                          ? 'bg-[#4E7559] text-white'
                          : 'bg-[#3F624D] text-[#FBF9F5]'
                        : isDark
                          ? 'bg-[#263028] text-[#C8C3B8] hover:bg-[#2F3B32]'
                          : 'bg-[#EFECE4] text-[#4A4F4B] hover:bg-[#E5E0D5]'
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={customBreak}
                  onChange={(e) => handleCustomBreakChange(e.target.value)}
                  aria-label="Custom break minutes"
                  className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-mono-tabular text-center border focus:outline-none ${
                    isDark
                      ? 'bg-[#151C17] border-[#344438] text-[#EAE6DF] focus:border-[#6C9676]'
                      : 'bg-white border-[#DCD5C7] text-[#262A27] focus:border-[#3F624D]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Theme Toggle: Light / Dark */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-xs opacity-65">Soft natural cream or deep forest charcoal</p>
            </div>
            <div
              className={`flex items-center p-1 rounded-xl ${
                isDark ? 'bg-[#141A16]' : 'bg-[#ECE7DD]'
              }`}
            >
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  settings.theme === 'light'
                    ? 'bg-[#FBF9F5] text-[#262A27] shadow-xs'
                    : 'opacity-65 hover:opacity-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  settings.theme === 'dark'
                    ? 'bg-[#28332B] text-[#F2EFE9] shadow-xs'
                    : 'opacity-65 hover:opacity-100'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
            </div>
          </div>

          {/* Sound Toggle + Test Chimes */}
          <div className="pt-2 border-t border-current/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 opacity-75" />
                ) : (
                  <VolumeX className="w-4 h-4 opacity-50" />
                )}
                <div>
                  <p className="font-medium">Alarm & notification sound</p>
                  <p className="text-xs opacity-65">Acoustic chimes when sessions finish</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() =>
                  onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  settings.soundEnabled
                    ? isDark
                      ? 'bg-[#568063] justify-end'
                      : 'bg-[#3F624D] justify-end'
                    : isDark
                      ? 'bg-[#2C372F] justify-start'
                      : 'bg-[#D6CFC2] justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playFocusCompleteSound(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isDark
                      ? 'bg-[#263028] hover:bg-[#303D33] text-[#D2DDD4]'
                      : 'bg-[#EFECE4] hover:bg-[#E4DFD3] text-[#3B423D]'
                  }`}
                >
                  Preview Focus Chime
                </button>
                <button
                  type="button"
                  onClick={() => playBreakCompleteSound(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isDark
                      ? 'bg-[#263028] hover:bg-[#303D33] text-[#D2DDD4]'
                      : 'bg-[#EFECE4] hover:bg-[#E4DFD3] text-[#3B423D]'
                  }`}
                >
                  Preview Break Chime
                </button>
              </div>
            )}
          </div>

          {/* Auto-start break */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <p className="font-medium">Auto-start break</p>
              <p className="text-xs opacity-65">Automatically begin break when focus ends</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoStartBreak}
              onClick={() =>
                onUpdateSettings({ ...settings, autoStartBreak: !settings.autoStartBreak })
              }
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                settings.autoStartBreak
                  ? isDark
                    ? 'bg-[#568063] justify-end'
                    : 'bg-[#3F624D] justify-end'
                  : isDark
                    ? 'bg-[#2C372F] justify-start'
                    : 'bg-[#D6CFC2] justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
            </button>
          </div>

          {/* Auto-start next focus session */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <p className="font-medium">Auto-start next focus session</p>
              <p className="text-xs opacity-65">Immediately start focus when break ends</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoStartNextFocus}
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  autoStartNextFocus: !settings.autoStartNextFocus,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                settings.autoStartNextFocus
                  ? isDark
                    ? 'bg-[#568063] justify-end'
                    : 'bg-[#3F624D] justify-end'
                  : isDark
                    ? 'bg-[#2C372F] justify-start'
                    : 'bg-[#D6CFC2] justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
            </button>
          </div>

          {/* Browser / Chrome Notification Permission */}
          {notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
            <div className="flex items-center justify-between pt-2 border-t border-current/10">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 opacity-70" />
                <span className="text-xs opacity-80">Desktop notifications</span>
              </div>
              <button
                type="button"
                onClick={handleRequestNotifications}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isDark
                    ? 'bg-[#2B382E] hover:bg-[#36473A] text-[#CFE0D3]'
                    : 'bg-[#E6EFE8] hover:bg-[#D8E6DB] text-[#2F523B]'
                }`}
              >
                Enable Notifications
              </button>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-current/10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onReopenSetupScreen();
              }}
              className="text-xs underline opacity-75 hover:opacity-100 py-2 whitespace-nowrap"
            >
              Open Setup Screen
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-[#4E7559] text-white hover:bg-[#5B8567]'
                  : 'bg-[#3F624D] text-[#FBF9F5] hover:bg-[#345240]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
