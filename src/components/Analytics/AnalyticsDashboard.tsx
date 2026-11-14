import { BarChart3, CalendarDays, Clock, Layers } from 'lucide-react';
import type { AnalyticsState } from '../../hooks/useAnalytics';
import { Heatmap } from './Heatmap';
import { WeeklyChart } from './WeeklyChart';
import { TaskBreakdown } from './TaskBreakdown';

interface AnalyticsProps {
  data: AnalyticsState & { setSelectedMonth: (month: string) => void };
}

export function AnalyticsDashboard({ data }: AnalyticsProps) {
  return (
    <section className="card flex flex-col gap-6 p-4" aria-label="Analytics dashboard">
      <div className="flex items-center gap-2">
        <BarChart3 size={18} className="text-primary" />
        <h2 className="text-lg font-semibold">Analytics</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Clock size={16} />} label="Focused today" value={`${data.todayMinutes}m`} />
        <Stat icon={<Layers size={16} />} label="Sessions" value={String(data.totalSessions)} />
        <Stat
          icon={<BarChart3 size={16} />}
          label="Focus this week"
          value={`${formatHours(data.weekly[data.weekly.length - 1]?.hours ?? 0)}h`}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted">12-Week Heatmap</h3>
        <Heatmap data={data.heatmap} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted">Weekly Focus Hours</h3>
        <WeeklyChart data={data.weekly} />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-muted">Monthly focus</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {data.monthly.map((month) => {
            const active = month.month === data.selectedMonth;
            const max = Math.max(...data.monthly.map((item) => item.minutes), 1);
            return (
              <button key={month.month} type="button" className={`month-column ${active ? 'month-column-active' : ''}`} onClick={() => data.setSelectedMonth(month.month)}>
                <span className="month-value">{month.minutes ? `${Math.round(month.minutes / 60)}h` : '—'}</span>
                <span className="month-bar-track"><span className="month-bar" style={{ height: `${Math.max(6, (month.minutes / max) * 100)}%` }} /></span>
                <span>{month.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted"><strong className="text-text">{data.selectedMonthMinutes} minutes</strong> logged in {formatMonth(data.selectedMonth)}</p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted">Time by Task</h3>
        <TaskBreakdown data={data.breakdown} />
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-elevate/50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function formatHours(h: number): string {
  return (Math.round(h * 10) / 10).toFixed(1);
}

function formatMonth(value: string): string {
  if (!value) return 'this month';
  return new Date(`${value}-01T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}