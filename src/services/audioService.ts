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
        // Deep, aggressive system shock alarm - stronger and more persistent
        this.createTone(110, now, 0.8, 'sawtooth', 0.4); // Sub-bass growl
        this.createTone(220, now, 0.6, 'sawtooth', 0.3); // Aggressive low
        this.createTone(880, now, 0.1, 'square', 0.3);   // High alert pulse 1
        this.createTone(880, now + 0.2, 0.1, 'square', 0.3); // High alert pulse 2
        this.createTone(440, now + 0.1, 0.4, 'sawtooth', 0.25); // Mid-tier drone
        this.createTone(1100, now + 0.4, 0.2, 'square', 0.3); // Final piercing tone
      } else if (priority === 'HIGH' || priority === 'MEDIUM') {
        // Technical "ping" - less aggressive
        this.createTone(587.33, now, 0.15, 'sine', 0.15); // D5
        this.createTone(783.99, now + 0.08, 0.2, 'sine', 0.1); // G5
      } else {
        // Subtle "bloop" or "normal" sound for common updates
        this.createTone(440, now, 0.08, 'sine', 0.08); // A4
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
