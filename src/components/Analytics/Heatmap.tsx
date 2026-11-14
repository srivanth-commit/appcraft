import type { HeatmapCell } from '../../lib/analytics';

interface HeatmapProps {
  data: HeatmapCell[];
}

const DAY_LABELS = ['Mon', 'Wed', 'Fri'];

function opacityFor(minutes: number): string {
  if (minutes === 0) return 'bg-elevate/50';
  if (minutes < 25) return 'bg-primary/25';
  if (minutes < 50) return 'bg-primary/45';
  if (minutes < 90) return 'bg-primary/70';
  return 'bg-primary';
}

function dayInfo(cell: HeatmapCell): { date: string; minutes: number } {
  const d = new Date(`${cell.date}T00:00:00Z`);
  const date = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return { date, minutes: cell.minutes };
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short' });
}

export function Heatmap({ data }: HeatmapProps) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No focus logged yet.</p>;
  }

  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const months: { label: string; index: number }[] = [];
  let seen = new Set<string>();
  weeks.forEach((week, wi) => {
    const first = week.find((c) => c.minutes !== undefined);
    if (!first) return;
    const label = shortDate(first.date);
    if (!seen.has(label)) {
      seen.add(label);
      months.push({ label, index: wi });
    }
  });

  return (
    <div>
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        <div className="flex flex-col justify-between py-0.5 pr-2 text-[10px] text-muted-2">
          {DAY_LABELS.map((label) => (
            <span key={label} className="h-3 leading-3">{label}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex text-[10px] text-muted-2">
            {months.map((m) => (
              <span key={m.label} className="px-[2px]">{m.label}</span>
            ))}
            <span className="flex-1" />
          </div>
          <div className="grid grid-flow-col gap-1" style={{ gridAutoColumns: 'minmax(14px, 1fr)' }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((cell) => {
                  const info = dayInfo(cell);
                  return (
                    <div
                      key={cell.date}
                      role="img"
                      aria-label={`${info.date}: ${info.minutes} min focused`}
                      title={`${info.date} · ${info.minutes === 0 ? 'no focus' : `${formatMin(info.minutes)} focused`}`}
                      className={`h-3.5 w-full cursor-default rounded-[3px] transition-transform hover:scale-110 ${opacityFor(cell.minutes)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-muted-2">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] bg-elevate/50" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/25" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/45" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/70" />
        <span className="h-3 w-3 rounded-[3px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}

function formatMin(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}