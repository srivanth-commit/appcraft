import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import type { Task } from '../../db/types';
import { TimerDisplay } from '../Timer/TimerDisplay';
import { TimerControls } from '../Timer/TimerControls';
import { StreakBadge } from '../Streak/StreakBadge';
import { useTimer } from '../../hooks/useTimer';
import { playChime } from '../../lib/sound';
import { ManualSessionForm } from '../History/ManualSessionForm';

interface TimerViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  onRecordSession: (taskId: string | null, minutes: number) => void;
  onRecordManualSession: (input: { taskId: string | null; startedAt: number; durationMinutes: number; note: string }) => Promise<void>;
  onReload: () => void;
  currentStreak: number;
}

export function TimerView({ tasks, activeTaskId, onSelectTask, onRecordSession, onRecordManualSession, onReload, currentStreak }: TimerViewProps) {
  const [loggingPast, setLoggingPast] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const timer = useTimer({
    activeTaskId,
    onWorkComplete: (taskId) => {
      playChime();
      return onRecordSession(taskId, 25);
    },
    onPhaseChange: () => {
      onReload();
    },
  });

  const activeLabel = tasks.find((t) => t.id === activeTaskId)?.title;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-10 animate-in pb-24 lg:pb-6">
      <StreakBadge current={currentStreak} />

      <section className="flex w-full flex-col items-center" aria-label="Pomodoro timer">
        <TimerDisplay phase={timer.phase} secondsLeft={timer.secondsLeft} running={timer.running} workCount={timer.workCount} />

        <TimerControls
          running={timer.running}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
          onSkip={timer.skip}
        />

        <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-muted-2">
          Space pause · R reset · N skip
        </p>

        <div className="mt-8 w-full max-w-sm">
          {activeTaskId ? (
            <button type="button" className="btn-ghost w-full justify-center text-sm" onClick={() => onSelectTask(null)}>
              Current task · <span className="font-semibold">{activeLabel}</span>
              <span className="ml-1 text-xs text-muted-2">(clear)</span>
            </button>
          ) : (
            <div className="relative">
              <button type="button" className="btn-ghost w-full justify-center text-sm" onClick={() => setShowTaskPicker((v) => !v)}>
                <ListChecks size={16} /> Select a task to track
              </button>
              {showTaskPicker && tasks.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border bg-surface p-2 shadow-lg z-10">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-elevate"
                      onClick={() => {
                        onSelectTask(task.id);
                        setShowTaskPicker(false);
                      }}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <button type="button" className="btn-ghost" onClick={() => setLoggingPast(true)}>
        Log a past session
      </button>

      {loggingPast && (
        <section className="card w-full animate-in overflow-hidden" aria-label="Log past focus session">
          <ManualSessionForm tasks={tasks} onSave={onRecordManualSession} onClose={() => setLoggingPast(false)} />
        </section>
      )}
    </div>
  );
}