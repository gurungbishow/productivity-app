// Web Audio API sound synthesizer for Pomodoro completion chimes & ambient focus audio
// Runs client-side with 0 external sound files or asset downloads required.

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private currentAmbientType: 'none' | 'rain' | 'brown' = 'none';

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a resonant Tibetan meditation bell / singing bowl chime.
   */
  public playChime(volume: number = 0.8): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Frequencies resembling a singing bowl with golden ratio overtones
    const frequencies = [528, 1056, 1584, 2112];
    const gains = [0.6, 0.25, 0.12, 0.05];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle warm pitch vibrato
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(5, now);
      vibratoGain.gain.setValueAtTime(1.5, now);
      vibrato.connect(osc.frequency);
      vibrato.start(now);
      vibrato.stop(now + 4.5);

      // Exponential decay envelope
      const baseGain = gains[idx] * volume;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(baseGain, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(baseGain * 0.4, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.5);
    });
  }

  /**
   * Starts ambient focus noise (Brown noise or gentle rain wash)
   */
  public startAmbient(type: 'rain' | 'brown', volume: number = 0.3): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stopAmbient();

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        // Brown noise filter (integrated white noise)
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // boost gain
      } else {
        // Rain approximation (filtered pink/white noise with soft waves)
        const b0 = 0.99 * lastOut + white * 0.05;
        lastOut = b0;
        data[i] = b0 * 2.0;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter node for softer, non-fatiguing focus frequency
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'brown' ? 350 : 800, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();

    this.ambientSource = noise;
    this.ambientGain = gainNode;
    this.isAmbientPlaying = true;
    this.currentAmbientType = type;
  }

  public setAmbientVolume(volume: number): void {
    if (this.ambientGain && this.audioCtx) {
      this.ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx.currentTime);
    }
  }

  public stopAmbient(): void {
    if (this.ambientSource) {
      try {
        (this.ambientSource as AudioScheduledSourceNode).stop();
      } catch {
        // Ignored if already stopped
      }
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }
    this.isAmbientPlaying = false;
    this.currentAmbientType = 'none';
  }

  public isPlaying(): boolean {
    return this.isAmbientPlaying;
  }

  public getCurrentType(): 'none' | 'rain' | 'brown' {
    return this.currentAmbientType;
  }
}

export const soundEngine = new SoundEngine();
