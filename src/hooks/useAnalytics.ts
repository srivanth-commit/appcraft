import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import type { FocusSession } from '../db/types';
import {
  buildHeatmap,
  buildTaskBreakdown,
  buildWeekly,
  totalFocusMinutes,
  type HeatmapCell,
  type TaskBreakdown,
  type WeeklyPoint,
  buildMonthly,
  type MonthlyPoint,
  buildDaily,
  type DailyPoint,
  buildLifetimeStats,
  type LifetimeStats,
  buildMonthDetail,
  type DayDetail,
} from '../lib/analytics';

export interface AnalyticsState {
  heatmap: HeatmapCell[];
  weekly: WeeklyPoint[];
  breakdown: TaskBreakdown[];
  todayMinutes: number;
  totalSessions: number;
  monthly: MonthlyPoint[];
  daily: DailyPoint[];
  selectedMonth: string;
  selectedMonthMinutes: number;
  monthRange: MonthRange;
  lifetime: LifetimeStats;
  monthDetail: DayDetail[];
  thisWeekMinutes: number;
}

export type MonthRange = 3 | 6 | 12;

const RANGE_KEY = 'zentimer.monthRange';

export function readMonthRange(): MonthRange {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(RANGE_KEY) : null;
  const n = Number(raw);
  return n === 3 || n === 6 || n === 12 ? (n as MonthRange) : 6;
}

const EMPTY: AnalyticsState = {
  heatmap: [],
  weekly: [],
  breakdown: [],
  todayMinutes: 0,
  totalSessions: 0,
  monthly: [],
  daily: [],
  selectedMonth: '',
  selectedMonthMinutes: 0,
  monthRange: 6,
  lifetime: {
    totalMinutes: 0,
    totalSessions: 0,
    activeDays: 0,
    bestDay: null,
    bestMonth: null,
    avgPerActiveDay: 0,
  },
  monthDetail: [],
  thisWeekMinutes: 0,
};

const WEEK_MS = 7 * 86_400_000;

export function useAnalytics() {
  const [state, setState] = useState<AnalyticsState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(localMonthKey);
  const [monthRange, setMonthRange] = useState<MonthRange>(readMonthRange);

  const reload = useCallback(async () => {
    const [sessions, tasks] = await Promise.all([db.getSessions(), db.getTasks()]);
    const weekAgo = localDayStart(Date.now()) - WEEK_MS + 86_400_000;
    const view: AnalyticsState = {
      heatmap: buildHeatmap(sessions),
      weekly: buildWeekly(sessions).slice(-12),
      breakdown: buildTaskBreakdown(sessions, tasks),
      todayMinutes: totalFocusMinutes(sessions),
      totalSessions: sessions.length,
      monthly: buildMonthly(sessions, monthRange),
      daily: buildDaily(sessions),
      selectedMonth,
      selectedMonthMinutes: sessions
        .filter((session) => localMonthKey(new Date(session.completed_at)) === selectedMonth)
        .reduce((sum, session) => sum + session.duration_minutes, 0),
      monthRange,
      lifetime: buildLifetimeStats(sessions),
      monthDetail: buildMonthDetail(sessions, selectedMonth),
      thisWeekMinutes: sessions
        .filter((s) => s.completed_at >= weekAgo)
        .reduce((sum, s) => sum + s.duration_minutes, 0),
    };
    setState(view);
    setLoading(false);
  }, [selectedMonth, monthRange]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setRange = useCallback((range: MonthRange) => {
    localStorage.setItem(RANGE_KEY, String(range));
    setMonthRange(range);
  }, []);

  return { ...state, loading, reload, setSelectedMonth, setRange };
}

export { FocusSession };

function localDayStart(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function localMonthKey(value: Date = new Date()): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}