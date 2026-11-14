import { CONFIG, durationFor, nextPhase, formatTime, isWork } from './pomodoro';
import { describe, it, expect } from 'vitest';

describe('pomodoro', () => {
  it('formats time with leading zeros', () => {
    expect(formatTime(25 * 60)).toBe('25:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(0)).toBe('00:00');
  });

  it('returns configured durations per phase', () => {
    expect(durationFor('work')).toBe(CONFIG.WORK);
    expect(durationFor('short_break')).toBe(CONFIG.SHORT_BREAK);
    expect(durationFor('long_break')).toBe(CONFIG.LONG_BREAK);
  });

  it('maps work to long break after four sessions', () => {
    expect(nextPhase('work', 4)).toBe('long_break');
    expect(nextPhase('work', 1)).toBe('short_break');
    expect(nextPhase('work', 3)).toBe('short_break');
  });

  it('always returns to work from a break', () => {
    expect(nextPhase('short_break', 0)).toBe('work');
    expect(nextPhase('long_break', 0)).toBe('work');
  });

  it('classifies work vs break', () => {
    expect(isWork('work')).toBe(true);
    expect(isWork('short_break')).toBe(false);
    expect(isWork('long_break')).toBe(false);
  });
});