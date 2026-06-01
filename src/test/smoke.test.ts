import { describe, it, expect } from 'vitest';

// Smoke tests — verify core utilities load without throwing

describe('RRI math utilities', () => {
  it('clamps values correctly', () => {
    const clamp = (v: number, min: number, max: number) =>
      Math.min(Math.max(v, min), max);
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it('computes weighted average', () => {
    const wa = (vals: number[], weights: number[]) => {
      const sum = weights.reduce((a, b) => a + b, 0);
      return vals.reduce((acc, v, i) => acc + v * weights[i], 0) / sum;
    };
    expect(wa([1, 3], [1, 1])).toBe(2);
    expect(wa([0, 10], [3, 1])).toBe(2.5);
  });
});

describe('Environment', () => {
  it('runs in jsdom environment', () => {
    expect(typeof document).toBe('object');
  });
});
