import React, { useState } from 'react';
import {
  Bell,
  Check,
  Copy,
  Download,
  FileCode,
  FolderOpen,
  Puzzle,
  Terminal,
  Volume2,
} from 'lucide-react';
import { FocusTabStore } from '../types/focustab';
import {
  playBreakCompleteSound,
  playFocusCompleteSound,
  sendSessionNotification,
} from '../utils/notifications';

interface ExtensionGuideViewProps {
  store: FocusTabStore;
}

const MANIFEST_JSON_PREVIEW = `{
  "manifest_version": 3,
  "name": "FocusTab — Botanical Focus Timer",
  "short_name": "FocusTab",
  "version": "1.0.0",
  "description": "A calm, minimal productivity timer for students. Grow a botanical tree while staying focused and cultivate your daily focus garden.",
  "action": {
    "default_popup": "index.html",
    "default_title": "FocusTab — Open Focus Timer",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "permissions": ["storage", "alarms", "notifications"]
}`;

export const ExtensionGuideView: React.FC<ExtensionGuideViewProps> = ({ store }) => {
  const isDark = store.settings.theme === 'dark';
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'storage' | 'manifest'>('storage');

  const handleCopyExtensionsUrl = () => {
    navigator.clipboard.writeText('chrome://extensions').then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  return (
    <div className="space-y-8">
      {/* Direct Download & Quick-Start Banner */}
      <div
        className={`rounded-3xl p-6 border ${
          isDark
            ? 'bg-[#1B231D] border-[#2C382F]'
            : 'bg-[#FBF9F5] border-[#E5DFD3]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 mb-6 border-b border-current/10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-75 mb-1">
              <Puzzle className="w-3.5 h-3.5" />
              READY-TO-LOAD MANIFEST V3 PACKAGE
            </div>
            <h2 className="font-display text-2xl font-semibold">
              Install FocusTab in Google Chrome
            </h2>
            <p className="text-sm opacity-75 mt-1 leading-relaxed">
              We have pre-packaged the compiled extension (<code className="font-mono-tabular text-xs">manifest.json</code>, <code className="font-mono-tabular text-xs">background.js</code>, <code className="font-mono-tabular text-xs">icons/</code>, and the popup bundle) into a single <code className="font-mono-tabular text-xs">.zip</code> file so you can load it directly into Chrome in 30 seconds.
            </p>
          </div>

          <a
            href="/focustab-extension.zip"
            download="focustab-chrome-extension.zip"
            className={`shrink-0 min-h-[48px] px-5 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2.5 shadow-sm transition-all whitespace-nowrap ${
              isDark
                ? 'bg-[#4E7559] hover:bg-[#5B8667] text-white'
                : 'bg-[#3F624D] hover:bg-[#33513F] text-[#FBF9F5]'
            }`}
          >
            <Download className="w-4 h-4" />
            Download Extension (.zip)
          </a>
        </div>

        {/* 4 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className={`rounded-2xl p-4 border ${
              isDark
                ? 'bg-[#151C17] border-[#28332B]'
                : 'bg-[#F4F0E8] border-[#E5DFD2]'
            }`}
          >
            <div className="font-mono-tabular text-xs opacity-60 mb-1">STEP 1</div>
            <h3 className="font-semibold text-sm mb-1.5">Download &amp; Unzip</h3>
            <p className="text-xs opacity-75 leading-relaxed">
              Click <strong>Download Extension (.zip)</strong> above and extract (unzip) <code className="font-mono-tabular">focustab-chrome-extension.zip</code> into a folder on your computer.
            </p>
          </div>

          <div
            className={`rounded-2xl p-4 border ${
              isDark
                ? 'bg-[#151C17] border-[#28332B]'
                : 'bg-[#F4F0E8] border-[#E5DFD2]'
            }`}
          >
            <div className="font-mono-tabular text-xs opacity-60 mb-1">STEP 2</div>
            <h3 className="font-semibold text-sm mb-1.5">Open Chrome Extensions</h3>
            <p className="text-xs opacity-75 leading-relaxed mb-3">
              Copy the address below, paste it into Google Chrome&apos;s address bar, and press Enter:
            </p>
            <button
              type="button"
              onClick={handleCopyExtensionsUrl}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono-tabular transition-colors ${
                isDark
                  ? 'bg-[#222D25] hover:bg-[#2B392F] text-[#D8E6DC]'
                  : 'bg-[#E6ECE7] hover:bg-[#DAE4DC] text-[#2B4734]'
              }`}
            >
              <span>chrome://extensions</span>
              {copiedUrl ? (
                <span className="flex items-center gap-1 text-[11px] font-sans">
                  <Check className="w-3.5 h-3.5" /> Copied
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div
            className={`rounded-2xl p-4 border ${
              isDark
                ? 'bg-[#151C17] border-[#28332B]'
                : 'bg-[#F4F0E8] border-[#E5DFD2]'
            }`}
          >
            <div className="font-mono-tabular text-xs opacity-60 mb-1">STEP 3</div>
            <h3 className="font-semibold text-sm mb-1.5">Enable Developer Mode</h3>
            <p className="text-xs opacity-75 leading-relaxed">
              Turn ON the <strong>Developer mode</strong> toggle switch in the <strong>top-right corner</strong> of the <code className="font-mono-tabular">chrome://extensions</code> page.
            </p>
          </div>

          <div
            className={`rounded-2xl p-4 border ${
              isDark
                ? 'bg-[#151C17] border-[#28332B]'
                : 'bg-[#F4F0E8] border-[#E5DFD2]'
            }`}
          >
            <div className="font-mono-tabular text-xs opacity-60 mb-1">STEP 4</div>
            <h3 className="font-semibold text-sm mb-1.5">Click &ldquo;Load unpacked&rdquo;</h3>
            <p className="text-xs opacity-75 leading-relaxed">
              Click <strong>Load unpacked</strong> (top-left) and select the folder that directly contains <code className="font-mono-tabular">manifest.json</code>. Pin <strong>FocusTab</strong> in Chrome!
            </p>
          </div>
        </div>

        {/* Fixing "Manifest file is missing or unreadable" */}
        <div
          className={`mt-6 rounded-2xl p-4.5 border ${
            isDark
              ? 'bg-[#241E18] border-[#473626] text-[#F3E3D3]'
              : 'bg-[#FEF8F0] border-[#EBD6BE] text-[#4A321E]'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <h4 className="font-semibold text-sm">
                Seeing &ldquo;Manifest file is missing or unreadable&rdquo;? Here is the quick fix:
              </h4>
              <p className="opacity-85 leading-relaxed">
                When you unzip the downloaded file, Windows/macOS often creates a parent folder with an inner subfolder. When clicking <strong>&ldquo;Load unpacked&rdquo;</strong>, you must select the folder that has <code className="font-mono-tabular font-bold">manifest.json</code> directly inside it:
              </p>
              <div
                className={`p-3 rounded-xl font-mono-tabular text-[11px] leading-relaxed ${
                  isDark ? 'bg-[#15120E] text-[#D8C7B5]' : 'bg-[#F5ECE0] text-[#3D2918]'
                }`}
              >
                <div>❌ <strong>Wrong:</strong> Selecting Desktop/Focus Tab (if it contains another nested folder)</div>
                <div className="mt-1">✅ <strong>Correct:</strong> Double-click into the folder until you see:</div>
                <div className="pl-4 opacity-90">
                  ├── <strong>manifest.json</strong><br />
                  ├── <strong>background.js</strong><br />
                  ├── <strong>index.html</strong><br />
                  └── <strong>icons/</strong>
                </div>
                <div className="mt-1 font-sans opacity-90">Then click <strong>&ldquo;Select Folder&rdquo;</strong>!</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Alarm & Notification Diagnostics + Live Storage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware / Audio & Notification Verification */}
        <div
          className={`rounded-3xl p-6 border flex flex-col justify-between ${
            isDark
              ? 'bg-[#1B231D] border-[#2C382F]'
              : 'bg-[#FBF9F5] border-[#E5DFD3]'
          }`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold">
                Verify Alarms, Audio Chimes &amp; Notifications
              </h3>
              <p className="text-xs opacity-75 mt-1">
                Test the exact acoustic chimes and browser notifications triggered when Focus or Break sessions reach <code className="font-mono-tabular">00:00</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playFocusCompleteSound(true);
                  sendSessionNotification(
                    'Focus session complete 🌱',
                    'You did it. Time for a break.'
                  );
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isDark
                    ? 'bg-[#212E25] border-[#314537] hover:bg-[#28382D]'
                    : 'bg-[#EBF2EC] border-[#CFE0D2] hover:bg-[#E0ECE2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">Focus Complete Event</span>
                  <Volume2 className="w-4 h-4 opacity-75" />
                </div>
                <p className="text-xs opacity-80">
                  &ldquo;Focus session complete 🌱 — You did it. Time for a break.&rdquo;
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  playBreakCompleteSound(true);
                  sendSessionNotification(
                    "Break's over 🌿",
                    'Ready for another focus session?'
                  );
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isDark
                    ? 'bg-[#2A251F] border-[#42382E] hover:bg-[#342E26]'
                    : 'bg-[#F5EFE6] border-[#E3D6C3] hover:bg-[#EDE3D4]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">Break Complete Event</span>
                  <Bell className="w-4 h-4 opacity-75" />
                </div>
                <p className="text-xs opacity-80">
                  &ldquo;Break&apos;s over 🌿 — Ready for another focus session?&rdquo;
                </p>
              </button>
            </div>
          </div>

          <div
            className={`mt-6 rounded-2xl p-4 text-xs space-y-1.5 ${
              isDark ? 'bg-[#141A16]' : 'bg-[#F3EFE6]'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              Why FocusTab never loses time when the popup closes:
            </div>
            <p className="opacity-75 leading-relaxed">
              Instead of relying on an in-memory <code className="font-mono-tabular">setInterval</code> counter, FocusTab stores the exact target Unix timestamp (<code className="font-mono-tabular">endTime = Date.now() + remainingMs</code>) in <code className="font-mono-tabular">chrome.storage.local</code> and registers a <code className="font-mono-tabular">chrome.alarms</code> wake-up in <code className="font-mono-tabular">background.js</code>.
            </p>
          </div>
        </div>

        {/* Live chrome.storage.local State & Manifest Inspector */}
        <div
          className={`rounded-3xl p-6 border flex flex-col ${
            isDark
              ? 'bg-[#1B231D] border-[#2C382F]'
              : 'bg-[#FBF9F5] border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 opacity-70" />
              <h3 className="font-display text-base font-semibold">
                Extension State &amp; Manifest Inspector
              </h3>
            </div>

            <div
              className={`flex items-center p-1 rounded-xl text-xs ${
                isDark ? 'bg-[#141A16]' : 'bg-[#ECE7DD]'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveCodeTab('storage')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeCodeTab === 'storage'
                    ? isDark
                      ? 'bg-[#28332B] text-white'
                      : 'bg-[#FBF9F5] text-[#262A27] shadow-xs'
                    : 'opacity-65'
                }`}
              >
                chrome.storage.local
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('manifest')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                  activeCodeTab === 'manifest'
                    ? isDark
                      ? 'bg-[#28332B] text-white'
                      : 'bg-[#FBF9F5] text-[#262A27] shadow-xs'
                    : 'opacity-65'
                }`}
              >
                <FileCode className="w-3 h-3" />
                manifest.json
              </button>
            </div>
          </div>

          <pre
            className={`flex-1 rounded-2xl p-4 text-[11px] font-mono-tabular overflow-auto max-h-[260px] leading-relaxed ${
              isDark
                ? 'bg-[#121714] text-[#B9CBBF]'
                : 'bg-[#F3EFE6] text-[#2D3830]'
            }`}
          >
            {activeCodeTab === 'storage'
              ? JSON.stringify(store, null, 2)
              : MANIFEST_JSON_PREVIEW}
          </pre>
        </div>
      </div>
    </div>
  );
};
