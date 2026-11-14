import type { FocusSession, Task } from '../db/types';
import { computeStreak, toDayKey } from './streak';

export interface HeatmapCell {
  date: string;
  minutes: number;
}

export interface WeeklyPoint {
  week: string;
  hours: number;
}

export interface TaskBreakdown {
  task_id: string | null;
  task_name: string;
  minutes: number;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  minutes: number;
}

export interface DailyPoint {
  day: string;
  label: string;
  minutes: number;
}

function dayStart(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

export function buildHeatmap(sessions: FocusSession[], weeks = 12, now = Date.now()): HeatmapCell[] {
  const start = dayStart(now) - (weeks * 7 - 1) * 86_400_000;
  const map = new Map<string, number>();
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start + i * 86_400_000);
    map.set(toDayKey(d.getTime()), 0);
  }
  for (const s of sessions) {
    const key = toDayKey(s.completed_at);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + s.duration_minutes);
    }
  }
  return [...map.entries()].map(([date, minutes]) => ({ date, minutes }));
}

export function buildWeekly(sessions: FocusSession[]): WeeklyPoint[] {
  const weeks = new Map<string, number>();
  for (const s of sessions) {
    const key = isoWeekKey(new Date(s.completed_at));
    weeks.set(key, (weeks.get(key) ?? 0) + s.duration_minutes / 60);
  }
  return [...weeks.entries()].map(([week, hours]) => ({ week, hours }));
}

export function buildMonthly(sessions: FocusSession[], months = 6, now = Date.now()): MonthlyPoint[] {
  const current = new Date(now);
  const keys = Array.from({ length: months }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - (months - index - 1), 1);
    return { key: monthKey(date), label: date.toLocaleDateString(undefined, { month: 'short' }) };
  });
  const totals = new Map(keys.map(({ key }) => [key, 0]));
  for (const session of sessions) {
    const key = monthKey(new Date(session.completed_at));
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + session.duration_minutes);
  }
  return keys.map(({ key, label }) => ({ month: key, label, minutes: totals.get(key) ?? 0 }));
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isoWeekKey(d: Date): string {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function buildTaskBreakdown(sessions: FocusSession[], tasks: Task[]): TaskBreakdown[] {
  const byTask = new Map<string | null, number>();
  for (const s of sessions) {
    byTask.set(s.task_id, (byTask.get(s.task_id) ?? 0) + s.duration_minutes);
  }
  const nameOf = (id: string | null) =>
    id ? tasks.find((t) => t.id === id)?.title ?? 'Deleted task' : 'Unassigned';
  return [...byTask.entries()]
    .map(([task_id, minutes]) => ({ task_id, task_name: nameOf(task_id), minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function totalFocusMinutes(sessions: FocusSession[], now = Date.now()): number {
  return sessions
    .filter((s) => dayStart(s.completed_at) === dayStart(now))
    .reduce((sum, s) => sum + s.duration_minutes, 0);
}

export function buildDaily(sessions: FocusSession[], days = 7, now = Date.now()): DailyPoint[] {
  const today = new Date(now);
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDayKey(d.getTime());
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const minutes = sessions
      .filter((s) => toDayKey(s.completed_at) === key)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    points.push({ day: key, label, minutes });
  }
  return points;
}

export interface LifetimeStats {
  totalMinutes: number;
  totalSessions: number;
  activeDays: number;
  bestDay: { day: string; minutes: number } | null;
  bestMonth: { month: string; minutes: number } | null;
  avgPerActiveDay: number;
}

export function buildLifetimeStats(sessions: FocusSession[]): LifetimeStats {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const byDay = new Map<string, number>();
  const byMonth = new Map<string, number>();
  for (const s of sessions) {
    const day = toDayKey(s.completed_at);
    byDay.set(day, (byDay.get(day) ?? 0) + s.duration_minutes);
    const month = monthKey(new Date(s.completed_at));
    byMonth.set(month, (byMonth.get(month) ?? 0) + s.duration_minutes);
  }

  let bestDay: LifetimeStats['bestDay'] = null;
  let bestMonth: LifetimeStats['bestMonth'] = null;
  for (const [day, minutes] of byDay) {
    if (!bestDay || minutes > bestDay.minutes) bestDay = { day, minutes };
  }
  for (const [month, minutes] of byMonth) {
    if (!bestMonth || minutes > bestMonth.minutes) bestMonth = { month, minutes };
  }

  return {
    totalMinutes,
    totalSessions: sessions.length,
    activeDays: byDay.size,
    bestDay,
    bestMonth,
    avgPerActiveDay: byDay.size > 0 ? Math.round(totalMinutes / byDay.size) : 0,
  };
}

export interface DayDetail {
  day: string;
  label: string;
  minutes: number;
  sessions: number;
}

export function buildMonthDetail(sessions: FocusSession[], month: string): DayDetail[] {
  const byDay = new Map<string, { minutes: number; sessions: number }>();
  for (const s of sessions) {
    if (monthKey(new Date(s.completed_at)) !== month) continue;
    const day = toDayKey(s.completed_at);
    const current = byDay.get(day) ?? { minutes: 0, sessions: 0 };
    byDay.set(day, { minutes: current.minutes + s.duration_minutes, sessions: current.sessions + 1 });
  }
  return [...byDay.entries()]
    .map(([day, v]) => ({
      day,
      label: new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      minutes: v.minutes,
      sessions: v.sessions,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function badgesForStreak(days: number): { name: string; description: string }[] {
  const thresholds: { name: string; description: string; need: number }[] = [
    { name: 'First Spark', description: 'Complete 1 day of focus', need: 1 },
    { name: '3-Day Streak', description: 'Focus 3 days in a row', need: 3 },
    { name: '7-Day Streak', description: 'Focus 7 days in a row', need: 7 },
    { name: '14-Day Streak', description: 'Focus 14 days in a row', need: 14 },
    { name: '30-Day Streak', description: 'Focus 30 days in a row', need: 30 },
    { name: '60-Day Streak', description: 'Focus 60 days in a row', need: 60 },
    { name: '90-Day Streak', description: 'Focus 90 days in a row', need: 90 },
  ];
  return thresholds.filter((t) => t.need <= days).map(({ name, description }) => ({ name, description }));
}

export function syncBadges(longest: number): { name: string; description: string }[] {
  return badgesForStreak(longest);
}

export function allBadgeDefinitions(): { name: string; description: string }[] {
  return badgesForStreak(90);
}

export { computeStreak };