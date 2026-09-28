/**
 * FocusTab — Chrome Extension Manifest V3 Background Service Worker
 *
 * Handles:
 * 1. Reliable timestamp-based alarms via chrome.alarms so sessions complete on time
 *    even when the extension popup is closed.
 * 2. Native Chrome notifications on Focus and Break completion.
 * 3. Updating the extension toolbar badge with remaining minutes.
 * 4. Persisting completed sessions and newly grown trees to chrome.storage.local.
 */

const STORAGE_KEY = 'focustab_state_v1';
const ALARM_END = 'focustab_session_end';
const ALARM_BADGE = 'focustab_badge_tick';

const TREE_SPECIES = ['oak', 'olive', 'cypress', 'maple', 'birch'];

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getStoredData() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || null);
    });
  });
}

async function saveStoredData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      resolve();
    });
  });
}

async function syncAlarmsAndBadge(data) {
  if (!data || !data.timer) {
    await chrome.alarms.clearAll();
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const { status, endTime, remainingMs } = data.timer;
  const now = Date.now();

  if ((status === 'focus_running' || status === 'break_running') && endTime) {
    const msLeft = Math.max(0, endTime - now);
    if (msLeft > 0) {
      await chrome.alarms.create(ALARM_END, { when: endTime });
      await chrome.alarms.create(ALARM_BADGE, { periodInMinutes: 0.5 });

      const minsLeft = Math.max(1, Math.ceil(msLeft / 60000));
      chrome.action.setBadgeText({ text: `${minsLeft}m` });
      chrome.action.setBadgeBackgroundColor({
        color: status === 'focus_running' ? '#3F624D' : '#8C6D4F'
      });
    } else {
      await handleTimerExpired(data);
    }
  } else if (status === 'focus_paused' || status === 'break_paused') {
    await chrome.alarms.clear(ALARM_END);
    await chrome.alarms.clear(ALARM_BADGE);
    const minsLeft = Math.max(1, Math.ceil((remainingMs || 0) / 60000));
    chrome.action.setBadgeText({ text: `${minsLeft}m` });
    chrome.action.setBadgeBackgroundColor({ color: '#78716C' });
  } else {
    await chrome.alarms.clear(ALARM_END);
    await chrome.alarms.clear(ALARM_BADGE);
    chrome.action.setBadgeText({ text: '' });
  }
}

async function handleTimerExpired(data) {
  const { timer, settings, statsByDate, gardenTrees } = data;
  const now = Date.now();

  if (timer.status === 'focus_running') {
    const completedFocusMinutes = Math.max(1, Math.round(timer.totalDurationMs / 60000));
    const todayKey = getTodayDateKey();
    const currentDayStats = (statsByDate && statsByDate[todayKey]) || {
      focusMinutes: 0,
      sessionsCompleted: 0
    };

    const updatedStatsByDate = {
      ...(statsByDate || {}),
      [todayKey]: {
        focusMinutes: currentDayStats.focusMinutes + completedFocusMinutes,
        sessionsCompleted: currentDayStats.sessionsCompleted + 1
      }
    };

    const species = TREE_SPECIES[(gardenTrees ? gardenTrees.length : 0) % TREE_SPECIES.length];
    const newTree = {
      id: `tree_${now}`,
      completedAt: now,
      dateKey: todayKey,
      durationMinutes: completedFocusMinutes,
      species,
      label: timer.sessionLabel || 'Focused study session'
    };

    const updatedGarden = [newTree, ...(gardenTrees || [])];
    const breakDurationMs = (settings.breakDurationMinutes || 5) * 60 * 1000;
    const autoStartBreak = settings.autoStartBreak !== false;

    const nextTimer = {
      ...timer,
      status: autoStartBreak ? 'break_running' : 'break_paused',
      totalDurationMs: breakDurationMs,
      remainingMs: breakDurationMs,
      endTime: autoStartBreak ? now + breakDurationMs : null,
      startedAt: now,
      lastEventBanner: {
        type: 'focus_complete',
        title: 'Focus session complete 🌱',
        subtitle: 'You did it. Time for a break.',
        timestamp: now
      }
    };

    const updatedData = {
      ...data,
      timer: nextTimer,
      statsByDate: updatedStatsByDate,
      totalFocusMinutes: (data.totalFocusMinutes || 0) + completedFocusMinutes,
      totalSessionsCompleted: (data.totalSessionsCompleted || 0) + 1,
      gardenTrees: updatedGarden
    };

    await saveStoredData(updatedData);
    await syncAlarmsAndBadge(updatedData);

    chrome.notifications.create(`focus_done_${now}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Focus session complete 🌱',
      message: 'You did it. Time for a break.',
      priority: 2
    });
  } else if (timer.status === 'break_running') {
    const focusDurationMs = (settings.focusDurationMinutes || 25) * 60 * 1000;
    const autoStartNextFocus = Boolean(settings.autoStartNextFocus);

    const nextTimer = {
      ...timer,
      status: autoStartNextFocus ? 'focus_running' : 'break_complete',
      totalDurationMs: focusDurationMs,
      remainingMs: focusDurationMs,
      endTime: autoStartNextFocus ? now + focusDurationMs : null,
      startedAt: autoStartNextFocus ? now : null,
      lastEventBanner: {
        type: 'break_complete',
        title: "Break's over 🌿",
        subtitle: 'Ready for another focus session?',
        timestamp: now
      }
    };

    const updatedData = {
      ...data,
      timer: nextTimer
    };

    await saveStoredData(updatedData);
    await syncAlarmsAndBadge(updatedData);

    chrome.notifications.create(`break_done_${now}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: "Break's over 🌿",
      message: 'Ready for another focus session?',
      priority: 2
    });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const data = await getStoredData();
  if (!data) return;

  if (alarm.name === ALARM_END) {
    await handleTimerExpired(data);
  } else if (alarm.name === ALARM_BADGE) {
    await syncAlarmsAndBadge(data);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) {
    syncAlarmsAndBadge(changes[STORAGE_KEY].newValue);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await getStoredData();
  if (existing) {
    await syncAlarmsAndBadge(existing);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const existing = await getStoredData();
  if (existing) {
    await syncAlarmsAndBadge(existing);
  }
});
