import { computeStreak, toDayKey } from './streak';
import { describe, it, expect } from 'vitest';

const DAY = 86_400_000;
const at = (offset: number) => Date.UTC(2026, 0, 15 + offset, 12, 0, 0);

describe('streak', () => {
  it('computes zero streak for empty history', () => {
    expect(computeStreak([])).toEqual({ current: 0, longest: 0 });
  });

  it('counts consecutive days ending today', () => {
    const ts = [at(0), at(-1), at(-2)];
    expect(computeStreak(ts, at(0))).toEqual({ current: 3, longest: 3 });
  });

  it('counts current streak from yesterday when today has no session yet', () => {
    const ts = [at(-1), at(-2), at(-3)];
    expect(computeStreak(ts, at(0))).toEqual({ current: 3, longest: 3 });
  });

  it('tracks longest streak separate from current after a gap', () => {
    const now = at(0);
    const ts = [now, now - DAY, now - 5 * DAY, now - 6 * DAY, now - 7 * DAY];
    const res = computeStreak(ts, now);
    expect(res.current).toBe(2);
    expect(res.longest).toBe(3);
  });

  it('deduplicates multiple sessions in one day', () => {
    const base = at(0);
    expect(
      computeStreak([base, base + 1000, base - DAY, base - DAY + 5000], base),
    ).toEqual({ current: 2, longest: 2 });
  });

  it('formats day keys to YYYY-MM-DD', () => {
    expect(toDayKey(at(0))).toBe('2026-01-15');
  });
});