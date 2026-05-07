
export type SoundType = 'critical' | 'warning' | 'info';

export const playNotificationSound = (type: SoundType = 'info') => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'critical':
      // Stronger, higher pitch, repeating
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      oscillator.start(now);
      oscillator.stop(now + 0.4);
      break;

    case 'warning':
      // Less aggressive, medium pitch
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;

    case 'info':
    default:
      // Normal, soft sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, now);
      
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      oscillator.start(now);
      oscillator.stop(now + 0.15);
      break;
  }
};
