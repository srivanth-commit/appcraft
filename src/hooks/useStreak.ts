import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import type { Badge, StreakState } from '../db/types';
import { computeStreak } from '../lib/streak';
import { allBadgeDefinitions, syncBadges } from '../lib/analytics';

export function useStreak() {
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);

  const refresh = useCallback(async () => {
    const [sessions, stored] = await Promise.all([db.getSessions(), db.getBadges()]);
    const result = computeStreak(sessions.map((s) => s.completed_at));

    setCurrent(result.current);
    setLongest(result.longest);

    const now = Date.now();
    const longestState: StreakState = { key: 'longest', days: result.longest, updated_at: now };
    const currentState: StreakState = { key: 'current', days: result.current, updated_at: now };
    await Promise.all([db.putStreak(longestState), db.putStreak(currentState)]);

    const notUnlocked = allBadgeDefinitions().filter(
      (b) => !stored.some((s) => s.name === b.name && s.unlocked),
    );
    const newlyUnlocked = syncBadges(result.longest).filter((b) =>
      notUnlocked.some((n) => n.name === b.name),
    );

    for (const b of newlyUnlocked) {
      await db.putBadge({ id: crypto.randomUUID(), ...b, unlocked: true, unlocked_at: Date.now() });
    }

    const fresh = await db.getBadges();
    setBadges(fresh.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { current, longest, badges, refresh };
}
