import { Flame, Trophy } from 'lucide-react';
import type { Badge } from '../../db/types';

interface StreakPanelProps {
  current: number;
  longest: number;
  badges: Badge[];
}

export function StreakPanel({ current, longest, badges }: StreakPanelProps) {
  return (
    <section className="card flex flex-col gap-4 p-4" aria-label="Streak and achievements">
      <div className="flex gap-4">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-elevate/50 p-3">
          <Flame size={24} className="text-orange-500" />
          <div>
            <p className="text-2xl font-bold leading-none">{current}</p>
            <p className="mt-1 text-xs text-muted">day streak</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-elevate/50 p-3">
          <Trophy size={24} className="text-amber-400" />
          <div>
            <p className="text-2xl font-bold leading-none">{longest}</p>
            <p className="mt-1 text-xs text-muted">best streak</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted">Badges</h3>
        <ul className="flex flex-wrap gap-2">
          {badges.length === 0 ? (
            <li className="text-xs text-muted">Keep focusing to earn badges.</li>
          ) : (
            badges.map((badge) => (
              <li
                key={badge.id}
                title={badge.description}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  badge.unlocked ? 'bg-primary/15 text-primary' : 'bg-elevate/60 text-muted'
                }`}
              >
                {badge.unlocked ? '● ' : '○ '}
                {badge.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}