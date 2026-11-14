import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { WeeklyPoint } from '../../lib/analytics';

interface WeeklyChartProps {
  data: WeeklyPoint[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="h-48 w-full">
      {data.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted">No data yet — complete a session.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--color-elevate)' }}
              contentStyle={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                borderRadius: 12,
                color: 'var(--color-text)',
              }}
            />
            <Bar dataKey="hours" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}