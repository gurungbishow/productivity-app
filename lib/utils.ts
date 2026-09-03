import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function playTimerEndSound() {
  if (typeof window === 'undefined') return;
  
  try {
    // @ts-expect-error - webkitAudioContext is non-standard but required for older Safari
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Helper to play a single "bell" note
    const playBell = (freq: number, startTime: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      // A mixture of sine and triangle waves can make a nice bell tone, but sine is safest for a clean chime
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      // Fast attack, slow exponential decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 1.5);
    };

    const now = audioCtx.currentTime;
    
    // Play a pleasant, uplifting D Major arpeggio chime
    playBell(587.33, now);         // D5
    playBell(739.99, now + 0.12);  // F#5
    playBell(880.00, now + 0.24);  // A5
    playBell(1174.66, now + 0.36); // D6
    
  } catch (e) {
    console.log('Audio playback failed', e);
  }
}
