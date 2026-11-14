import { CONFIG, durationFor, nextPhase, formatTime, isWork, type Phase } from './pomodoro';
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

  it('runs four work sessions then resets the cycle after the long break', () => {
    let workCount = 0;
    let phase: Phase = 'work';
    for (let i = 0; i < CONFIG.LONG_BREAK_EVERY; i++) {
      workCount += 1;
      phase = nextPhase('work', workCount);
    }
    expect(workCount).toBe(CONFIG.LONG_BREAK_EVERY);
    expect(phase).toBe('long_break');

    workCount = 0;
    phase = 'work';
    workCount += 1;
    expect(nextPhase('work', workCount)).toBe('short_break');
  });
});