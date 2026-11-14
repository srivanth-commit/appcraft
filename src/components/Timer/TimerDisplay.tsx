import { useEffect, useState } from 'react';
import type { Phase } from '../../lib/pomodoro';
import { durationFor, formatTime } from '../../lib/pomodoro';

interface TimerDisplayProps {
  phase: Phase;
  secondsLeft: number;
  running?: boolean;
  workCount: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  work: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

const PHASE_HINT: Record<Phase, string> = {
  work: 'Deep work',
  short_break: 'Rest · reset',
  long_break: 'Recover · recharge',
};

function phaseAccent(phase: Phase): string {
  switch (phase) {
    case 'work':
      return 'var(--color-primary)';
    case 'short_break':
      return 'var(--color-accent)';
    case 'long_break':
      return 'var(--color-accent-2)';
  }
}

export function TimerDisplay({ phase, secondsLeft, running, workCount }: TimerDisplayProps) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    setKey((k) => k + 1);
  }, [phase]);

  const total = durationFor(phase);
  const progress = secondsLeft / total;
  const radius = 148;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const size = 340;
  const accent = phaseAccent(phase);
  const isWorking = phase === 'work';

  return (
    <div className="relative mx-auto w-fit">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" key={key}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-ring-track"
          opacity={0.45}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={accent}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          style={{ opacity: running && progress < 1 ? 1 : progress < 1 ? 0.75 : 0 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-sm font-semibold uppercase tracking-[0.28em]"
          style={{ color: accent }}
        >
          {PHASE_LABEL[phase]}
        </span>
        <span className="mt-4 text-[104px] font-semibold tabular-nums tracking-tight leading-none lg:text-[120px]">
          {formatTime(secondsLeft)}
        </span>
        <span className="mt-4 text-sm text-muted-2">{PHASE_HINT[phase]}</span>
      </div>

      <div className="absolute inset-x-0 bottom-9 flex items-center justify-center gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: isWorking && i < workCount % 4 ? accent : 'rgb(var(--color-ring-track) / 0.6)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
