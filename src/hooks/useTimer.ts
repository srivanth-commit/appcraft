import { useEffect, useRef, useState } from 'react';
import type { Phase } from '../lib/pomodoro';
import { durationFor, isWork, nextPhase } from '../lib/pomodoro';

interface TimerOptions {
  activeTaskId: string | null;
  onWorkComplete: (taskId: string | null, durationMinutes: number) => Promise<void> | void;
  onPhaseChange?: (phase: Phase) => void;
}

export function useTimer({ activeTaskId, onWorkComplete, onPhaseChange }: TimerOptions) {
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(durationFor('work'));
  const [running, setRunning] = useState(false);
  const [workCount, setWorkCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const stateRef = useRef({ phase, running, workCount, activeTaskId });
  stateRef.current = { phase, running, workCount, activeTaskId };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        const { running: r } = stateRef.current;
        if (r) {
          pause();
        } else {
          start();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        reset();
      } else if (e.key === 'n' || e.key === 'N') {
        skip();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [running, phase]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    const { phase: p, running: r, workCount: wc, activeTaskId: t } = stateRef.current;
    if (!r) return;
    finishPhase(p, r, wc, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function finishPhase(p: Phase, _r: boolean, wc: number, t: string | null) {
    setRunning(false);
    startedAtRef.current = null;
    setSessionId(null);
    if (isWork(p)) {
      void onWorkComplete(t, durationFor('work'));
      const next = nextPhase('work', wc + 1);
      setWorkCount(wc + 1);
      setPhase(next);
      setSecondsLeft(durationFor(next));
      onPhaseChange?.(next);
      return;
    }
    setPhase('work');
    setSecondsLeft(durationFor('work'));
    onPhaseChange?.('work');
  }

  function beginSessionIfNeeded() {
    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      setSessionId(crypto.randomUUID());
    }
  }

  function start() {
    beginSessionIfNeeded();
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    startedAtRef.current = null;
    setSessionId(null);
    setSecondsLeft(durationFor(stateRef.current.phase));
  }

  function skip() {
    const { phase: p, workCount: wc } = stateRef.current;
    setRunning(false);
    startedAtRef.current = null;
    setSessionId(null);
    if (isWork(p)) {
      const next = nextPhase('work', wc + 1);
      setWorkCount(wc + 1);
      setPhase(next);
      setSecondsLeft(durationFor(next));
    } else {
      setPhase('work');
      setSecondsLeft(durationFor('work'));
    }
    onPhaseChange?.('work');
  }

  return {
    phase,
    secondsLeft,
    running,
    workCount,
    sessionId,
    start,
    pause,
    reset,
    skip,
  };
}