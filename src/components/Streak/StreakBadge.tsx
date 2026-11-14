import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  current: number;
}

export function StreakBadge({ current }: StreakBadgeProps) {
  if (current === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-elevate/60 px-3 py-1.5 text-xs font-semibold">
      <Flame size={14} className="text-orange-400" />
      <span>{current} day streak</span>
    </div>
  );
}
