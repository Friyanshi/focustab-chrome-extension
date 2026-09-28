import { isChromeExtensionEnv } from './storage';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Plays a warm, organic ascending botanical singing-bowl / marimba chord
 * when a Focus session completes (00:00).
 */
export function playFocusCompleteSound(soundEnabled = true): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C5, E5, G5, C6 warm major triad with octave
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.14;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, start);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.04, start);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + 1.4);

    osc.connect(gain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    overtone.start(start);
    osc.stop(start + 1.45);
    overtone.stop(start + 1.45);
  });
}

/**
 * Plays a distinct, gentle two-tone wooden reed chime
 * when a Break completes (00:00).
 */
export function playBreakCompleteSound(soundEnabled = true): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Distinct interval: D5 -> A5 -> F#5 gentle uplift
  const sequence = [
    { freq: 587.33, delay: 0, duration: 0.85 },
    { freq: 880.0, delay: 0.22, duration: 0.9 },
    { freq: 739.99, delay: 0.46, duration: 1.35 },
  ];

  sequence.forEach(({ freq, delay, duration }) => {
    const start = now + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.05);
  });
}

/**
 * Sends a native Chrome Extension notification or standard browser Notification.
 */
export function sendSessionNotification(title: string, body: string): void {
  if (isChromeExtensionEnv()) {
    const chromeObj = (window as unknown as { chrome: any }).chrome;
    if (chromeObj?.notifications?.create) {
      chromeObj.notifications.create(`focustab_${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title,
        message: body,
        priority: 2,
      });
      return;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icons/icon128.png',
        });
      } catch {
        // Ignore in restricted iframe contexts
      }
    }
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}
