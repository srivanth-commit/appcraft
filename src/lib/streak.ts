export interface StreakResult {
  current: number;
  longest: number;
}

export function toDayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getUTCDayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
}

export function computeStreak(timestamps: number[], now = Date.now()): StreakResult {
  const daySet = new Set<number>();
  for (const ts of timestamps) {
    daySet.add(getUTCDayNumber(new Date(ts)));
  }
  const days = [...daySet].sort((a, b) => b - a);

  let longest = 0;
  let current = 0;
  let run = 0;
  let prev = -1;

  for (const day of days) {
    if (prev !== -1 && prev - day === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = day;
  }

  const today = getUTCDayNumber(new Date(now));
  if (daySet.has(today)) {
    let d = today;
    while (daySet.has(d)) {
      current += 1;
      d -= 1;
    }
  } else if (daySet.has(today - 1)) {
    let d = today - 1;
    while (daySet.has(d)) {
      current += 1;
      d -= 1;
    }
  }

  return { current, longest };
}