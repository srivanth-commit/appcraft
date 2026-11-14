import { useState } from 'react';
import { CalendarPlus, ChevronLeft, Clock, Flame, Layers, TrendingUp, Trophy } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalyticsState } from '../../hooks/useAnalytics';
import type { Badge, Task } from '../../db/types';
import { Heatmap } from './Heatmap';
import { TaskBreakdown } from './TaskBreakdown';
import { ManualSessionForm } from '../History/ManualSessionForm';

interface AnalyticsViewProps {
  data: AnalyticsState & { setSelectedMonth: (m: string) => void; setRange: (r: import('../../hooks/useAnalytics').MonthRange) => void };
  badges: Badge[];
  currentStreak: number;
  longestStreak: number;
  tasks: Task[];
  onRecordManualSession: (input: { taskId: string | null; startedAt: number; durationMinutes: number; note: string }) => Promise<void>;
}

const RANGES = [3, 6, 12] as const;

export function AnalyticsView({ data, badges, currentStreak, tasks, onRecordManualSession }: AnalyticsViewProps) {
  const [loggingPast, setLoggingPast] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);

  const focusedMinutes = Math.max(data.selectedMonthMinutes, monthMinutesFor(data, data.selectedMonth));

  return (
    <div className="mx-auto w-full max-w-3xl animate-in space-y-10 pb-24 lg:pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Insights</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Focus history</h1>
          <p className="mt-1 text-sm text-muted-2">
            {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · your time in focus
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setLoggingPast((v) => !v)}>
          <CalendarPlus size={16} />
          Log session
        </button>
      </header>

      {loggingPast && (
        <section className="card animate-in overflow-hidden" aria-label="Log a past focus session">
          <ManualSessionForm
            tasks={tasks}
            onSave={onRecordManualSession}
            onClose={() => setLoggingPast(false)}
          />
        </section>
      )}

      <section aria-label="Overview">
        <h2 className="mb-3 text-base font-semibold tracking-tight">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Clock size={16} />} label="Today" value={formatMinutes(data.todayMinutes)} />
          <StatCard icon={<TrendingUp size={16} />} label="This week" value={formatMinutes(data.thisWeekMinutes)} />
          <StatCard icon={<Layers size={16} />} label="Sessions" value={String(data.totalSessions)} />
          <StatCard icon={<Flame size={16} />} label="Streak" value={`${currentStreak}d`} accent="orange" />
        </div>
      </section>

      <section aria-label="Lifetime">
        <h2 className="mb-3 text-base font-semibold tracking-tight">Lifetime</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total focus" value={formatHours(data.lifetime.totalMinutes)} />
          <StatCard label="Active days" value={String(data.lifetime.activeDays)} />
          <StatCard label="Best day" value={data.lifetime.bestDay ? formatMinutes(data.lifetime.bestDay.minutes) : '—'} />
          <StatCard label="Avg / active day" value={formatMinutes(data.lifetime.avgPerActiveDay)} />
        </div>
      </section>

      <section className="card p-5" aria-label="Focus activity">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Focus activity</h2>
          <span className="text-xs text-muted-2">last 12 weeks</span>
        </div>
        <Heatmap data={data.heatmap} />
      </section>

      <section className="card p-5" aria-label="Weekly focus">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Weekly focus</h2>
          <span className="text-xs text-muted-2">hours</span>
        </div>
        <div className="h-52 w-full">
          {data.weekly.length === 0 || data.weekly.every((w) => w.hours === 0) ? (
            <p className="flex h-full items-center justify-center text-sm text-muted">No data yet — complete a session.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-muted-2)' }} tickLine={false} axisLine={false} tickFormatter={shortWeek} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-2)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}h`} width={36} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--color-elevate) / 0.5)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value}h`, 'Focus']}
                />
                <Bar dataKey="hours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section aria-label="Monthly focus">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">Monthly focus</h2>
          <div className="segmented-control" role="group" aria-label="Month range">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={`segment text-xs ${data.monthRange === r ? 'segment-active' : 'segment-inactive'}`}
                onClick={() => data.setRange(r)}
              >
                {r} mo
              </button>
            ))}
          </div>
        </div>

        {monthOpen && (
          <div className="card mb-4 animate-in overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-text"
                onClick={() => setMonthOpen(false)}
              >
                <ChevronLeft size={16} /> All months
              </button>
              <span className="text-sm font-medium text-text">
                {formatMonth(data.selectedMonth)} · {formatMinutes(focusedMinutes)}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto p-5">
              <MonthDetailList data={data} />
            </div>
          </div>
        )}

        <div className="card p-5">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {data.monthly.map((month) => {
              const active = month.month === data.selectedMonth && monthOpen;
              const max = Math.max(...data.monthly.map((item) => item.minutes), 1);
              return (
                <button
                  key={month.month}
                  type="button"
                  className={`month-column ${active ? 'month-column-active' : ''}`}
                  onClick={() => {
                    data.setSelectedMonth(month.month);
                    setMonthOpen(true);
                  }}
                  aria-pressed={active}
                >
                  <span className="month-value">{month.minutes ? formatShortHours(month.minutes) : '—'}</span>
                  <span className="month-bar-track">
                    <span className="month-bar" style={{ height: `${Math.max(6, (month.minutes / max) * 100)}%` }} />
                  </span>
                  <span>{month.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted">
            <strong className="text-text">{formatMinutes(focusedMinutes)}</strong> logged in {formatMonth(data.selectedMonth)}.
            {data.monthDetail.length > 0 && ` · ${data.monthDetail.length} active days`}
          </p>
        </div>
      </section>

      <section className="card p-5" aria-label="Time by task">
        <h2 className="mb-4 text-base font-semibold tracking-tight">Time by task</h2>
        <TaskBreakdown data={data.breakdown} />
      </section>

      {badges.length > 0 && (
        <section className="card p-5" aria-label="Achievements">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-muted" />
            <h2 className="text-base font-semibold tracking-tight">Achievements</h2>
          </div>
          <ul className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <li
                key={badge.id}
                title={badge.description}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  badge.unlocked ? 'bg-primary/12 text-primary' : 'bg-elevate/60 text-muted-2'
                }`}
              >
                {badge.unlocked ? '● ' : '○ '}
                {badge.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function MonthDetailList({ data }: { data: AnalyticsState & { setSelectedMonth: (m: string) => void } }) {
  if (data.monthDetail.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">No focus logged this month yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {data.monthDetail.map((d) => (
        <li
          key={d.day}
          className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-elevate/60"
        >
          <span className="font-medium text-text">{d.label}</span>
          <span className="text-xs text-muted">
            {d.sessions} {d.sessions === 1 ? 'session' : 'sessions'} · {formatMinutes(d.minutes)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function monthMinutesFor(data: AnalyticsState, month: string): number {
  return data.monthly.find((m) => m.month === month)?.minutes ?? 0;
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent?: 'orange';
}) {
  const iconColor = accent === 'orange' ? 'text-orange-400' : 'text-primary';
  return (
    <div className="stat-card">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon && <span className={iconColor}>{icon}</span>}
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

const tooltipStyle = {
  background: 'rgb(var(--color-surface))',
  border: '1px solid rgb(var(--color-border))',
  borderRadius: 10,
  color: 'rgb(var(--color-text))',
  fontSize: 12,
};

function shortWeek(iso: string): string {
  const [, week] = iso.split('-W');
  return `W${week ?? ''}`;
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

function formatHours(minutes: number): string {
  if (minutes === 0) return '0h';
  const h = (minutes / 60).toFixed(1);
  return `${h.replace(/\.0$/, '')}h`;
}

function formatShortHours(minutes: number): string {
  return `${Math.round(minutes / 60)}h`;
}

function formatMonth(value: string): string {
  const d = new Date(`${value}-01T12:00:00`);
  if (Number.isNaN(d.getTime())) return 'this month';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}