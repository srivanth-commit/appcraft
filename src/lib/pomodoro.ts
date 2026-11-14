export type Phase = 'work' | 'short_break' | 'long_break';

export const CONFIG = {
  WORK: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
  LONG_BREAK_EVERY: 4,
} as const;

export function durationFor(phase: Phase): number {
  switch (phase) {
    case 'work':
      return CONFIG.WORK;
    case 'short_break':
      return CONFIG.SHORT_BREAK;
    case 'long_break':
      return CONFIG.LONG_BREAK;
  }
}

export function nextPhase(phase: Phase, completedWorkInCycle: number): Phase {
  if (phase === 'work') {
    return completedWorkInCycle >= CONFIG.LONG_BREAK_EVERY ? 'long_break' : 'short_break';
  }
  return 'work';
}

export function isWork(phase: Phase): boolean {
  return phase === 'work';
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}