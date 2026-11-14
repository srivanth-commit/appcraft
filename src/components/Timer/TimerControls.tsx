import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

interface TimerControlsProps {
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ running, onStart, onPause, onReset, onSkip }: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        type="button"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-elevate/60 text-muted transition-all duration-200 hover:bg-elevate hover:text-text active:scale-90"
        onClick={onSkip}
        aria-label="Skip phase"
      >
        <SkipForward size={20} />
      </button>

      <button
        type="button"
        className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-primary text-white transition-all duration-200 hover:brightness-110 active:scale-95"
        style={{ boxShadow: '0 6px 28px rgb(var(--color-primary) / 0.35)' }}
        onClick={running ? onPause : onStart}
        aria-label={running ? 'Pause timer' : 'Start timer'}
      >
        {running ? <Pause size={30} fill="white" /> : <Play size={30} fill="white" className="ml-1" />}
      </button>

      <button
        type="button"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-elevate/60 text-muted transition-all duration-200 hover:bg-elevate hover:text-text active:scale-90"
        onClick={onReset}
        aria-label="Reset timer"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
}
