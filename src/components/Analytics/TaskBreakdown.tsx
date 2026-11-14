import type { TaskBreakdown } from '../../lib/analytics';

interface TaskBreakdownProps {
  data: TaskBreakdown[];
}

function barWidth(minutes: number, max: number): string {
  if (max === 0) return '0%';
  return `${Math.max(4, Math.round((minutes / max) * 100))}%`;
}

export function TaskBreakdown({ data }: TaskBreakdownProps) {
  const max = Math.max(...data.map((d) => d.minutes), 0);
  return (
    <div className="flex flex-col gap-2">
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No focused time logged yet.</p>
      ) : (
        data.map((row) => (
          <div key={row.task_id ?? 'unassigned'}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="truncate text-text">{row.task_name}</span>
              <span className="ml-2 shrink-0 text-muted">{row.minutes} min</span>
            </div>
            <div className="h-2 w-full rounded-full bg-elevate/60">
              <div className="h-2 rounded-full bg-primary" style={{ width: barWidth(row.minutes, max) }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}