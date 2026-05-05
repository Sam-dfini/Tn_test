/**
 * audioService.ts
 * High-tech sound synthesis for system notifications.
 * Uses Web Audio API to avoid external assets.
 */

class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play a notification sound based on severity
   */
  public playNotification(priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      if (priority === 'CRITICAL') {
        // Deep, aggressive system shock alarm
        this.createTone(220, now, 0.4, 'sawtooth', 0.3); // Low rumbly base
        this.createTone(880, now, 0.15, 'square', 0.25);
        this.createTone(440, now + 0.15, 0.15, 'square', 0.25);
        this.createTone(880, now + 0.3, 0.2, 'square', 0.25);
      } else if (priority === 'HIGH' || priority === 'MEDIUM') {
        // Technical "ping" or "alert"
        this.createTone(660, now, 0.1, 'sine', 0.2);
        this.createTone(880, now + 0.05, 0.15, 'sine', 0.15);
      } else {
        // Subtle "bloop" for low priority
        this.createTone(440, now, 0.05, 'sine', 0.1);
      }
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  private createTone(freq: number, start: number, duration: number, type: OscillatorType, volume: number = 0.2) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    
    // Smooth envelope
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  }
}

export const audioService = new AudioService();
