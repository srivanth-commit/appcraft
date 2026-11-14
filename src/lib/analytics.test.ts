import {
  buildHeatmap,
  buildWeekly,
  buildMonthly,
  buildTaskBreakdown,
  totalFocusMinutes,
  badgesForStreak,
  allBadgeDefinitions,
  buildLifetimeStats,
  buildMonthDetail,
} from './analytics';
import type { FocusSession, Task } from '../db/types';
import { describe, it, expect } from 'vitest';

const MIN = 60_000;
const at = (dayOffset: number, hour = 12) => {
  const base = Date.UTC(2026, 5, 14);
  return base + dayOffset * 86_400_000 + hour * 3_600_000;
};

function sess(id: string, completedAt: number, minutes: number, task_id: string | null = null): FocusSession {
  return { id, task_id, completed_at: completedAt, started_at: completedAt - minutes * MIN, duration_minutes: minutes };
}

const task: Task = { id: 't1', title: 'Ship ZenTime', created_at: 0, updated_at: 0, completed: false, focus_count: 1 };

describe('analytics', () => {
  it('builds a heatmap with zero-filled cells for the window', () => {
    const cells = buildHeatmap([sess('s1', at(0), 25), sess('s2', at(-3), 50)], 1, at(0));
    expect(cells).toHaveLength(7);
    expect(cells.find((c) => c.date.includes('-14'))?.minutes).toBe(25);
    expect(cells.every((c) => c.minutes >= 0)).toBe(true);
  });

  it('ignores sessions outside the heatmap window', () => {
    const cells = buildHeatmap([sess('s1', at(-30), 25)], 1, at(0));
    expect(cells.every((c) => c.minutes === 0)).toBe(true);
  });

  it('aggregates weekly hours', () => {
    const weeks = buildWeekly([sess('s1', at(0), 60), sess('s2', at(0), 60), sess('s3', at(-1), 60)]);
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks[0].hours).toBe(3);
  });

  it('builds a zero-filled monthly focus view', () => {
    const months = buildMonthly([sess('s1', at(0), 90)], 2, at(0));
    expect(months).toHaveLength(2);
    expect(months[1].minutes).toBe(90);
    expect(months[0].minutes).toBe(0);
  });

  it('breaks down minutes by task with names', () => {
    const breakdown = buildTaskBreakdown([sess('s1', at(0), 25, 't1'), sess('s2', at(0), 50, null)], [task]);
    expect(breakdown[0]).toEqual({ task_id: null, task_name: 'Unassigned', minutes: 50 });
    expect(breakdown[1]).toEqual({ task_id: 't1', task_name: 'Ship ZenTime', minutes: 25 });
  });

  it('sums today focus minutes only', () => {
    expect(totalFocusMinutes([sess('s1', at(0), 25), sess('s2', at(-2), 50)], at(0))).toBe(25);
  });

  it('defines badges at thresholds', () => {
    expect(allBadgeDefinitions().map((b) => b.name)).toContain('7-Day Streak');
    expect(allBadgeDefinitions().map((b) => b.name)).toContain('90-Day Streak');
  });

  it('unlocks badges up to the current streak', () => {
    const unlocked = badgesForStreak(7).map((b) => b.name);
    expect(unlocked).toContain('3-Day Streak');
    expect(unlocked).toContain('7-Day Streak');
    expect(unlocked).not.toContain('14-Day Streak');
  });
});

describe('lifetime stats', () => {
  it('aggregates totals, active days, and best day/month', () => {
    const stats = buildLifetimeStats([
      sess('s1', at(0), 25),
      sess('s2', at(0), 25),
      sess('s3', at(-1), 60),
      sess('s4', at(-40), 120),
    ]);
    expect(stats.totalMinutes).toBe(230);
    expect(stats.totalSessions).toBe(4);
    expect(stats.activeDays).toBe(3);
    expect(stats.bestDay?.minutes).toBe(120);
    expect(stats.bestMonth?.minutes).toBe(120);
  });

  it('returns null best summaries when there is no data', () => {
    const stats = buildLifetimeStats([]);
    expect(stats.totalMinutes).toBe(0);
    expect(stats.bestDay).toBeNull();
    expect(stats.bestMonth).toBeNull();
    expect(stats.avgPerActiveDay).toBe(0);
  });
});

describe('month detail', () => {
  it('groups sessions by day within the month', () => {
    const month = '2026-06';
    const detail = buildMonthDetail(
      [sess('s1', at(0), 25), sess('s2', at(0), 25), sess('s3', at(-1), 60)],
      month,
    );
    expect(detail.length).toBe(2);
    const big = detail.find((d) => d.minutes === 60);
    expect(big?.sessions).toBe(1);
    const today = detail.find((d) => d.minutes === 50);
    expect(today?.sessions).toBe(2);
  });

  it('returns empty for months without data', () => {
    expect(buildMonthDetail([sess('s1', at(0), 25)], '1999-01')).toEqual([]);
  });
});