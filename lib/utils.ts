import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PomodoroSoundType } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function triggerConfetti() {
  if (typeof window === 'undefined') return;
  import('canvas-confetti').then((confettiModule) => {
    const confetti = confettiModule.default;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10B981', '#6366F1', '#F59E0B', '#3B82F6'],
    });
  });
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      // @ts-expect-error - webkitAudioContext fallback for older Safari
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    console.error('AudioContext creation failed', e);
    return null;
  }
}

export function sendNotificationSafe(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg && typeof reg.showNotification === 'function') {
            reg.showNotification(title, options).catch(() => {
              tryFallbackNotification(title, options);
            });
          } else {
            tryFallbackNotification(title, options);
          }
        })
        .catch(() => {
          tryFallbackNotification(title, options);
        });
      return;
    }
  } catch {
    // Fall back to direct constructor
  }

  tryFallbackNotification(title, options);
}

function tryFallbackNotification(title: string, options?: NotificationOptions) {
  try {
    new Notification(title, options);
  } catch (e) {
    console.warn('Notification not permitted or blocked in this environment', e);
  }
}

export function playTimerEndSound(soundType: PomodoroSoundType = 'bell', volume: number = 0.8) {
  if (typeof window === 'undefined') return;

  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const masterGain = audioCtx.createGain();
    const effectiveVol = Math.max(0.01, Math.min(1, volume));
    masterGain.gain.setValueAtTime(effectiveVol, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (soundType === 'digital') {
      // 3 crisp futuristic digital alert beeps
      const playBeep = (freq: number, start: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.13);
      };

      playBeep(987.77, now);         // B5
      playBeep(1318.51, now + 0.14); // E6
      playBeep(1760.00, now + 0.28); // A6

    } else if (soundType === 'gong') {
      // Deep resonant meditative Tibetan singing bowl / gong
      const playResonance = (freq: number, gainMultiplier: number, decay: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3 * gainMultiplier, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + decay);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + decay);
      };

      playResonance(196.00, 1.0, 2.8); // G3 fundamental
      playResonance(392.00, 0.6, 2.2); // G4 octave harmonic
      playResonance(587.33, 0.4, 1.8); // D5 fifth harmonic

    } else if (soundType === 'marimba') {
      // Warm, playful woody acoustic marimba
      const playWood = (freq: number, start: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.46);
      };

      playWood(523.25, now);        // C5
      playWood(659.25, now + 0.11); // E5
      playWood(783.99, now + 0.22); // G5
      playWood(1046.50, now + 0.33); // C6

    } else {
      // Default: 'bell' - Uplifting D-Major Arpeggio chime
      const playBell = (freq: number, start: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + 1.4);
      };

      playBell(587.33, now);         // D5
      playBell(739.99, now + 0.12);  // F#5
      playBell(880.00, now + 0.24);  // A5
      playBell(1174.66, now + 0.36); // D6
    }
  } catch (e) {
    console.error('Audio playback failed', e);
  }
}
